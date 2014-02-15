(function(context, mapper) {

  "use strict";

  // local-global-sort-of-thing-object
  var globals = {};

  /**
   * Turn [[a],[b],[c,d]] into [a.b.c.d]
   */
  function arrayconcat() {
    var data = [];
    Array.prototype.slice.call(arguments).forEach(function(a) {
      data = data.concat(a);
    });
    return data;
  }

  /**
   * Helper function for computing ULONG checksums for data blocks
   */
  function computeChecksum(chunk) {
    var tally = 0;
    for(var i=0, last=chunk.length; i<last; i+=4) {
      tally += (chunk[i] << 24) + (chunk[i + 1] << 16) + (chunk[i + 2] << 8) + (chunk[i + 3]);
    }
    tally %= Math.pow(2,32);
    return tally;
  }

  /**
   * Get optimized ordering for the table data blocks
   */
  function getOptimizedTableOrder(sorted) {
    var preferred = ["head", "hhea", "maxp", "OS/2", "name", "cmap", "post", "CFF "],
        filtered = sorted.filter(function(v) {
          return preferred.indexOf(v) === -1;
        }),
        keys = preferred.concat(filtered);
    return keys;
  }

  /**
   * Helper function for optimizing the table directory for binary searches
   */
  function optimizeTableDirectory(data, TableModels, ordering, optimizedOrdering) {
    var numTables = optimizedOrdering.length,
        start = 12,
        end = start + numTables * 16,
        directoryBlock = data.slice(start, end),
        directoryBlocks = directoryBlock.join(",").match(/[^,]+(,[^,]+){15}/g).map(function(v) { return v.split(","); }),
        optimized = [];

    optimizedOrdering.forEach(function(tag) {
      var mapping = mapper.mappings.filter(function(r) { return r.name === tag + " table definition"})[0];
      mapping.start = 12 + optimized.length;
      optimized = optimized.concat(directoryBlocks[ordering.indexOf(tag)].map(function(v) { return parseInt(v); }));
      mapping.end = 12 + optimized.length;
    });

    return data.slice(0,start).concat(optimized).concat(data.slice(end));
  }

  /**
   * Generate the font's binary data
   */
  function buildSFNT(numTables, TableModels) {
    var maxPower = ((Math.log(numTables)/Math.log(2))|0),
        searchRange = Math.pow(2, maxPower) * 16,
        entrySelector = maxPower,
        rangeShift = numTables * 16 - searchRange,
        opentype = CHARARRAY("OTTO")
                   .concat(USHORT(numTables))
                   .concat(USHORT(searchRange))
                   .concat(USHORT(entrySelector))
                   .concat(USHORT(rangeShift)),
        opentype_len = opentype.length,
        headers = [],
        headers_len = numTables * 16,
        fontdata = [],
        fontchecksum = 0,
        tabledataoffset = opentype_len + headers_len,
        checksumoffset = 0;

    /**
     * This is run once, for each table
     */
    var processTag = function(tag) {
      var table = TableModels[tag];
      // we're computing offset based on a running tally
      var offset = fontdata.length;
      if(tag==="head") {
        checksumoffset = tabledataoffset + offset + 8;
      }
      // serialize all records in the table
      var data = [];
      var currentOffset = tabledataoffset + offset;
      data = data.concat(serialize(table, mapper, tag, currentOffset));
      var length = data.length;
      mapper.addMapping(tag + " table data", currentOffset, currentOffset + length, "sfnt table");

      // ensure we preserve LONG alignment, by padding tables if need be.
      while(data.length % 4 !== 0) { data.push(0); }
      fontdata = fontdata.concat(data);

      // compute the table's checksum as a sum of ULONG values
      // (which explains why we needed the LONG alignment).
      var checksum = computeChecksum(data);
      fontchecksum += checksum;

      // and then update the OpenType header with the table's 16 byte record
      var table_entry = CHARARRAY(tag)
                       .concat(ULONG(checksum))
                       .concat(ULONG(opentype_len + headers_len + offset))
                       .concat(ULONG(length));

      mapper.addMapping(tag + " table definition", opentype_len + headers.length, opentype_len + headers.length + 16, "sfnt");
      headers = headers.concat(table_entry);
    };

    mapper.addMapping("sfnt header", 0, 12, "sfnt");

    // custom-order the tables, see "Optimized Table Ordering" at
    // http://www.microsoft.com/typography/otspec140/recom.htm
    var sorted = Object.keys(TableModels).sort(),
        optimized = getOptimizedTableOrder(sorted);

    // build the fontdata by running through all tables
    var data = (function(){
      optimized.forEach(processTag);
      var data = opentype.concat(headers).concat(fontdata);
      // Also, for binary searching the table directory, reorder the directory
      // in ASCII-alphabetical order (capital A-Z first, lowercase a-z second).
      return optimizeTableDirectory(data, TableModels, optimized, sorted);
    }());

    // We're almost done, but we still need to compute the full font's checksum.
    // This one's tricky, and the algorithm for computing all checksums is:
    //
    //  1. Set the checkSumAdjustment to 0.
    //  2. Calculate the checksum for all the tables including the 'head' table and enter that value into the table directory.
    //  3. Calculate the checksum for the entire font.
    //  4. Subtract that value from the hex value B1B0AFBA.
    //  5. Store the result in checkSumAdjustment
    //

    // Now, we've already done steps 1 and 2, so: next are steps 3 and 4:
    var checksum = 0xB1B0AFBA - computeChecksum(data);
    checksum += Math.pow(2,32); // Add first, because mod on a negative...
    checksum %= Math.pow(2,32); // ...would yield a negative in JavaScript.
    checksum = ULONG(checksum);

    // And then step 5:
    var head = data.slice(0, checksumoffset),
        tail = data.slice(checksumoffset + 4);
    return head.concat(checksum).concat(tail);
  }

  /**
   * repackage an SFNT block as WOFF
   */
  function formWOFF(data, numTables) {

    var HEADER = [
        ["signature", CHARARRAY, "this has to be the string 'wOFF'...", "wOFF"]
      , ["flavour", CHARARRAY, "The sfnt version of the wrapped font", "OTTO"]
      , ["length", ULONG, "Total size of the WOFF file (placeholder, we compute this later).", 0x00000000]
      , ["numTables", USHORT, "Number of entries in the directory of font tables.", numTables]
      , ["reserved", USHORT, "this must be set to zero", 0]
      , ["totalSfntSize", ULONG, "Total size needed for the uncompressed original font", data.length]
      , ["majorVersion", USHORT, "Major version of the WOFF file (1 in this case).", 1]
      , ["minorVersion", USHORT, "Minor version of the WOFF file (0 in this case).", 0]
      , ["metaOffset", ULONG, "Offset to metadata block, from beginning of WOFF file. We don't use one", 0]
      , ["metaLength", ULONG, "Length of compressed metadata block. This is obviously 0", 0]
      , ["metaOrigLength", ULONG, "Uncompressed size of metadata block. Also 0, of course.", 0]
      , ["privOffset", ULONG, "Offset to private data block, from beginning of WOFF file. We don't use one", 0]
      , ["privLength", ULONG, "Length of private data block. Also obviously 0", 0]
    ];

    var woff_header = serialize(HEADER),
        woff_dictionary = [],
        woff_data = [],
        woffset = woff_header.length + numTables * 20,
        woff;

    // build the woff table directory by copying the sfnt table
    // directory entries and duplicating the length value: we
    // are allowed to form uncompressed WOFF files, and do so.
    for(var i=0, last=numTables, chunk, entry; i<last; i++) {
      chunk = data.slice(12+i*16, 12 + (i+1)*16);
      var entry = serialize([
          ["tag", LITERAL, "tag name", chunk.slice(0,4)]
        , ["offset", ULONG, "Offset to the data, from beginning of WOFF file", woffset + woff_data.length]
        , ["compLength", LITERAL, "length of the compressed data table", chunk.slice(12,16)]
        , ["origLength", LITERAL, "length of the original uncompressed data table", chunk.slice(12,16)]
        , ["origChecksum", LITERAL, "orginal table checksum", chunk.slice(4,8)]
      ]);
      woff_dictionary = woff_dictionary.concat(entry);
      var otf_offset = decodeULONG(chunk.slice(8,12)),
          otf_length = decodeULONG(chunk.slice(12,16)),
          table_data = data.slice(otf_offset, otf_offset+otf_length);
      woff_data = woff_data.concat(table_data);
      while(woff_data.length % 4 !== 0) { woff_data.push(0); }
    }

    // finalise the header by recording the correct length for the font
    // (note that changing the value won't change the number of bytes).
    woff = woff_header.concat(woff_dictionary).concat(woff_data);
    HEADER[2][3] = woff.length;

    // done. WOFF is thankfully fairly straight-forward
    return serialize(HEADER).concat(woff_dictionary).concat(woff_data);
  }

  /**
   * Create a font. The options are... pretty self explanatory
   */
  var buildFont = function(options) {

    // make sure the options are good.
    if(!options.outline) { throw new Error("No outline was passed to build a font for"); }

    // Extract the font-global strings
    globals = {
        vendorId: " =) "
      , fontFamily: options.fontFamily || "Custom"
      , subfamily: options.subfamily || "Regular"
      , fontName: options.fontName || "Custom Glyph Font"
      , compactFontName: options.compactFontName || "customfont"
      , fontVersion: options.fontVersion || "Version 1.0"
      , copyright: options.copyright || "License-free"
      , trademark: options.trademark || "License-free"
      , license: options.license || "License-free"
      , glyphName: options.glyphName || "~"
      , glyphCode: "~".charCodeAt(0)
      , quadSize: options.quadSize || 1024
      , label: options.label || false
    };

    var letters = false;
    if(globals.label) {
      letters = [];
      globals.label.split('').forEach(function(l) {
        if(letters.indexOf(l) === -1) {
          letters.push(l);
        }
      });
      letters.push(String.fromCharCode(globals.glyphCode));
      letters.sort();
      globals.letters = letters;
    }

    // FIXME: this does not generate the most compact charstring at the moment.
    (function convertOutline(options, globals) {
      var outline = options.outline;
      var sections = outline.match(/[MmLlCcZz]\s*([\-\d]+\s*)*/g).map(function(s){return s.trim()});
      var mx = 99999999, MX=-99999999, my=mx, MY=MX;
      var x=0, y=0, cx=false, cy=false, i=0, last=0;
      var charstring = [];
      var terminated = false;

      var mark = function(x,y) {
        if(x < mx) { mx = x; }
        if(y < my) { my = y; }
        if(x > MX) { MX = x; }
        if(y > MY) { MY = y; }
      }

      sections.forEach(function(d) {
        var op = d.substring(0,1);
        var values = d.substring(1).trim().split(/\s+/).map(function(v) { return parseInt(v); });

        // first, make all sections relative coordinates (if absolute)
        if(op === op.toUpperCase()) {
          op = op.toLowerCase();
          if(op === 'm') {
            values[0] -= x; x += values[0];
            values[1] -= y; y += values[1];
            mark(x,y);
          }
          else if(op === 'l') {
            for(i=0, last=values.length; i<last; i+=2) {
              values[i+0] -= x; x += values[i+0];
              values[i+1] -= y; y += values[i+1];
              mark(x,y);
            }
          }
          else if(op === 'c') {
            for(i=0, last=values.length; i<last; i+=6) {
              cx = x + values[i+2];
              cy = y + values[i+3];
              values[i+0] -= x;
              values[i+1] -= y;
              values[i+2] -= x;
              values[i+3] -= y;
              values[i+4] -= x; x += values[i+4];
              values[i+5] -= y; y += values[i+5];
              mark(x,y);
            }
          }
        }

        // then convert the data to Type2 charstrings
        if(op === 'm') {
          charstring = charstring.concat( NUMBER(values[0]).concat(NUMBER(values[1])).concat(OPERAND(21)) );
        }
        else if(op === 'l') {
          for(i=0, last=values.length; i<last; i+=2) {
            charstring = charstring.concat( NUMBER(values[i]).concat(NUMBER(values[i+1])).concat(OPERAND(5)) );
          }
        }
        else if(op === 'c') {
          for(i=0, last=values.length; i<last; i+=6) {
            charstring = charstring.concat(
              NUMBER(values[i+0])
              .concat(NUMBER(values[i+1]))
              .concat(NUMBER(values[i+2]))
              .concat(NUMBER(values[i+3]))
              .concat(NUMBER(values[i+4]))
              .concat(NUMBER(values[i+5]))
              .concat(OPERAND(8))
            );
          }
        }
        else if(op === 'z') {
          charstring = charstring.concat(OPERAND(14));
          terminated = true;
        }
        else {
          // FIXME: add 's' and 'a' support
          throw "op "+op+" not supported at this time."
        }
      });

      if(!terminated) {
        charstring = charstring.concat(OPERAND(14));
      }

      // bounding box
      options.xMin = mx;
      options.yMin = my;
      options.xMax = MX;
      options.yMax = MY;

      // If the glyph is wider than the default width, we can note this
      // by recording [nominal - true] width as first charstring value.
      // Note: both default and nominal width are defined as options.xMax in this font.
      if(MX != options.xMax) { charstring = NUMBER(options.xMax - MX).concat(charstring); }
      options.charString = charstring;

    }(options, globals));


    /***
     *
     * CFF DATA DESCRIPTION (See Adobe's technical note 5176)
     *
     **/


    // helper function
    var generateOffsets = function(records, size) {
      size = size || 1;
      var tally = 1,
          idx = 0,
          data= [],
          bytes;
      records.forEach(function(record) {
        data.push([""+idx++, OffsetX[size], "Offset "+idx, tally]);
        bytes = record[1](record[3]);
        tally += bytes.length;
      });
      data.push(["last", OffsetX[size], "last offset", tally]);
      return data;
    };

    // record the data mappings for HTML styling, etc.
    var recordMappings = function(cff) {
      var s = 0, e = 0, i=0;
      for(i=0; i<cff.length; i++) {
        s = e;
        e += serialize(cff[i]).length;
        mapper.addMapping(cff[i][0], s, e, "cff");
      }
    };

    /**
     * This part sets up data that, as it is inserted, may require more
     * bytes to encode than initially guessed, and as such requires updating
     * the values already found in the Top DICT.
     */
    var processDynamicCFFData = function(cff) {

      var cff_end = serialize(cff).length;
      var top_dict_data = cff[2][1][3][1];

      var glyphs = [["0", SID, "single entry array for our glyph, which is custom SID 4", 394]];
      if(globals.letters) {
        glyphs = globals.letters.map(function(letter, idx) {
          return [""+idx, SID, "SID for letter "+letter, 394 + idx];
        });
      }

      var charset = ["charset", [
        ["format", BYTE, "we use the simplest format", 0]
      , ["glyphs", glyphs]
      ]];

      var codes = [];//["0", BYTE, "encoding for glyph 0", 0]];
      if(globals.letters) {
        codes = codes.concat(globals.letters.map(function(letter, idx) {
          return [""+idx, BYTE, "encoding for glyph "+idx+" ("+letter+")", idx+1];
        }));
      } else { codes.push(["1", BYTE, "encoding for glyph 1", 1]); }

      var encoding = ["encoding", [
        ["format", BYTE, "we use the encoding best suited for randomly ordered glyphs", 0]
      , ["nCodes", BYTE, "number of encoded glyphs (not counting .notdef)", codes.length]
      , ["codes", codes]
      ]];

      var dim = (globals.quadSize * 0.7)|0;

      var charstrings = [[".notdef", DICTINSTRUCTION, "the outline for .notdef", OPERAND(14)]];
      if(globals.letters) {
        globals.letters.forEach(function(letter, idx) {
          if(idx < globals.letters.length-1) {
            charstrings.push([letter, DICTINSTRUCTION, "the outline for "+letter, OPERAND(14)]);
          }
        });
      }
      charstrings.push(["our letter", DICTINSTRUCTION, "the outline for our own glyph", options.charString]);

      var charstring_raw = serialize(charstrings);
      var charstring_offsize = charstring_raw.length > 255 ? 2 : 1;
      var charstring_index = ["charstring index", [
        // this is the part that actually contains the characters outline data,
        // encoded as Type 2 charstrings (one charstring per glyph).
        ["count", Card16, "how many charstrings? (including .notdef", charstrings.length],
      , ["offSize", OffSize, "how many bytes do we need for offsets?", charstring_offsize]
      , ["offset", generateOffsets(charstrings, charstring_offsize)]
      , ["charstrings", charstrings]
      ]];

      var private_dict = ["private dict", [
        ["BlueValues", DICTINSTRUCTION, "empty array (see Type 1 font format, pp 37)",
          NUMBER(0).concat(NUMBER(0)).concat(OPERAND(6))
        ]
      , ["FamilyBlues", DICTINSTRUCTION, "idem dito",
          NUMBER(0).concat(NUMBER(0)).concat(OPERAND(8))
        ]
      , ["StdHW", DICTINSTRUCTION, "dominant horizontal stem width. We set it to 10",
          NUMBER(10).concat(OPERAND(10))
        ]
      , ["StdVW", DICTINSTRUCTION, "dominant vertical stem width. We set it to 10",
          NUMBER(10).concat(OPERAND(11))
        ]
        // forgetting the following two versions breaks Chrome. This is quite
        // interesting, as Chrome and Firefox both supposedl use OTS for their
        // sanitization. This is, in fact, so interesting that it gives us a
        // good test case for font-compatibility of browsers.
      , ["defaultWidthX", DICTINSTRUCTION, "default glyph width",
          NUMBER(options.xMax).concat(OPERAND(20))
        ]
      , ["nominalWidthX", DICTINSTRUCTION, "nominal width used in width correction",
          NUMBER(options.xMax).concat(OPERAND(20))
        ]
      ]];

      var private_dict_length = serialize(private_dict).length;

      // tentatively figure out the offsets for each block
      var charset_offset = cff_end,
          encoding_offset = charset_offset + serialize(charset).length,
          charstring_index_offset = encoding_offset + serialize(encoding).length,
          private_dict_offset = charstring_index_offset + serialize(charstring_index).length;

      // if we need to encode these values, how many bytes would they take up?
      // We assumed 1 + 1 + 2 in the top dict. We need to check if we were, and
      // then by how much. However, because updating the number of bytes
      // necessary to encode the values also increases the values (since they
      // represent offset) we need to recompute until stable.
      var bytediff = 0;
      (function() {
        var byteCount,
            oldCount = 5,
            shift = 0,
            getByteCount = function() {
              byteCount = NUMBER(charset_offset)
                         .concat(NUMBER(encoding_offset))
                         .concat(NUMBER(charstring_index_offset))
                         .concat(NUMBER(private_dict_length))
                         .concat(NUMBER(private_dict_offset))
                         .length;
              return byteCount;
            };

        while(getByteCount() > oldCount) {
          shift = byteCount - oldCount;
          oldCount = byteCount;
          bytediff += shift;
          charset_offset += shift;
          encoding_offset += shift;
          charstring_index_offset += shift;
          private_dict_offset += shift;
        }
      }());

      // With our stable offsets, update the charset, charstrings, and
      // private dict offset values in the top dict data block
      top_dict_data[6][3] = NUMBER(charset_offset).concat(OPERAND(15));
      top_dict_data[7][3] = NUMBER(encoding_offset).concat(OPERAND(16));
      top_dict_data[8][3] = NUMBER(charstring_index_offset).concat(OPERAND(17));
      top_dict_data[9][3] = NUMBER(private_dict_length).concat(NUMBER(private_dict_offset)).concat(OPERAND(18));

      // and of course, also update the top dict index's "last" offset, as that might be invalid now, too.
      cff[2][1][2][1][1][3] += bytediff;

      cff.push(charset);
      cff.push(encoding);
      cff.push(charstring_index);
      cff.push(private_dict);
    };

    var createCFF = function() {
      // be mindful of the fact that there are 390 predefined strings (see appendix A, pp 29)
      var strings = [
          ["version", CHARARRAY, "font version string; string id 391", globals.fontVersion]
        , ["full name", CHARARRAY, "the font's full name (id 392)", globals.fontName]
        , ["family name", CHARARRAY, "the font family name (id 393)", globals.fontFamily]
      ];

      if(globals.letters) {
        globals.letters.forEach(function(letter, idx) {
          if(idx < globals.letters.length) {
            strings.push([letter, CHARARRAY, "the letter "+letter+ " (id "+(394+idx)+")", letter]);
          }
        });
      } else { strings.push(["our glyph", CHARARRAY, "our custom glyph (id 394)", globals.glyphName]); }

      // the top dict contains "global" metadata
      var top_dict_data = [
          ["version", DICTINSTRUCTION, "", NUMBER(391).concat(OPERAND(0))]
        , ["full name", DICTINSTRUCTION, "", NUMBER(392).concat(OPERAND(2))]
        , ["family name", DICTINSTRUCTION, "", NUMBER(393).concat(OPERAND(3))]
        , ["weight", DICTINSTRUCTION, "", NUMBER(389).concat(OPERAND(4))]
        , ["uniqueID", DICTINSTRUCTION, "", NUMBER(1).concat(OPERAND(13))]
        , ["FontBBox", DICTINSTRUCTION, "",
            NUMBER(options.xMin).concat(NUMBER(options.yMin)).concat(NUMBER(options.xMax)).concat(NUMBER(options.yMax)).concat(OPERAND(5))
          ]
          // these instruction can't be properly asserted until after we pack up the CFF, so we use placeholder values
        , ["charset", DICTINSTRUCTION, "offset to charset (from start of file)", [0x00, 0x00]]
        , ["encoding", DICTINSTRUCTION, "offset to encoding (from start of file)", [0x00, 0x00]]
        , ["charstrings", DICTINSTRUCTION, "offset to charstrings (from start of file)", [0x00, 0x00]]
        , ["private", DICTINSTRUCTION, "'size of', then 'offset to' (from start of file) the private dict", [0x00, 0x00, 0x00]
      ]];

      var top_dict_offsize = serialize(top_dict_data).length < 255 ? 1 : 2;

      // our main CFF block
      var absolute_offset_size = 1; // we set this to the correct value at the end
      var cff = [
        ["header", [
            ["major", Card8, "major version", 1]
          , ["minor", Card8, "minor version", 0]
          , ["length", Card8, "header length in bytes", 4]
          , ["offSize", OffSize, "how many bytes for an offset value?", absolute_offset_size]
        ]],
        ["name index", [
            ["count", Card16, "number of stored names (We only have one)", 1]
          , ["offSize", OffSize, "offsets use 1 byte", 1]
            // there are (count+1) offsets: the first offset is always 1, and the last offset marks the end of the table
          , ["offset", [
              ["0", OffsetX[1], "first offset, relative to the byte preceding the data block", 1]
            , ["1", OffsetX[1], "offset to end of the data block", (1 + "customfont".length)]]]
            // object data
          , ["data", CHARARRAY, "we only include one name, namely the compact font name", globals.compactFontName]
            // fun fact: the compactFontName must be at least 10 characters long before Firefox accepts the font
        ]],
        ["top dict index", [
            ["count", Card16, "top dicts store one 'thing' by definition", 1]
          , ["offSize", OffSize, "offsets use 1 bytes in this index", top_dict_offsize]
          , ["offset", [
              ["0", OffsetX[top_dict_offsize], "first offset", 1]
            , ["1", OffsetX[top_dict_offsize], "end of data black", 1 + serialize(top_dict_data).length]
          ]]
          , ["top dict data", top_dict_data]
        ]],
        ["string index", [
            ["count", Card16, "number of stored strings", strings.length]
          , ["offSize", OffSize, "offsets use 1 byte", 1]
          , ["offset", generateOffsets(strings, 1)]
          , ["strings", strings]
        ]],
        ["global subroutine index", [
            ["count", Card16, "no global subroutines, so count is 0 and there are no further index values", 0]
        ]]
      ];

      processDynamicCFFData(cff);
      recordMappings(cff);

      // fix the "absolute_offset_size" value
      var serialized = serialize(cff);
      cff[0][1][3][3] = (function getBytesNeeded(v) {
        var bits = Math.log(v)/Math.log(2);
        return Math.ceil(bits/8);
      }(serialized.length));

      return cff;
    };


    /***
     *
     * SFNT/OpenType DATA DESCRIPTION (See http://www.microsoft.com/typography/otspec/default.htm)
     *
     **/


    /**
     * The name table is an amazing bit of legacy data from a time when
     * macintosh and windows were properly different beasts, and the idea
     * of "encoding the encoding" (to say that strings are in ASCII or UTF8
     * or ...) wasn't even on the table. Macintosh strings are in ASCII,
     * windows strings are in UTF16. The result? For strings that keep to
     * ASCII, this table could be 1/3rd the size if we didn't need to duplicate
     * the data in windows's amazing UTF16 encoding scheme. Those bytes add up.
     */
    function setupNameTableData() {
      context.NAMESTRINGS = [];

      // See the 'Name IDs' section on http://www.microsoft.com/typography/otspec/name.htm for
      // the details on which strings we can encode, and what their associated ID must be.
      var strings = {
                                  //  "0" = copyright text (irrelevant for our purpose)
        "1": globals.fontFamily,  //      = font name
        "2": globals.subfamily,   //      = font subfamily name
                                  //  "3" = the unique font identifier (irrelevant for our purpose)
        "4": globals.fontName,    //      = full font name
        "5": globals.fontVersion, //      = font version. "Preferred" format is "Version \d+.\d+; specifics"
                                  //  "7" = trademark text (irrelevant for our purpose)
                                  // "13" = a tl;dr. version of the font's license (irrelevant for our purpose)
      };

      var macRecords = [],
          macHeader = [
            ["platform", USHORT, "macintosh", 1]
          , ["encoding", USHORT, "uninterpreted", 32]
          , ["language", USHORT, "english (a bit nonsense if we're uninterpreted)", 0]];

      var winRecords = [],
          winHeader = [
            ["platform", USHORT, "windows", 3]
          , ["encoding", USHORT, "Unicode BMP (UCS-2)", 1]
          , ["language", USHORT, "US english (a bit nonsense if we're doing unicode)", 0x0409]];

      // build all the name records.
      var offset = 0;
      var nameRecordPartial = [];
      Object.keys(strings).forEach(function(key) {
        var string = strings[key];
        var recordId = parseInt(key, 10);

        // Encode string as standard ASCII for mac:
        nameRecordPartial = [
            ["recordID", USHORT, "See the 'Name IDs' section on http://www.microsoft.com/typography/otspec/name.htm for details", recordId]
          , ["length", USHORT, "the length of this string", string.length]
          , ["offset", USHORT, "offset for this string in the string heap", offset]
        ];
        macRecords.push(macHeader.concat(nameRecordPartial));
        NAMESTRINGS.push([string + " (ascii)", CHARARRAY, "mac version of "+string, string]);
        offset += string.length;

        // And encode the same string but then in UTF16 for windows.
        // This leads to name data that is 300% the size of what it
        // could be if Windows would simply read the Mac records
        // in absence of windows records. But that is too good to happen.
        var ustring = atou(string);
        nameRecordPartial = [
            ["recordID", USHORT, "See the 'Name IDs' section on http://www.microsoft.com/typography/otspec/name.htm for details", recordId]
          , ["length", USHORT, "the length of this string", ustring.length]
          , ["offset", USHORT, "offset for this string in the string heap", offset]
        ];
        winRecords.push(winHeader.concat(nameRecordPartial));
        NAMESTRINGS.push([string + " (utf16)", CHARARRAY, "windows version of "+string, ustring]);
        offset += ustring.length;
      });

      context.NAMERECORDS = macRecords.concat(winRecords);
      return NAMERECORDS.length;
    }

    /**
     * define our cmap subtable format 4
     */
    function setupCmapFormat4() {

      var segments = (function formSegments() {
        var endCount = [],
            startCount = [],
            idDelta = [],
            idRangeOffset = [],
            glyphIdArray = [];

        glyphIdArray.push(["0", USHORT, "Our first glyphId points to .notdef", 0]);

        if(globals.letters) {
          var codes = globals.letters.map(function(l) {
            return l.charCodeAt(0);
          });
          codes.forEach(function(code, i) {
            var singleton = ["characterCode ", USHORT, "our glyph", code],
                idx = 1 + i;
            endCount.push(singleton);
            startCount.push(singleton);
            idDelta.push([""+i, SHORT, "delta for the segment", -(code - idx)]);
            idRangeOffset.push([""+i, USHORT, "range offset for segment 1", 0]);
            glyphIdArray.push([""+idx, USHORT, "Our second glyphId points to our own glyph", idx]);
          });
        }

        else {
          var singleton = ["characterCode ", USHORT, "our glyph", globals.glyphCode]
          endCount.push(singleton);
          startCount.push(singleton);
          idDelta.push(["0", SHORT, "delta for segment 1", -(globals.glyphCode - 1)]); // point to glyphid index 1 (0 is .notdef)
          idRangeOffset.push(["0", USHORT, "range offset for segment 1", 0]);
          idRangeOffset.push(["0", USHORT, "bogus last segment value", 0]);
          glyphIdArray.push(["1", USHORT, "Our second glyphId points to our own glyph", 1]);
        }

        var terminator = ["characterCode ", USHORT, "array terminator 0xFFFF", 0xFFFF];
        endCount.push(terminator);
        startCount.push(terminator);
        idDelta.push(["0", SHORT, "final segment value", 1]);
        idRangeOffset.push(["last", USHORT, "last range offset", 0]);

        return {
          endCount: endCount,
          startCount: startCount,
          idDelta: idDelta,
          idRangeOffset: idRangeOffset,
          glyphIdArray: glyphIdArray
        }
      }());

      var segCount = segments.endCount.length,
          segCountX2 = segCount * 2,
          searchRange = 2 * Math.pow(2, Math.floor(Math.log(segCount)/Math.log(2))),
          entrySelector = Math.log(searchRange/2)/Math.log(2),
          rangeShift = segCountX2 - searchRange;

      // finally, form cmap subtable
      context.SUBTABLE4 = [
          ["format", USHORT, "format 4 subtable", 4]
        , ["length", USHORT, "table length in bytes", 0x0000]
        , ["language", USHORT, "language", 0]
          // The following four values all derive from an implicitly
          // encoded value called "segCount", representing the number
          // of segments that this subtable format 4 cmap has.
          // Silly as it may seem, these values must be 100% correct,
          // and cannot, in any way, be omitted. I don't like it.
        , ["segCountX2", USHORT, "2x segment count", segCountX2]
        , ["searchRange", USHORT, "search range: 2 * (2^floor(log2(segCount)))", searchRange]
        , ["entrySelector", USHORT, "entry selector: log2(searchRange/2)", entrySelector]
        , ["rangeShift", USHORT, "range shift: 2x segment count - search range", rangeShift]
          // endCount[segCount]
        , ["endCount", segments.endCount]
        , ["reservedPad", USHORT, "a 'reserve pad' value; must be 0", 0]
          // startCount[segCount]
        , ["startCount", segments.startCount]
          // the following two values are val[segcount]
        , ["idDelta", segments.idDelta]
        , ["idRangeOffset", segments.idRangeOffset]
        , ["glyphIdArray", segments.glyphIdArray]
      ];

      context.SUBTABLE4[1][3] = serialize(context.SUBTABLE4).length;

      // we call this function expecting it to report how many subtables are used in the font.
      return 1;
    }

    function formHMTX() {
      // first entry longHorMetric (notdef)
      var hmtx = [  ["0", [["advanceWidth", USHORT, "", 0] , ["lsb", SHORT, "", 0]]]  ];
      if(globals.letters) {
        globals.letters.forEach(function(letter, idx) {
          if(idx < globals.letters.length-1) {
            hmtx.push( [""+idx, [["advanceWidth", USHORT, "", 0] , ["lsb", SHORT, "", 0]]] );
          }
        });
      }
      hmtx.push(["glyph", [["advanceWidth", USHORT, "", options.xMax - options.xMin] , ["lsb", SHORT, "", 0]]]);
      return hmtx;
    }

    // OpenType tables
    var TableModels = {
      "CFF ": createCFF()
      ,
      "OS/2": [
          ["version", USHORT, "OS/2 table version 3 (to pass MS Font Validator)", 0x0003]
        , ["xAvgCharWidth", SHORT, "xAvgCharWidth", 0]
        , ["usWeightClass", USHORT, "usWeightClass", 400]
        , ["usWidthClass", USHORT, "usWidthClass", 1]
        , ["fsType", USHORT, "this value defineds embedding/install properties. 0 = no restrictions", 0]
          // we don't really care about the sub/super/strikeout values
        , ["ySubscriptXSize", SHORT, "", 0]
        , ["ySubscriptYSize", SHORT, "", 0]
        , ["ySubscriptXOffset", SHORT, "", 0]
        , ["ySubscriptYOffset", SHORT, "", 0]
        , ["ySuperscriptXSize", SHORT, "", 0]
        , ["ySuperscriptYSize", SHORT, "", 0]
        , ["ySuperscriptXOffset", SHORT, "", 0]
        , ["ySuperscriptYOffset", SHORT, "", 0]
        , ["yStrikeoutSize", SHORT, "", 0]
        , ["yStrikeoutPosition", SHORT, "", 0]
          // standard font = font classification 0 ("Regular")
        , ["sFamilyClass", SHORT, "sFamilyClass", 0]
          // Oh look! A trademarked classification system the bytes
          // for which cannot be legally set unless you pay HP.
          // Why this is part of the OS/2 table instead of its own
          // proprietary table I will likely never truly know.
        , ["panose", [
          , ["bFamilyType", BYTE, "", 0]
          , ["bSerifStyle", BYTE, "", 0]
          , ["bWeight", BYTE, "", 0]
          , ["bProportion", BYTE, "", 0]
          , ["bContrast", BYTE, "", 0]
          , ["bStrokeVariation", BYTE, "", 0]
          , ["bArmStyle", BYTE, "", 0]
          , ["bLetterform", BYTE, "", 0]
          , ["bMidline", BYTE, "", 0]
          , ["bXHeight", BYTE, "", 0]
        ]]
        // we only encode the letter 'A' in the latin block,
        // so we set bit 1 of a 128 bit sequence
        , ["ulUnicodeRange1", ULONG, "", 0x00000001]
        , ["ulUnicodeRange2", ULONG, "", 0]
        , ["ulUnicodeRange3", ULONG, "", 0]
        , ["ulUnicodeRange4", ULONG, "", 0]
        , ["achVendID", CHARARRAY, "vendor id (http://www.microsoft.com/typography/links/vendorlist.aspx for the 'real' list)", globals.vendorId]
          // bit 6 is high for 'Regular font'
        , ["fsSelection", USHORT, "font selection flag: bit 6 (lsb=0) is high, to indicate 'regular font'.", 0x0040]
        , ["usFirstCharIndex", USHORT, "first character to be in this font.", globals.label ? globals.letters[0].charCodeAt(0) : globals.glyphCode]
        , ["usLastCharIndex", USHORT, "last character to be in this font.", globals.glyphCode]
          // vertical metrics: see http://typophile.com/node/13081 for how the hell these work.
          // (short version: they don't, it's an amazing mess)
        , ["sTypoAscender", SHORT, "typographic ascender", options.yMax]
        , ["sTypoDescender", SHORT, "typographic descender", options.yMin]
        , ["sTypoLineGap", SHORT, "line gap", globals.quadSize - options.yMax + options.yMin]
        , ["usWinAscent", USHORT, "usWinAscent", globals.quadSize + options.yMin]
        , ["usWinDescent", USHORT, "usWinDescent", (globals.quadSize - options.yMax)]
        , ["ulCodePageRange1", ULONG, "", 0x00000001]
        , ["ulCodePageRange2", ULONG, "", 0]
          // In order for the font to work in browsers, the OS/2 table needs to be version
          // 4. In a bizar twist of "why?", this means we NEED to specify the following five
          // values, except we are allowed to set them to 0 to indicate we don't care about them.
        , ["sxHeight", SHORT, "", 0]
        , ["sCapHeight", SHORT, "", 0]
        , ["usDefaultChar", USHORT, "", 0]
          // we have no break char, but we must point to a "not .notdef" glyphid to
          // validate as "legal font". Normally this would be the 'space' glyphid,
          // but in this case we're using the space code, 0x20, as our real glyph.
        , ["usBreakChar", USHORT, "", globals.glyphCode]
          // We have plain + ligature use, therefore there are 2 contexts
        , ["usMaxContext", USHORT, "", globals.label !== false ? globals.label.length : 0]
      ],
      "cmap": [
          ["version", USHORT, "cmap main version", 0]
        , ["numTables", USHORT, "number of subtables",setupCmapFormat4()]
          // Note that we're hard-wiring cmap here for a single table.
          // this is NOT the usual layout for a cmap table!
        , ["platformID", USHORT, "platform", 3] // windows
        , ["encodingID", USHORT, "encoding", 1] // default Unicode BMP (UCS-2)
        , ["offset", ULONG, "table offset from cmap-start", 12]
          // subtable start
        , ["subtable format 4", SUBTABLE4]
      ],
      "head": [
          ["version", FIXED, "table version", 0x00010000]
        , ["fontRevision", FIXED, "font version", 0x00010000]
        , ["checkSumAdjustment", ULONG, "0xB1B0AFBA minus (sum of entire font as ULONGs)", 0]
        , ["magicNumber", ULONG, "OpenType magic number, used to verify this is, in fact, an OpenType font", 0x5F0F3CF5]
        , ["flags", USHORT, "flags, see http://www.microsoft.com/typography/otspec/head.htm", 0]
        , ["unitsPerEM", USHORT, "how big is our quad, in font units", globals.quadSize]
        , ["created", LONGDATETIME, "date created", 0]
        , ["modified", LONGDATETIME, "date modified", 0]
        , ["xMin", SHORT, "global xMin", options.xMin]
        , ["yMin", SHORT, "global yMin", options.yMin]
        , ["xMax", SHORT, "global xMax", options.xMax]
        , ["yMax", SHORT, "global yMax", options.yMax]
        , ["macStyle", USHORT, "font style, according to old Apple mac rules", 0]
        , ["lowestRecPPEM", USHORT, "smallest readable size in pixels. We claim 8px for no real reason", 8]
        , ["fontDirectionHint", SHORT, "deprecated value (font direction hint). must be 0x0002", 2]
          // these two values do not apply to CFF fonts, yet are necessary for some reason
        , ["indexToLocFormat", SHORT, "offset datatype (we use 0, for SHORT offsets", 0]
        , ["glyphDataFormat", SHORT, "glyph data format. default value = 0", 0]
      ],
      "hhea": [
          ["version", FIXED, "table version", 0x00010000]
        , ["Ascender", FWORD, "typographic ascender", globals.quadSize + options.yMin]
        , ["Descender", FWORD, "typographic descender", -(globals.quadSize - options.yMax)]
        , ["LineGap", UFWORD, "Typographic line gap", 0]
        , ["advanceWidthMax", FWORD, "Maximum advance width value in 'hmtx' table.", options.xMax - options.xMin]
        , ["minLeftSideBearing", FWORD, "Minimum left sidebearing value in 'hmtx' table.", 0]
        , ["minRightSideBearing", FWORD, "Minimum right sidebearing value; calculated as Min(aw - lsb - (xMax - xMin)).", 0]
        , ["xMaxExtent", FWORD, "Max(lsb + (xMax - xMin))", options.xMax - options.xMin]
        , ["caretSlopeRise", SHORT, "Used to calculate the slope of the cursor (rise/run); 1 for vertical.", 0]
        , ["caretSlopeRun", SHORT, "0 for vertical.", 0]
        , ["caretOffset", SHORT, "The amount by which a slanted highlight on a glyph needs to be shifted to produce the best appearance. Set to 0 for non-slanted fonts", 0]
        , ["_reserved1", SHORT, "reserved; must be 0", 0]
        , ["_reserved2", SHORT, "reserved; must be 0", 0]
        , ["_reserved3", SHORT, "reserved; must be 0", 0]
        , ["_reserved4", SHORT, "reserved; must be 0", 0]
        , ["metricDataFormat", SHORT, "metricDataFormat, 0 for current format", 0]
        , ["numberOfHMetrics", USHORT, "number of hMetric entries.", globals.letters ? 1 + globals.letters.length : 2]
      ],
      "hmtx": [
        // uses struct longHorMetric{USHORT advanceWidth, SHORT lsb}.
        // NOTE: we do not encode any lsb values (which would be SHORT[], if we did)
        ["hMetrics", formHMTX()]
      ],
      "maxp": [
          ["version", FIXED, "table version. For CFF this must be 0.5, for TTF it must be 1.0", 0x00005000]
        , ["numGlyphs", USHORT, "number of glyphs in the font", globals.letters ? 1 + globals.letters.length : 2]
      ],
      "name": [
          ["format", USHORT, "format 0", 0]
        , ["count", USHORT, "number of name records", setupNameTableData()]
        , ["stringOffset", USHORT, "offset for the string data, relative to the table start", 6 + serialize(NAMERECORDS).length],
          // name records: {platform/encoding/language, nameid, length, offset}
        , ["NameRecord", NAMERECORDS]
          // and the string data is a single null character
        , ["stringData", NAMESTRINGS]
      ],

      "post": [
          // I hate this table. It's only relevant to printing, which we don't care about,
          // and for CFF only version 3 is a legal version, so it needs those 8 values.
          // I really hope the next version of opentype makes this table optional, rather
          // than mandatory... 32 bytes may not seem like match, but when you care about
          // the smallest possible font to get a specific job done, 32 bytes is massive.
          ["version", FIXED, "most recent post table format", 0x00030000]
        , ["italicAngle", FIXED, "", 0]
        , ["underlinePosition", FWORD, "", 0]
        , ["underlineThickness", FWORD, "", 0]
        , ["isFixedPitch", ULONG, "", 1]
        , ["minMemType42", ULONG, "", 0]
        , ["maxMemType42", ULONG, "", 0]
        , ["minMemType1", ULONG, "", 0]
        , ["maxMemType1", ULONG, "", 0]
      ]
    };

    /**
     * OpenType magic: we're using a ligature to turn "AA" into "A".
     * Once this works, we're going to instead turn 'c,u,s,t,o,m' into glyph "custom"
     * (where the commas are glyph delimiters, not actual commas).
     */
    if (globals.label) {
      TableModels["GSUB"] = [
          // GSUB header
          ["Version", FIXED, "", 0x00010000]
        , ["ScriptListOffset",  OFFSET, "Offset to ScriptList table, from beginning of GSUB table",  0x0000]
        , ["FeatureListOffset", OFFSET, "Offset to FeatureList table, from beginning of GSUB table", 0x0000]
        , ["LookupListOffset",  OFFSET, "Offset to LookupList table, from beginning of GSUB table",  0x0000]

          // Scripts
        , ["Script List", [
            ["ScriptCount", USHORT, "Number of ScriptRecords", 1]
          , ["ScriptRecord", [
              ["ScriptTag", CHARARRAY, "We only use the default script", "DFLT"]
            , ["ScriptTableOffset", OFFSET, "Offset to Script table-from beginning of ScriptList", 0x0008] // hardcoded
          ]]

          , ["Script table", [
              ["defaultLangSys", OFFSET, "the langsys record to use in absence of a specific language, from start of script table", 0x0004] // hardcoded
            , ["LangSysCount", USHORT, "this font is not language specific, so has no langsys records beyond default", 0]

            , ["Default LangSys table", [
                ["LookupOrder", OFFSET, "reserved value. Because why not", 0]
              , ["ReqFeatureIndex", USHORT, "We require the first (and only) feature. It must always kick in.", 0]
              , ["FeatureCount", USHORT, "Number of FeatureIndex values for this language system, excluding required", 0]
              , ["FeatureIndex", [
                  ['0', USHORT, "first index is the only index", 0]
              ]]
            ]]
          ]]
        ]]

          // Features
        , ["Feature List", [
             ["FeatureCount", USHORT, "One feature record only", 1]
           , ["FeatureRecords", [
                ["Tag", CHARARRAY, "we use the ligature feature", 'liga']
              , ["Offset", OFFSET, "Offset to Feature table, from beginning of FeatureList", 0x0008] // hardcoded
           ]]
           , ["Feature table", [
                ["FeatureParams", OFFSET, "reserved. Again.", 0]
              , ["LookupCount", USHORT, "how many lookups does this feature use?", 1]
              , ["LookupListIndex", [
                  ["0", USHORT, "first index is for first lookuplist entry", 0]
              ]]
           ]]
        ]]

          // Lookup
        , ["Lookup List", [
            ["LookupCount", USHORT, "number of lookups", 1]
          , ["Lookups", [
            , ["0", OFFSET, "offset to first lookup that we need, relative to start of lookup list", 0x0004] // hardcoded
          ]]
          , ["Lookup table", [
              // see http://fontforge.org/gposgsub.html, "the GSUB table"
              ["LookupType", USHORT, "GSUB ligature substitution is lookuptype 4", 4]
            , ["LookupFlag", USHORT, "lookup qualifiers - we don't have any", 0]
            , ["SubtableCount", USHORT, "we use have subtable", 1]
            , ["Subtable offsets", [
                ["0", OFFSET, "index for first subtable, relative to start of lookup table", 0x0008] //hardcoded
            ]]

            // If flags indicates filtering, there is one more USHORT record here
            // Since flags is 0, that record has been omitted.

              // LookupType 4: Ligature Substitution Subtable.
            , ["Ligature Substitution Subtable, Format 1", [
                ["SubstFormat", USHORT, "format 1", 1]
              , ["Coverage", OFFSET, "Offset to Coverage table-from beginning of Substitution table", 0x0008] // hardcoded
              , ["LigSetCount", USHORT, "Number of ligature sets", 1]
              , ["LigatureSet Offsets", [
                  ["0", OFFSET, "offset to first ligature set, from beginning of Substitution table", 0x0008 + 10] // start of coverage + length of coverage
              ]]

                // Coverage table for our ligature: we cover the glyph "A" only (for now)
              , ["Coverage table", [
                  ["CoverageFormat", USHORT, "format 2", 2]
                , ["RangeCount", USHORT, "number of ranges covered", 1]
                , ["RangeRecords", [
                    ["0", [
                        ["Start", GlyphID, "first glyph in the range", globals.label ? 1 + globals.letters.indexOf(globals.label[0]) : 1]
                      , ["End", GlyphID, "last glyph in the range", globals.label ? 1 + globals.letters.indexOf(globals.label[0]) : 1]
                      , ["StartCoverageIndex", USHORT, "Coverage Index of first GlyphID in range", 0]
                    ]]
                ]]
              ]]

                // Our ligature sets (we only have one)
              , ["first ligature set", [
                  ["LigatureCount", USHORT, "Number of Ligature tables in this set", 1]

                , ["Ligature offsets", [
                    ["0", OFFSET, "offset to first ligature, from beginning of LigatureSet table", 0x0004] // hardcoded
                ]]

                  // Our first and only ligature: (A,A) -> (A)
                , ["first ligature", [
                    ["LigGlyph", GlyphID, "the substitution glyph id", globals.letters ? globals.letters.length : 1]
                  , ["CompCount", USHORT, "Number of components in the ligature (i.e. how many letter to replace) ", globals.letters ? globals.label.length : 2]
                    // The Component array is basically a char array, except each letter is identified by
                    // font-internal GlyphID, rather than by some external codepage. Note: the first glyph
                    // is defined by the coverage table already, so we only encode "letters" 2 and on.
                  , ["Components", (function() {
                    if(globals.letters) {
                      var list = [];
                      for(var i=1, last=globals.letters.length-1, list=[]; i<last; i++) {
                        list.push([""+i, GlyphID, "the letter "+globals.label[i], 1 + globals.letters.indexOf(globals.label[i])]);
                      }
                      return list;
                    }
                    return [["0", GlyphID, "second letter in the ligature", 1]];
                  }())]
                ]]
              ]]
            ]]
          ]]
        ]]
      ];

      // hook up all offsets correctly
      var binary = serialize(TableModels["GSUB"]),
          headerSize = 10,
          scriptList = serialize(TableModels["GSUB"][4]),
          scriptListOffset = headerSize,
          featureList = serialize(TableModels["GSUB"][5]),
          featureListOffset = scriptListOffset + scriptList.length,
          lookupList = serialize(TableModels["GSUB"][6]),
          lookupListOffset = featureListOffset + featureList.length;

      // FIXME: offset linking should be automatic. the OFFSET datatype should really
      //        become an OFFSET("name of field", "name of 'relative to' field")
      //        function, so that the serialize function can perform the magic for us.

      var headerSize = 10;
      TableModels["GSUB"][1][3] = scriptListOffset;
      TableModels["GSUB"][2][3] = featureListOffset;
      TableModels["GSUB"][3][3] = lookupListOffset;
    }

    var functionsByName = function(key, val) { if (typeof val === 'function') { return val.name; }  return val; }
    console.log("--- FONT STRUCTURE ---");
    console.log(JSON.stringify(TableModels, functionsByName, 2));

    var numTables = Object.keys(TableModels).length;
    var otf = buildSFNT(numTables, TableModels);

    return {
      cff: serialize(TableModels["CFF "]),
      otf: otf,
      woff: formWOFF(otf, numTables),
      mappings: mapper.mappings
    }
  };

  context.buildFont = buildFont;

}(this, new Mapper()));

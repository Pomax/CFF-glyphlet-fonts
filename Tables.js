(function(context) {

  "use strict";

  // layout mapping for finding regions of interest in the byte code
  var mappings = [];
  function addMapping(name, start, end, type) {
    mappings.push({name:name, start:start, end:end, type:type});
  };

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
      data = data.concat(serialize(table)); //table.forEach(function(e) { data = data.concat(serialize(e)); });
      var length = data.length;
      addMapping(tag + " table data", tabledataoffset + offset, tabledataoffset + offset + length, "table");

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

      addMapping(tag + " table definition", opentype_len + headers.length, opentype_len + headers.length + 16, "sfnt");
      headers = headers.concat(table_entry);
    };

    addMapping("sfnt header", 0, 12, "sfnt");
    Object.keys(TableModels).forEach(processTag);
    var data = opentype.concat(headers).concat(fontdata);

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
   * Create a font. Options:
   * {
   *   name: "glyph name"
   *   outline: "SVG outline string"
   *   quadSize: <num>
   *   fontname: "simple font name. No spaces or special characters"
   * }
   */
  var buildFont = function(options) {
    mappings = [];

    // make sure the options are good.
    if(!options.outline) { throw new Error("No outline was passed to build a font for"); }

    // Extract the font-global strings
    var globals = {
      vendorId: "----",
      fontFamily: options.fontFamily || "Custom",
      subfamily: options.subfamily || "Regular",
      fontName: options.fontName || "Custom Glyph Font",
      compactFontName: options.compactFontName || "customfont",
      fontVersion: options.fontVersion || "Version 1.0",
      copyright: options.copyright || "License-free",
      trademark: options.trademark || "License-free",
      license: options.license || "License-free",
      glyphName: options.glyphName || "A",
      quadSize: options.quadSize || 1024
    };

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
        addMapping(cff[i][0], s, e, "cff");
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

      var charset = ["charset", [
        ["format", BYTE, "we use the simplest format", 0]
      , ["glyphs", [
          , ["0", SID, "single entry array for our glyph, which is custom SID 4", 394]
        ]]
      ]];

      var encoding = ["encoding", [
        ["format", BYTE, "we use the encoding best suited for randomly ordered glyphs", 0]
      , ["nCodes", BYTE, "number of encoded glyphs (not counting .notdef)", 1]
      , ["codes", [
          ["0", BYTE, "encoding for glyph 0", 0]
        ]]
      ]];

      var dim = (globals.quadSize * 0.7)|0;

      var charstrings = [
        [".notdef", DICTINSTRUCTION, "the outline for .notdef", OPERAND(14)]
      , ["our letter", DICTINSTRUCTION, "the outline for our own glyph", options.charString]
      ];

      var charstring_raw = serialize(charstrings);
      var charstring_offsize = charstring_raw.length > 255 ? 2 : 1;
      var charstring_index = ["charstring index", [
         // this is the part that actually contains the characters outline data,
         // encoded as Type 2 charstrings (one charstring per glyph).
         ["count", Card16, "two charstrings; .notdef and our glyph", 2],
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
        , ["custom glyph", CHARARRAY, "custom glyph name, for charset/encoding", globals.glyphName]
      ];

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
      var cff = [
        ["header", [
            ["major", Card8, "major version", 1]
          , ["minor", Card8, "minor version", 0]
          , ["length", Card8, "header length in bytes", 4]
          , ["offSize", OffSize, "how many bytes for an offset value?", 1]
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
        NAMESTRINGS.push(string);
        offset += string.length;

        // And encode the same string but then in UTF16 for windows.
        // This leads to name data that is 300% the size of what it
        // could be if Windows would simply read the Mac records
        // in absence of windows records. But that is too good to happen.
        string = atou(string);
        nameRecordPartial = [
            ["recordID", USHORT, "See the 'Name IDs' section on http://www.microsoft.com/typography/otspec/name.htm for details", recordId]
          , ["length", USHORT, "the length of this string", string.length]
          , ["offset", USHORT, "offset for this string in the string heap", offset]
        ];
        winRecords.push(winHeader.concat(nameRecordPartial));
        NAMESTRINGS.push(string);
        offset += string.length;
      });

      NAMESTRINGS = NAMESTRINGS.join('');
      context.NAMERECORDS = macRecords.concat(winRecords);
      return NAMERECORDS.length;
    }

    function setupCmapFormat4() {
      // Note that normally, we would not be hardcoding a cmap table like this.
      // However, since we know exactly what we want to do, in this instance we can.
      context.SUBTABLE4 = [
          ["format", USHORT, "format 4 subtable", 4]
        , ["length", USHORT, "table length in bytes", 32 + (2 * 2)]
        , ["language", USHORT, "language", 0]
          // The following four values all derive from an implicitly
          // encoded value called "segCount", representing the number
          // of segments that this subtable format 4 cmap has.
          // Silly as it may seem, these values must be 100% correct,
          // and cannot, in any way, be omitted. I don't like it.
        , ["segCountX2", USHORT, "2x segment count; we only have one segment", 4]
        , ["searchRange", USHORT, "search range: 2 * (2^floor(log2(segCount)))", 4]
        , ["entrySelector", USHORT, "entry selector: log2(searchRange/2)", 1]
        , ["rangeShift", USHORT, "range shift: 2x segment count - search range", 0]
        // endCount[segCount]
        , ["endCount", [
            ["characterCode ", USHORT, "the letter 'A', for now", 0x41]
          , ["characterCode ", USHORT, "array terminator 0xFFFF", 0xFFFF]
        ]]
        , ["reservedPad", USHORT, "a 'reserve pad' value; must be 0", 0]
        // startCount[segCount]
        , ["startCount", [
            ["characterCode ", USHORT, "the letter 'A', for now", 0x41]
          , ["characterCode ", USHORT, "array terminator 0xFFFF", 0xFFFF]
        ]]
        // the following two values are val[segcount]
        , ["idDelta", [
            ["0", SHORT, "delta for segment 1", -0x40] // point to glyphid index 1 (0 is .notdef)
          , ["0", SHORT, "bogus last segment value", 1]
        ]]
        , ["idRangeOffset", [
            ["0", USHORT, "range offset for segment 1", 0]
          , ["0", USHORT, "bogus last segment value", 0]
        ]]
        , ["glyphIdArray", [
            ["0", USHORT, "Our first glyphId points to .notdef", 0]
          , ["1", USHORT, "Our second glyphId points to our own glyph", 1]
        ]]
      ];
      // we call this function expecting it to report how many subtables are used in the font.
      return 1;
    }

    // OpenType tables
    var TableModels = {
      "CFF ": createCFF()
      ,
      "OS/2": [
          ["version", USHORT, "OS/2 table 4", 0x0004]
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
        , ["fsSelection", USHORT, "font selection flag: bit 6 (lsb=0) is high, to indicate 'regular font'.", 0x40]
        , ["usFirstCharIndex", USHORT, "first character to be in this font. We claim 'A'.", 0x41]
        , ["usLastCharIndex", USHORT, "last character to be in this font. We again claim 'A'.", 0x41]
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
        , ["usBreakChar", USHORT, "", 0]
        , ["usMaxContext", USHORT, "", 1]
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
        , ["unitsPerEM", USHORT, "units per EM, we go with 1024 (ttf default. cff is usually 2000 instead)", globals.quadSize]
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
        , ["numberOfHMetrics", USHORT, "number of hMetric entries. We only encode 1 glyph, so there are 2: one for .notdef, and one for our real glyph", 2]
      ],
      "hmtx": [
        // uses struct longHorMetric{USHORT advanceWidth, SHORT lsb}.
        // NOTE: we do not encode any lsb values (which would be SHORT[], if we did)
        ["hMetrics", [
          // first entry longHorMetric (notdef)
          ["0", [
            ["advanceWidth", USHORT, "", 0]
          , ["lsb", SHORT, "", 0]]]
          // second entry longHorMetric (real glyph)
        , ["1", [
            ["advanceWidth", USHORT, "", options.xMax - options.xMin]
          , ["lsb", SHORT, "", 0]]]]]
      ],
      "maxp": [
          ["version", FIXED, "table version. For CFF this must be 0.5, for TTF it must be 1.0", 0x00005000]
        , ["numGlyphs", USHORT, "number of glyphs in the font", 2]
      ],
      "name": [
          ["format", USHORT, "format 0", 0]
        , ["count", USHORT, "number of name records", setupNameTableData()]
        , ["stringOffset", USHORT, "offset for the string data, relative to the table start", 6 + serialize(NAMERECORDS).length],
          // name records: {platform/encoding/language, nameid, length, offset}
        , ["NameRecord", NAMERECORDS]
          // and the string data is a single null character
        , ["stringData", CHARARRAY, "The font's strings", NAMESTRINGS]
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

    [
        , ["sTypoAscender", SHORT, "typographic ascender", options.yMax]
        , ["sTypoDescender", SHORT, "typographic descender", options.yMin]
        , ["sTypoLineGap", SHORT, "line gap", globals.quadSize - options.yMax + options.yMin]
        , ["usWinAscent", USHORT, "usWinAscent", globals.quadSize + options.yMin]
        , ["usWinDescent", USHORT, "usWinDescent", -(globals.quadSize - options.yMax)]
        , ["Ascender", FWORD, "typographic ascender", globals.quadSize + options.yMin]
        , ["Descender", FWORD, "typographic descender", -(globals.quadSize - options.yMax)]
        , ["LineGap", UFWORD, "Typographic line gap", 0]
    ].map(function(v) {
      console.log(v[0], v[3]);
    })


    var numTables = Object.keys(TableModels).length;
    var otf = buildSFNT(numTables, TableModels);

    return {
      cff: serialize(TableModels["CFF "]),
      otf: otf,
      woff: formWOFF(otf, numTables),
      mappings: mappings
    }
  };

  context.buildFont = buildFont;

}(this));

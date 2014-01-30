(function() {

  "use strict";

  // Convert ASCII to UTF16, the cheap way.
  function atou(v) {
    var pad = String.fromCharCode(0),
        a = v.split(''),
        out = [];
    a.forEach(function(v) {
      // This works because for the ANSI range 0x00-0xFF,
      // the equivalent UTF16 code is 0x0000-0x00FF.
      out.push(pad);
      out.push(v);
    })
    return out.join('');
  }

  /***
   *
   * OpenType data types
   *
   ***/

  function BYTE(v) { return [v]; }
  function CHAR(v) { return [v.charCodeAt(0)]; }
  function CHARARRAY(v) { return v.split('').map(function(v) { return v.charCodeAt(0); }); }
  function FIXED(v) { return [(v >> 24) & 0xFF, (v >> 16) & 0xFF, (v >> 8) & 0xFF, v & 0xFF]; }
  function USHORT(v) { return [(v >> 8) & 0xFF, v & 0xFF]; }
  function SHORT(v)  {
    var limit = 32768;
    if(v >= limit) { v = -(2*limit - v); } // 2's complement
    return [(v >> 8) & 0xFF, v & 0xFF];
  }
  function UINT24(v) { return [(v >> 16) & 0xFF, (v >> 8) & 0xFF, v & 0xFF]; }
  function ULONG(v) { return [(v >> 24) & 0xFF, (v >> 16) & 0xFF, (v >> 8) & 0xFF, v & 0xFF]; }
  function LONG(v)  {
    var limit = 2147483648;
    if(v >= limit) { v = -(2*limit - v); } // 2's complement
    return [(v >> 24) & 0xFF, (v >> 16) & 0xFF, (v >> 8) & 0xFF, v & 0xFF];
  }

  function LONGDATETIME(v) {
    // This doesn't actually work in JS. Then again, these values that use
    // this are irrelevant, too, so we just return a 64bit "zero"
    return [0,0,0,0,0,0,0,0];
  }


  // aliased datatypes
  var FWORD = SHORT,
      UFWORD = USHORT;

  /***
   *
   * CFF data types
   *
   ***/

  function NUMBER(v) {
    if (-107 <= v && v <= 107) {
      return [v + 139]; }
    if (108 <= v && v <= 1131) {
      var b0 = v >> 8,
          b1 = v - (b0 << 8);
      return [b0 + 247, b1 - 108]; }
    if (-1131 <= v && v <= -108) {
      var v2 = -v - 108,
          b0 = v2 >> 8,
          b1 = v2 - (b0 << 8);
      return [(b0 + 251), b1]; }
    if (-32768 <= v && v <= 32767) {
      return [28, (v >> 8) & 0xFF, v & 0xFF]; }
    return [29, (v >> 24) & 0xFF, (v >> 16) & 0xFF, (v >> 8) & 0xFF, v & 0xFF];
  }

  function OPERAND(v1, v2) {
    var opcode = BYTE(v1);
    if(v2 !== undefined) { opcode.concat(BYTE(v2)); }
    return opcode;
  }

  function DICTINSTRUCTION(codes) {
    var data = [];
    codes.forEach(function(code) {
      data = data.concat(code);
    });
    return data;
  }

  /***
   *
   * Aliased data types
   *
   ***/

  var GlyphID = USHORT,
      Offset = USHORT,
      Card8 = BYTE,
      Card16 = USHORT,
      SID = NUMBER,
      OffSize = BYTE,
      OffsetX = [undefined, BYTE, USHORT, UINT24, ULONG];

  /**
   * Helper function for decoding strings as ULONG
   */
  function decodeULONG(ulong) {
    var b = ulong.split('').map(function(c) { return c.charCodeAt(0); });
    var val = (b[0] << 24) + (b[1] << 16) + (b[2] << 8) + b[3];
    if (val < 0 ) { val += Math.pow(2,32); }
    return val;
  }

  // const, but const in strict mode is not allowed
  var LABEL = 0;
  var READER = 1;
  var NESTED_RECORD = 1;
  var DATA = 3;

  /**
   * Serialise a record structure into byte code
   */
  var serialize = function(record) {
    var data = [];
    (function _serialize(record) {
      if (typeof record[LABEL] !== "string") {
        record.forEach(_serialize);
      }
      else if (typeof record[READER] === "function") {
        data = data.concat(record[READER](record[DATA]));
      }
      else {
        var nested = record[NESTED_RECORD];
        if(nested instanceof Array) {
          _serialize(nested);
        }
        else {
          console.error(record);
          throw new Error("what?");
        }
      }
    }(record));
    return data;
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
  function computeChecksum(chunk, name) {
    var tally = 0;
    for(var i=0, last=chunk.length; i<last; i+=4) {
      tally += (chunk[i] << 24) + (chunk[i + 1] << 16) + (chunk[i + 2] << 8) + (chunk[i + 3]);
    }
    tally %= Math.pow(2,32);
    return tally;
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

    // layout mapping for finding regions of interest in the byte code
    var mappings = [];
    var addMapping = function(name, start, end, type) {
      mappings.push({name:name, start:start, end:end, type:type});
    };

    // make sure the options are good.
    if(!options.outline) { throw new Error("No outline was passed to build a font for"); }
    options.name = options.name || "A";
    options.quadSize = options.quadSize || 1024;
    options.fontname = options.fontname || "custom";
    (function convertOutline(options) {
      var outline = options.outline;
      var sections = outline.match(/[MmLlCcAaZ]\s*(\d+\s+)*/g).map(function(s){return s.trim()});
      options.xMin = 0;
      options.yMin = 0;
      options.xMax = 1;
      options.yMax = 1;
      options.charstring = [];
      // TODO: finish this part up so we can use actual charstrings
    }(options));

   // Extract the font-global strings
    var globals = {
      vendorId: "----",
      fontFamily: options.fontFamily || "Custom",
      subfamily: options.subfamily || "Regular",
      fontName: options.fontName || "Custom Glyph Font",
      compactFontName: options.fontName || "customfont",
      fontVersion: options.fontVersion || "Version 1.0",
      copyright: options.copyright || "License-free",
      trademark: options.trademark || "License-free",
      license: options.license || "License-free",
    };


    /***
     *
     * CFF DATA DESCRIPTION (See Adobe's technical note 5176)
     *
     **/


    var createCFF = function() {

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

      // be mindful of the fact that there are 390 predefined strings (see appendix A, pp 29)
      var strings = [
          ["version", CHARARRAY, "font version string; string id 391", globals.fontVersion]
        , ["full name", CHARARRAY, "the font's full name  (id 392)", globals.fontName]
        , ["family name", CHARARRAY, "the font family name (id 393)", globals.fontFamily]
      ];

      // the top dict contains "global" metadata
      var top_dict_data = [
          ["version", DICTINSTRUCTION, "", SID(391).concat(OPERAND(0))]
        , ["full name", DICTINSTRUCTION, "", SID(392).concat(OPERAND(2))]
        , ["family name", DICTINSTRUCTION, "", SID(393).concat(OPERAND(3))]
        , ["weight", DICTINSTRUCTION, "", SID(389).concat(OPERAND(4))]
        , ["uniqueID", DICTINSTRUCTION, "", NUMBER(1).concat(OPERAND(13))]
        , ["FontBBox", DICTINSTRUCTION, "",
            NUMBER(options.xMin).concat(NUMBER(options.yMin)).concat(NUMBER(options.xMax)).concat(NUMBER(options.yMax)).concat(OPERAND(5))
        ]
          // these two instruction can't be properly asserted until after we pack up the CFF, so we use placeholder values
        , ["charstrings", DICTINSTRUCTION, "offset to charstrings (from start of file)", [0x00, 0x00]]
        , ["private", DICTINSTRUCTION, "'size of', then 'offset to' (from start of file) the private dict", [0x00, 0x00, 0x00]
      ]];

      // the character outlines for .notdef and our custom glyph
      var charstrings = [
          // .notdef has an empty glyph outline
          [".notdef", DICTINSTRUCTION, "the outline for .notdef", OPERAND(14)]
          // our second glyph is non-empty, based on `data`
        , ["our letter", DICTINSTRUCTION, "the outline for our own glyph", [
            // move to 20,20
            NUMBER(20), NUMBER(20), OPERAND(21),
            // hline to 1000,20
            NUMBER(980), OPERAND(6),
            // vline to 1000,1000
            NUMBER(980), OPERAND(7),
            // hline to 20,1000
            NUMBER(-980), OPERAND(6),
            // vline to 20,20
            NUMBER(-980), OPERAND(7),
            // path end
            OPERAND(14)]
        ]
      ];

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
        ]],
        ["top dict index", [
            ["count", Card16, "top dicts store one 'thing' by definition", 1]
          , ["offSize", OffSize, "offsets use 1 bytes in this index", 1]
          , ["offset", [
              ["0", OffsetX[1], "first offset", 1]
            , ["1", OffsetX[1], "end of data black", 1 + serialize(top_dict_data).length]
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

      var cff_end = serialize(cff).length;

      // process the charstring index.
      var charstring_index = ["charstring index", [
                                 // this is the part that actually contains the characters outline data,
                                 // encoded as Type 2 charstrings (one charstring per glyph).
                                 ["count", Card16, "two charstrings; .notdef and our glyph", 2],
                               , ["offSize", OffSize, "offsets use 1 byte", 1]
                               , ["offset", generateOffsets(charstrings, 1)]
                               , ["charstrings", charstrings]
                             ]];
      var charstring_index_length = serialize(charstring_index).length;
      var cbytes = NUMBER(charstring_index_length).length;
      var cdiff = Math.max(0, cbytes - 1); // we used a 1 byte place holder in the top_dict_data

      // then process the private dict section:
      var private_dict = ["private dict", [
                             ["BlueValues", DICTINSTRUCTION, "empty array (see Type 1 font format, pp 37)", [
                               NUMBER(0),
                               NUMBER(0),
                               OPERAND(6)]
                             ]
                           , ["FamilyBlues", DICTINSTRUCTION, "idem dito", [
                               NUMBER(0),
                               NUMBER(0),
                               OPERAND(8)
                             ]
                           ]
                           , ["StdHW", DICTINSTRUCTION, "dominant horizontal stem width. We set it to 10", [
                               NUMBER(10),
                               OPERAND(10)
                             ]
                           ]
                           , ["StdVW", DICTINSTRUCTION, "dominant vertical stem width. We set it to 10", [
                               NUMBER(10),
                               OPERAND(11)
                             ]
                           ]
                         ]];
      var private_dict_length = serialize(private_dict).length;
      var pbytes = NUMBER(private_dict_length).concat(NUMBER(cff_end + charstring_index_length)).length;
      var pdiff = Math.max(0, pbytes - 2);  // we used two 1 byte place holders in the top_dict_data

      // get the offset (for charstrings index) after working in the changes
      // caused by encoding the  charset and private lenghts and offsets:
      var bytediff = cdiff + pdiff;
      var new_offset = cff_end + bytediff;

      // update the top dict data
      top_dict_data[6][3] = NUMBER(new_offset).concat(OPERAND(17));
      top_dict_data[7][3] = NUMBER(private_dict_length).concat(NUMBER(new_offset + charstring_index_length)).concat(OPERAND(18));
      // also update the top dict index's "last" offset!
      cff[2][1][2][1][1][3] += bytediff;

      // record the data mappings for HTML styling, etc.
      var s = 0, e = 0, i=0;
      for(i=0; i<cff.length; i++) {
        s = e;
        e += serialize(cff[i]).length;
        addMapping(cff[i][0], s, e, "cff");
      }

      // And then finally, append the data blocks to the CFF definition
      addMapping("charstring index", serialize(cff).length, serialize(cff).length + serialize(charstring_index).length, "cff");
      cff.push(charstring_index);
      addMapping("private dict", serialize(cff).length, serialize(cff).length + serialize(private_dict).length, "cff");
      cff.push(private_dict);

      // for validation purposes, print the CFF block as hex data to the console before returning
      console.log("--- cff ---\n", serialize(cff).map(function(v) {
        v = v.toString(16).toUpperCase();
        if(v.length === 1) v = "0" + v;
        return v;
      }).join(" "));

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
      window.NAMESTRINGS = [];

      // See the 'Name IDs' section on http://www.microsoft.com/typography/otspec/name.htm for details
      var strings = {
                                  //  "0" = copyright text
        "1": globals.fontFamily,  //      = font name
        "2": globals.subfamily,   //      = font subfamily name
                                  //  "3" = the unique font identifier (irrelevant for our purpose)
        "4": globals.fontName,    //      = full font name
        "5": globals.fontVersion, //      = font version. "Preferred" format is "Version \d+.\d+; specifics"
                                  //  "7" = trademark text
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
      window.NAMERECORDS = macRecords.concat(winRecords);
      return NAMERECORDS.length;
    }

    function setupCmapFormat4() {
      window.SUBTABLE4 = [
          ["format", USHORT, "format 4 subtable", 4]
        , ["length", USHORT, "table length in bytes", 32 + (2 * 2)]
        , ["language", USHORT, "language", 0]
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
            // Note that by pointing to CFF glyph id 1, tools like TTX will
            // call this glyph "space", because the default character map
            // has id=1 marked as the space character, even if that is NOT
            // what we actually use it for.
        ]]
      ];
      return 1;
    }

    // OpenType tables
    var TableModels = {
      "CFF ": createCFF()
      ,
      "OS/2": [
          ["version", USHORT, "OS/2 table 1", 0x0001]
        , ["xAvgCharWidth", SHORT, "xAvgCharWidth", 0]
        , ["usWeightClass", USHORT, "usWeightClass", 400]
        , ["usWidthClass", USHORT, "usWidthClass", 1]
        , ["fsType", USHORT, "fsType", 0]
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
        , ["sFamilyClass", SHORT, "sFamilyClass", 0]
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
        , ["ulUnicodeRange1", ULONG, "", 0]
        , ["ulUnicodeRange2", ULONG, "", 0]
        , ["ulUnicodeRange3", ULONG, "", 0]
        , ["ulUnicodeRange4", ULONG, "", 0]
        , ["achVendID", CHARARRAY, "vendor id (http://www.microsoft.com/typography/links/vendorlist.aspx for the 'real' list)", globals.vendorId]
        , ["fsSelection", USHORT, "font selection flag: bit 6 (lsb=0) is high, to indicate 'regular font'.", 0x40]
        , ["usFirstCharIndex", USHORT, "first character to be in this font. We claim 'A'.", 0x41]
        , ["usLastCharIndex", USHORT, "last character to be in this font. We again claim 'A'.", 0x41]
        , ["sTypoAscender", SHORT, "typographic ascender", 1024] // currently not based on anything
        , ["sTypoDescender", SHORT, "typographic descender", 0]  // currently not based on anything
        , ["sTypoLineGap", SHORT, "line gap", options.quadSize]
        , ["usWinAscent", USHORT, "usWinAscent", options.yMax]
        , ["usWinDescent", USHORT, , "usWinDescent", options.yMin]
        , ["ulCodePageRange1", ULONG, "", 0]
        , ["ulCodePageRange2", ULONG, "", 0]
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
        , ["unitsPerEm", USHORT, "units per EM, we go with 1024 (ttf default. cff is usually 2000 instead)", 1024]
        , ["created", LONGDATETIME, "date created", 0]
        , ["modified", LONGDATETIME, "date modified", 0]
        , ["xMin", SHORT, "global xMin", options.xMin]
        , ["yMin", SHORT, "global yMin", options.yMin]
        , ["xMax", SHORT, "global xMax", options.xMax]
        , ["yMax", SHORT, "global yMax", options.yMax]
        , ["macStyle", USHORT, "font style, according to old Apple mac rules", 0]
        , ["lowestRecPPEM", USHORT, "smallest readable size in pixels. We claim 8px for no real reason", 8]
        , ["fontDirectionHint", SHORT, "deprecated value (font direction hint). must be 0x0002", 2]
        , ["indexToLocFormat", SHORT, "offset datatype (we use 0, for SHORT offsets", 0]
        , ["glyphDataFormat", SHORT, "glyph data format. default value = 0", 0]
      ],
      "hhea": [
          ["version", FIXED, "table version", 0x00010000]
        , ["Ascender", FWORD, "typographic ascender", 1]    // how do we compute this?
        , ["Descender", FWORD, "typographic descender", -1] // how do we compute this?
        , ["LineGap", UFWORD, "Typographic line gap", options.quadSize]
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
      "hmtx": [ // uses struct longHorMetric{USHORT advanceWidth, SHORT lsb}. NOTE: we do not encode any lsb values (which would be SHORT[])
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
     * special marker: we need this to set the full font checksum later.
     */
    var fontchecksum = 0,
        tabledataoffset = 0,
        checksumoffset = 0;

    /**
     * Generate the font's binary data
     */
    function buildFontData() {

      var numTables = Object.keys(TableModels).length,
          maxPower = ((Math.log(numTables)/Math.log(2))|0),
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
          fontdata = [];

      tabledataoffset = opentype_len + headers_len;

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
        var checksum = computeChecksum(data, tag);
        fontchecksum += checksum;

        // and then update the OpenType header with the table's 16 byte record
        var table_entry = CHARARRAY(tag)
                         .concat(ULONG(checksum))
                         .concat(ULONG(opentype_len + headers_len + offset))
                        .concat(ULONG(length));
        //console.log(tag, offset, data)
        addMapping(tag + " table definition", opentype_len + headers.length, opentype_len + headers.length + 16, "sfnt");
        headers = headers.concat(table_entry);
      };

      addMapping("sfnt header", 0, 12, "sfnt");
      Object.keys(TableModels).forEach(processTag);
      return opentype.concat(headers).concat(fontdata);
    }

    var data = buildFontData();

    // We're almost done, but we still need to compute the full font's checksum.
    // This one's tricky, and the algorithm for computing all checksums is:
    //
    //  1. Set the checkSumAdjustment to 0.
    //  2. Calculate the checksum for all the tables including the 'head' table and enter that value into the table directory.
    //  3. Calculate the checksum for the entire font.
    //  4. Subtract that value from the hex value B1B0AFBA.
    //  5. Store the result in checkSumAdjustment
    //

    // Now, we've already done steps 1 and 2, so, next are steps 3 and 4:
    var checksum = 0xB1B0AFBA - computeChecksum(data);
    checksum += Math.pow(2,32); // Add first, because mod on a negative...
    checksum %= Math.pow(2,32); // ...yields a negative, in JavaScript
    checksum = ULONG(checksum);

    // And then step 5:
    var head = data.slice(0, checksumoffset),
        tail = data.slice(checksumoffset + 4);
    data = head.concat(checksum).concat(tail);

    // and now we're done.
    return {
      mappings: mappings,
      data: data
    }
  };

  window.buildFont = buildFont;

}());

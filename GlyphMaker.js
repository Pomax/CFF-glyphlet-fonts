/**
 * CFF glyphlet builder
 */
(function () {

  // we'll actually implement these later.
  function BYTE(v)         { return [v]; }
  function CHAR(v)         { return [v]; }
  function CHARARRAY(v)    { return v.split(''); }
  function USHORT(v)       { return [v]; }
  function SHORT(v)        { return [v]; }
  function UINT24(v)       { return [v]; }
  function LONG(v)         { return [v]; }
  function ULONG(v)        { return [v]; }
  function FIXED(v)        { return [v]; }
  function LONGDATETIME(v) { return [v]; }
  function F2DOT14(v)      { return [v]; }
  function Tag(v)          { return [v]; }

  // CFF-specific
  function NUMBER(v)       { return [v]; }
  function OPERAND(v)      { "see CFF spec pp 8"; return [v]; }

  // aliased datatypes
  var FWORD = SHORT,
      UFWORD = USHORT,
      GlyphID = USHORT,
      Offset = USHORT,
      Card8 = BYTE,
      Card16 = USHORT,
      SID = USHORT,
      OffSize = BYTE,
      Offset1 = BYTE,
      Offset2 = USHORT,
      Offset3 = UINT24,
      Offset4 = ULONG;

  // get only the bytes from a byte-dictionary
  function asBytes(obj) {
    // form single data block and return
    var data = [],
        fn = function(key) {
          data = data.concat(obj[key]);
        };
    Object.keys(obj).forEach(fn);
    return data;
  }

  // this is the tricky bit: Let's byte-model an entire CFF font!
  // note: The CFF specification is described in Adobe's technical note 5176
  var createCFF = function(label, data) {

    // be mindful of the fact that there are 390 predefined strings (see appendix A, pp 29)
    var strings = [
        CHARARRAY("001.000")     // version, string id = 391
      , CHARARRAY("custom font") // full name, string id = 392
      , CHARARRAY("custom")      // family name, string id = 393
      , CHARARRAY(label)         // the font's label, string id = 394
    ];

    // the top dict contains "global" metadata
    var top_dict_data = [
        SID(391), OPERAND(0)   // version
      , SID(392), OPERAND(2)   // full name
      , SID(393), OPERAND(3)   // family name
      , SID(389), OPERAND(4)   // weight
      , NUMBER(1), OPERAND(13) // uniqueID
      , NUMBER(data.xMin), NUMBER(data.yMin), NUMBER(data.xMax) NUMBER(data.yMax), OPERAND(5) // FontBBox

      // these two instruction can't be properly asserted until after we pack up the CFF...

      , NUMBER(-1), OPERAND(17) // charstrings; offset to charstrings (from start of file)
      , NUMBER(-1), NUMBER(-1), OPERAND(18) // private; size of, then offset to (from start of file) the private dict
    ];

    var charstrings = [
      // .notdef has an empty glyph outline
        [ OPERAND(14) ]
      // our second glyph is non-empty, based on `data`
      , data.toCharString(SID, NUMBER, OPERAND).concat([OPERAND(14)])
    ];

    var cff = {
      "header": [
            Card8(1, "major version")
          , Card8(0, "minor version")
          , Card8(4, "the header is 4 bytes long")
          , OffSize(1, "offsets use 1 byte")
        ],

        "name index": [
            Card16(1, "number of stored names (We only have one)")
          , OffSize(1, "offsets use 1 byte")
          // there are (count+1) offsets: the first offset is always 1, and the last offset marks the end of the table
          , Offset1(1)
          , Offset1(1 + "customfont".length)
          // object data
          , CHARARRAY("customfont")
        ],

        "top dict index": [
            Card16(1, "number of stored indices (We have one)")
          , OffSize(2, "offsets use 2 bytes")
          , Offset2(1)
          , Offset2(1 + top_dict_data.length)
          // actual data is concatenated in:
        ].concat(top_dict_data),

        "string index": [
            Card16(strings.length, "number of stored strings")
          , OffSize(1, "offsets use 1 byte")
          // offset array
          , Offset1(1, "first offset")
          , Offset1(1 + strings[0].length, "second offset")
          , Offset1(1 + strings[0].length + strings[1].length, "third offset")
          , Offset1(1 + strings[0].length + strings[1].length + strings[2].length, "block end")
          // data is concatenated in:
        ].concat(strings),

        "global subroutine index": [
          Card16(0, "no global subroutines")
        ],

        // this is the part that actually contains the characters outline data,
        // encoded as Type 2 charstrings (one charstring per glyph).
        "charstring index": [
            Card16(2),
          , OffSize(1, "offsets use 1 byte")
          , Offset1(1),
          , Offset1(1 + charstrings[0].length),
          , Offset1(1 + charstrings[0].length + charstrings[1].length),
        ].concat(charstrings),

        "private dict": [
            OPERAND(6)   // empty BlueValues array (see Type 1 font format, pp 37)
          , OPERAND(8)   // empty FamilyBlyes (idem dito)
          , NUMBER(10), OPERAND(10)  // StdHW (dominant horizontal stem width. We set it to 10)
          , NUMBER(10), OPERAND(11)  // StdVW (dominant vertical stem width. We set it to 10)
        ],
    }
    return asBytes(cff);
  };


  // based on http://processingjs.nihongoresources.com/the_smallest_font
  var OTFFONT = function(label, data) {
    this.tables = {
      "CFF ": createCFF(label, data),
      "OS/2": [
          USHORT(0x0001, "OS/2 table version 1, because this is a very simple font.")
        , SHORT(data.xMax, "xAvgCharWidth")
        , USHORT(0x2000, "usWeightClass")
        , USHORT(1, "usWidthClass")
        , USHORT(0, "fsType")
        // eight sub/superscript values, which we don't use, and 2 strikeout, also unused
        , SHORT(0), SHORT(0), SHORT(0), SHORT(0), SHORT(0), SHORT(0), SHORT(0), SHORT(0), SHORT(0), SHORT(0)
        , SHORT(0, "sFamilyClass")
        // 10 unused panose classification bytes
        , BYTE(0), BYTE(0), BYTE(0), BYTE(0), BYTE(0), BYTE(0), BYTE(0), BYTE(0), BYTE(0), BYTE(0)
        // unicode ranges, unused
        , ULONG(0)
        , ULONG(0)
        , ULONG(0)
        , ULONG(0)
        // vendor id
        , CHARARRAY("noop")
        , USHORT(0x40, "font selection flag: bit 6 (lsb=0) is high, to indicate 'regular font'.")
        , USHORT(0x23, "usFirstCharIndex")
        , USHORT(0x23, "usLastCharIndex")
        , SHORT(1024, "typographic ascender")
        , SHORT(0, "typographic descender")
        , SHORT(0, "line gap")
        , USHORT(data.yMax, "usWinAscent")
        , USHORT(-data.yMin, "usWinDescent")
        // codepage ranges
        , ULONG(0), ULONG(0)
      ],
      "cmap": [
          USHORT(0, "table version")
        , USHORT(1, "number of subtables")
        , USHORT(3, "platform")
        , USHORT(1, "encoding")
        , ULONG(0x0C, "table offset from cmap-start")
        // subtable start
        , USHORT(4, "format 4 subtable"),.
        , USHORT(0x20, "table length")
        , USHORT(0, "language")
        , USHORT(2, "2x segment count; we only have one segment")
        , USHORT(2, "search range: 2 * (2^floor(log2(segCount)))")
        , USHORT(0, "entry selector: log2(searchRange/2)")
        , USHORT(0, "range shift: 2x segment count - search range")
        // endCount[segCount]
        , USHORT(0x41, "the letter 'A', for now")
        , USHORT(0xFFFF, "array terminator 0xFFFF")
        , USHORT(0, "a 'reserve pad' value; must be 0")
        // startCount[segCount]
        , USHORT(0x41, "the letter 'A', for now")
        , USHORT(0xFFFF, "array terminator 0xFFFF")
        // the following two values are val[segcount]
        , USHORT(1, "delta for segment (only 1 segment = only 1 value)")
        , USHORT(0, "range offset for segment (only 1 segment = only 1 value)")
        , USHORT(0, "glyph id array")
      ],
      "head": [
          FIXED(0x00010000, "table version")
        , FIXED(1, "font version")
        , ULONG(0, "0xB1B0AFBA minus (sum of entire font as ULONGs)")
        , ULONG(0x5F0F3CF5, "OpenType magic number")
        , USHORT(0x00, "flags")
        , USHORT(1024, "units per EM, we go with 1024")
        , LONGDATETIME(Date.now(), "date created")
        , LONGDATETIME(Date.now(), "date modified")
        , SHORT(data.xMin, "global xMin")
        , SHORT(data.yMin, "global yMin")
        , SHORT(data.xMax, "global xMax")
        , SHORT(data.yMax, "global yMax")
        , USHORT(0, "mac Style")
        , USHORT(8, "smallest readable size in pixels. We claim 8px for no real reason")
        , SHORT(2, "deprecated value (font direction hint). must be 0x0002")
        , SHORT(0, "offset datatype (we use 0, for SHORT offsets")
        , SHORT(0, "glyph data format. default value = 0")
      ],
      "hhea": [
          FIXED(0x00010000, "table version")
        , FWORD(data.yMax, "typographic ascender")
        , FWORD(data.yMin, "typographic descender")
        , UFWORD(0, "Maximum advance width value in 'hmtx' table")
        , FWORD(0, "Minimum left sidebearing value in 'hmtx' table")
        , FWORD(0, "Minimum right sidebearing value; calculated as Min(aw - lsb - (xMax - xMin))")
        , FWORD(0, "Max(lsb + (xMax - xMin))")
        , SHORT(0, "Used to calculate the slope of the cursor (rise/run); 1 for vertical.")
        , SHORT(0, "The amount by which a slanted highlight on a glyph needs to be shifted to produce the best appearance. Set to 0 for non-slanted fonts")
        , SHORT(0, "reserved; must be 0")
        , SHORT(0, "reserved; must be 0")
        , SHORT(0, "reserved; must be 0")
        , SHORT(0, "reserved; must be 0")
        , SHORT(0, "metricDataFormat, 0 for current format")
        , USHORT(2, "number of hMetric entries. We only encode 1 glyph, so there are 2: one for .notdef, and one for our real glyph")
      ],
      "hmtx": [ // uses struct longHorMetric{USHORT advanceWidth, SHORT lsb}. NOTE: we do not encode any lsb values (which would be SHORT[])
        // first entry longHorMetric (notdef)
          USHORT(0)
        , SHORT(0)
        // second entry longHorMetric (real glyph)
        , USHORT(data.xMax)
        , SHORT(0)
      ],
      "maxp": [
          FIXED(0x00010000, "table version 1.0")
        , USHORT(2, "number of glyphs in the font")
        , USHORT(data.maxPoints, "maximum points in a non-composite glyph")
        , USHORT(1, "Maximum contours in a non-composite glyph")
        , USHORT(0, "Maximum points in a composite glyph")
        , USHORT(0, "Maximum contours in a composite glyph")
        , USHORT(2, "number of twilight zones. 1 = no twilight zone (Z0). default = 2")
        // the rest of this table can be all zeroes. It's mostly TTF related and this is a CFF font.
        , USHORT(0), USHORT(0), USHORT(0), USHORT(0), USHORT(0), USHORT(0), USHORT(0), USHORT(0)
      ],
      "name": [
          USHORT(0, "format 0")
        , USHORT(2, "number of name records")
        , USHORT(0x1E, "offset for the string data, relative to the table start"),
        // name records: {platform/encoding/language, nameid, length, offset}
        , USHORT(3), USHORT(1), USHORT(0x0409), USHORT(1), USHORT(0), USHORT(0)
        , USHORT(3), USHORT(1), USHORT(0x0409), USHORT(2), USHORT(0), USHORT(0)
        // and the string data is a single null character
        , USHORT(0x00)
      ],
      "post": [
        // I hate this table. It's only relevant to printing, which we don't care about.
        FIXED(0x00030000, "most recent post table format"), FIXED(0), FWORD(0), FWORD(0), ULONG(0), ULONG(0), ULONG(0), ULONG(0)
      ],
    }
  };

  OTFFONT.prototype = {
    toDataURI: function() {
      var tables = this.tables,
          ordered = Object.keys(tables).sort(),
          tags = [],
          blobs = [],
          header = [
              CHARARRAY("OTTO")
            , USHORT(9, "number of tables in the font")
            , USHORT(8 * 16, "searchRange; (Maximum power of 2 <= numTables) x 16.")
            , USHORT(3, "entrySelector; Log2(maximum power of 2 <= numTables).")
            , USHORT(16, "rangeShift; NumTables x 16-searchRange = 9*16 - 8*16 = 16.")
          ];

      ordered.forEach(function(tag) {
        var table = tables[tag];
        tags[tag] = [
            CHARARRAY(tag),
          , ULONG(0, "table checksum")
          , ULONG(12 + (9*16) + blobs.length, "offset for this table, from start of file (header is 12 bytes, tag block is 9 * 16 bytes).")
          , ULONG(table.length, "length of this table")
        ];
        blobs = blobs.concat(tables[tag]);
        // ensure four-byte alignment
        while(blobs.length % 4 !== 0) {
          blobs.push(BYTE(0));
        }
      });
      return "data:application/x-font-otf;base64," + btoa(build(header, tags, blobs));
    }
  };

	var GlyphMaker = function(quadSize) {
    this.quadSize = quadSize;
	};

	GlyphMaker.prototype = {
		make: function(label, data) {
      return new OTFFONT(label, data);
		}
	}

  window.GlyphMaker = GlyphMaker;
}());

// test
new GlyphMaker(1024).make("x", {
  xMin: 0,
  yMin: 0,
  xMax: 1024,
  yMax: 1024,
  maxPoints: 4,
  path: [ // 20-unit inner padded rectangle
      [20,20]
    , [20,1004]
    , [1004,20]
    , [1004,1004]
  ]
});

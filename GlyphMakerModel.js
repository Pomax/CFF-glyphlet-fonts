// { property, format, description, default}

var fontname = "customfont";

var CFFModel = {
  "header": [
      ["major", Card8, "major version", 1]
    , ["minor", Card8, "minor version", 0]
    , ["hdrSize", Card8, "the header is 4 bytes long", 4]
    , ["offSize", OffSize, "offsets use 1 byte", 1]
  ],

  "name index": [
      ["count", Card16, "number of stored names (We only have one)", 1]
    , ["offSize", OffSize, "offsets use 1 byte", 1]
    // there are (count+1) offsets: the first offset is always 1, and the last offset marks the end of the table
    , [ "offset", [
        ["0", Offset1, "start od data block", 1]
      , ["1", Offset1, "end of data block (due to being last offset)", 1 + fontname.length]
    ]]
    // object data
    , ["object data", CHARARRAY, "", fontname]
  ],

  "top dict index": [
      ["count", Card16, "number of stored indices (We have one)", 1]
    , ["offSize", OffSize, "offsets use 2 bytes", 2]
    , ["offset", [
        ["0", Offset2, "", 1]
      , ["1", Offset2, "", 1 + top_dict_data.length]
    ]]
    // data block is concatenated in.
  ]
  .concat(top_dict_data),

  "string index": [
      ["count", Card16, "number of stored strings", strings]
    , ["offSize", OffSize, "offsets use 1 byte", 1]
    // offset array
    , ["offset", (function() {
      var idx = 0,
          tally = 1,
          data = [];
      strings.forEach(function(s) {
        data.push([""+(idx++), Offset1, "offset "+idx, tally]);
        tally += s.length;
      });
      return data;
    }())]
    // data block is concatenated in.
  ]
  .concat(strings),

  "global subroutine index": [
    ["count", Card16, "no global subroutines (for the moment)", 0]
  ],

  // this is the part that actually contains the character outline data,
  // encoded as Type 2 charstrings (one charstring per glyph).
  "charstring index": [
      ["count", Card16, "how many charstrings in this font?", 2],
    , ["offSize", OffSize, "offsets use 1 byte", 1]
    , ["offset", (function() {
      var idx = 0,
          tally = 1,
          data = [];
      charstrings.forEach(function(s) {
        data.push([""+(idx++), Offset1, "offset "+idx, tally]);
        tally += s.length;
      });
      return data;
    }())]
    // charstrings block is concatenated in.
  ]
  .concat(charstrings),

  "private dict": [
      ["BlueValues", DICTVALUE, "empty bluevalues array", [OPERAND(6)]]
    , ["FamilyBlues", DICTVALUE, "empty familyblues array", [OPERAND(8)]]
    , ["StdHw", DICTVALUE, "dominant horizontal stem width. We set it to 10", [NUMBER(10), OPERAND(10)]]
    , ["StdVW", DICTVALUE, "dominant vertical stem width. We set it to 10", [NUMBER(10), OPERAND(11)]]
  ]
};

var TableModels = {
  "OS/2": [
      ["version", USHORT, "OS/2 table version 1, because this is a very simple font.", 0x0001]
    , ["xAvgCharWidth", SHORT, "xAvgCharWidth", 0]
    , ["usWeightClass", USHORT, "usWeightClass", 0x2000]
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
    , ["ulUnicodeRange1", ULONG, "", 0]
    , ["ulUnicodeRange2", ULONG, "", 0]
    , ["ulUnicodeRange3", ULONG, "", 0]
    , ["ulUnicodeRange4", ULONG, "", 0]
    , ["achVendID", CHARARRAY, "vendor id", "noop"]
    , ["fsSelection", USHORT, "font selection flag: bit 6 (lsb=0) is high, to indicate 'regular font'.", 0x40]
    , ["usFirstCharIndex", USHORT, "first character to be in this font", 0x41]
    , ["usLastCharIndex", USHORT, "last character to be in this font", 0x41]
    , ["sTypoAscender", SHORT, "typographic ascender", 1024]
    , ["sTypoDescender", SHORT, "typographic descender", 0]
    , ["sTypoLineGap", SHORT, "line gap", 0]
    , ["usWinAscent", USHORT, data.yMax, "usWinAscent"]
    , ["usWinDescent", USHORT,-data.yMin, "usWinDescent"]
    , ["ulCodePageRange1", ULONG, "", 0]
    , ["ulCodePageRange2", ULONG, "", 0]
  ],
  "cmap": [
      ["version", USHORT, "table version", 0]
    , ["numTables", USHORT, "number of subtables", 1]
    // Note that we're hard-wiring cmap here for a single table.
    // this is NOT the usual layout for a cmap table!
    , ["platformID", USHORT, "platform", 3]
    , ["encodingID", USHORT, "encoding", 1] // default Unicode BMP (UCS-2)
    , ["offset", ULONG, "table offset from cmap-start", 0x0C]
    // subtable start
    , ["subtable", [
        ["format", USHORT, "format 4 subtable", 4]
      , ["length", USHORT, "table length", 0x20]
      , ["language", USHORT, "language", 0]
      , ["segCountX2", USHORT, "2x segment count; we only have one segment", 2]
      , ["searchRange", USHORT, "search range: 2 * (2^floor(log2(segCount)))", 2]
      , ["entrySelector", USHORT, "entry selector: log2(searchRange/2)", 0]
      , ["rangeShift", USHORT, "range shift: 2x segment count - search range", 0]
      // endCount[segCount]
      , ["endCount", [
          ["characterCode ", USHORT, "the letter 'A', for now", 0x41]
        , ["characterCode ", USHORT, "array terminator 0xFFFF", 0xFFFF]]]
      , ["reservedPad", USHORT, "a 'reserve pad' value; must be 0", 0]
      // startCount[segCount]
      , ["startCount", [
          ["characterCode ", USHORT, "the letter 'A', for now", 0x41]
        , ["characterCode ", USHORT, "array terminator 0xFFFF", 0xFFFF]]]
      // the following two values are val[segcount]
      , ["idDelta", USHORT, "delta for segment (only 1 segment = only 1 value)", 1]
      , ["idRangeOffset", USHORT, "range offset for segment (only 1 segment = only 1 value)", 0]
      , ["glyphIdArray", USHORT, "glyph id array", 0]
    ]]
  ],
  "head": [
      ["version", FIXED, "table version", 0x00010000]
    , ["fontRevision", FIXED, "font version", 1]
    , ["checkSumAdjustment", ULONG, "0xB1B0AFBA minus (sum of entire font as ULONGs)", 0]
    , ["magicNumber", ULONG, "OpenType magic number, used to verify this is, in fact, an OpenType font", 0x5F0F3CF5]
    , ["flags", USHORT, "flags, see http://www.microsoft.com/typography/otspec/head.htm", 0]
    , ["unitsPerEm", USHORT, "units per EM, we go with 1024 (ttf default. cff is usually 2000 instead)", 1024]
    , ["created", LONGDATETIME, "date created", Date.now()]
    , ["modified", LONGDATETIME, "date modified", Date.now()]
    , ["xMin", SHORT, "global xMin", 0]
    , ["yMin", SHORT, "global yMin", 0]
    , ["xMax", SHORT, "global xMax", 0]
    , ["yMax", SHORT, "global yMax", 0]
    , ["macStyle", USHORT, "font style, according to old Apple mac rules", 0]
    , ["lowestRecPPEM", USHORT, "smallest readable size in pixels. We claim 8px for no real reason", 8]
    , ["fontDirectionHint", SHORT, "deprecated value (font direction hint). must be 0x0002", 2]
    , ["indexToLocFormat", SHORT, "offset datatype (we use 0, for SHORT offsets", 0]
    , ["glyphDataFormat", SHORT, "glyph data format. default value = 0", 0]
  ],
  "hhea": [
      ["version", FIXED, "table version", 0x00010000]
    , ["Ascender", FWORD, "typographic ascender", 0]
    , ["Descender", FWORD, "typographic descender", 0]
    , ["LineGap", UFWORD, "Maximum advance width value in 'hmtx' table", 0]
    , ["advanceWidthMax", FWORD, "Maximum advance width value in 'hmtx' table.", 0]
    , ["minLeftSideBearing", FWORD, "Minimum left sidebearing value in 'hmtx' table.", 0]
    , ["minRightSideBearing", FWORD, "Minimum right sidebearing value; calculated as Min(aw - lsb - (xMax - xMin)).", 0]
    , ["xMaxExtent", FWORD, "Max(lsb + (xMax - xMin))", 0]
    , ["caretSlopeRise", SHORT, "Used to calculate the slope of the cursor (rise/run); 1 for vertical.", 0]
    , ["caretSlopeRun", SHORT, "The amount by which a slanted highlight on a glyph needs to be shifted to produce the best appearance. Set to 0 for non-slanted fonts", 0]
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
        [["advanceWidth", USHORT, "", 0] , ["lsb", SHORT, "", 0]]
        // second entry longHorMetric (real glyph)
      , [["advanceWidth", USHORT, "", 0] , ["lsb", SHORT, "", 0]]
    ]]
  ],
  "maxp": [
      ["version", FIXED, "table version 1.0", 0x00010000]
    , ["numGlyphs", USHORT, "number of glyphs in the font", 2]
    , ["maxPoints", USHORT, "maximum points in a non-composite glyph", 3]
    , ["maxContours", USHORT, "Maximum contours in a non-composite glyph", 1]
    , ["maxCompositePoints", USHORT, "Maximum points in a composite glyph", 0]
    , ["maxCompositeContours", USHORT, "Maximum contours in a composite glyph", 0]
    , ["maxZones", USHORT, "number of twilight zones. 1 = no twilight zone (Z0). default = 2", 2]
    // the rest of this table can be all zeroes. It's mostly TTF related and this is a CFF font.
    , ["maxTwilightPoints", USHORT, "", 0]
    , ["maxStorage", USHORT, "", 0]
    , ["maxFunctionDefs", USHORT, "", 0]
    , ["maxInstructionDefs", USHORT, "", 0]
    , ["maxStackElements", USHORT, "", 0]
    , ["maxSizeOfInstructions", USHORT, "", 0]
    , ["maxComponentElements", USHORT, "", 0]
    , ["maxComponentDepth", USHORT, "", 0]
  ],
  "name": [
      ["format", USHORT, "format 0", 0]
    , ["count", USHORT, "number of name records", 2]
    , ["stringOffset", USHORT, "offset for the string data, relative to the table start", 0x1E],
    // name records: {platform/encoding/language, nameid, length, offset}
    , ["NameRecord", [
          NAMERECORD(1)
        , NAMERECORD(2)  // NAMERECORD(v) =  USHORT(3), USHORT(1), USHORT(0x0409), USHORT(v), USHORT(0), USHORT(0)
      ]]
    // and the string data is a single null character
    , ["stringData", USHORT, "", 0x00]
  ],
  "post": [
    // I hate this table. It's only relevant to printing, which we don't care about.
      ["version", FIXED, "most recent post table format", 0x00030000]
    , ["italicAngle", FIXED, "", 0]
    , ["underlinePosition", FWORD, "", 0]
    , ["underlineThickness", FWORD, "", 0]
    , ["isFixedPitch", ULONG, "", 0]
    , ["minMemType42", ULONG, "", 0]
    , ["maxMemType42", ULONG, "", 0]
    , ["minMemType1", ULONG, "", 0]
    , ["maxMemType1", ULONG, "", 0]
  ]
};

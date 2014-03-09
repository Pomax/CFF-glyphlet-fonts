define(
["struct", "dataBuilding", "asHex", "CFFHeader", "NameIndex", "StringIndex", "TopDictIndex", "SubroutineIndex", "Charset", "Encoding", "CharStringIndex", "PrivateDict"],
function(struct, dataBuilder, asHex, CFFHeader, NameIndex, StringIndex, TopDictIndex, SubroutineIndex, Charset, Encoding, CharStringIndex, PrivateDict) {
  "use strict";


  // Hook up the charset, encoding, charstrings and private dict offsets.
  // we need to do this iteratively because setting their values may change
  // the sizeOf for the top dict, and thus the offsets *after* the top dict.
  // Hurray.
  function fixTopDictIndexOffsets(baseSize, topDictIndex, charset, encoding, charStringIndex, privateDict) {
    var ch_off, en_off, cs_off, pd_off, o_ch_off, o_en_off, o_cs_off, o_pd_off, base, pd_size = privateDict.sizeOf();
    // "old" values
    o_ch_off = o_en_off = o_cs_off = o_pd_off = -1;
    // "current" values
    ch_off = en_off = cs_off = pd_off = 0;
    while(ch_off !== o_ch_off && en_off !== o_en_off && cs_off !== o_cs_off && pd_off !== o_pd_off) {
      o_ch_off = ch_off; o_en_off = en_off; o_cs_off = cs_off; o_pd_off = pd_off;
      base = baseSize + topDictIndex.sizeOf();
      ch_off = base;
      en_off = ch_off + charset.sizeOf();
      cs_off = en_off + encoding.sizeOf();
      pd_off = cs_off + charStringIndex.sizeOf();
      topDictIndex.set("charset", ch_off);
      topDictIndex.set("Encoding", en_off);
      topDictIndex.set("CharStrings", cs_off);
      topDictIndex.set("Private", [pd_size, pd_off]);
      topDictIndex.finalise();
    }
  }


  var CFF = function(input) {
    if(!this.parse(input)) {
      input = input || {};
      this.fill(input);

      this.header = new CFFHeader({
        major: 1,
        minor: 0,
        offSize: 1
      });

      var nameIndex = new NameIndex([
        input.postscriptName
      ]);
      this["name index"] = nameIndex;

      // because the top dict needs to know about string index values,
      // as well as offsets to other bits of the CFF, it gets declared
      // last, despite technicaly "living" here in terms of CFF byte layout.

      var stringIndex = new StringIndex([
        input.fontVersion,
        input.fontName,
        input.fontFamily
      ].concat(input.letters));
      this["string index"] = stringIndex;

      var globalSubroutines = new SubroutineIndex({
        count: 0
      });
      this["global subroutines"] = globalSubroutines;

      var charset = new Charset(stringIndex, input);
      this["charset"] = charset;

      var encoding = new Encoding(input);
      this["encoding"] = encoding;

      var charStringIndex = new CharStringIndex(input.letters, input.charString);
      this["charstring index"] = charStringIndex;

      var privateDict = new PrivateDict({
          "BlueValues":  [0, 0]
        , "FamilyBlues": [0, 0]
        , "StdHW": 10
        , "StdVW": 10
        , "defaultWidthX": input.xMax
        , "nominalWidthX": input.xMax
      });
      this["private dict"] = privateDict;

      var topDictIndex = new TopDictIndex({
          "version":     stringIndex.getStringId(input.fontVersion)
        , "FullName":   stringIndex.getStringId(input.fontName)
        , "FamilyName": stringIndex.getStringId(input.fontFamily)
        , "Weight":      389   // one of the 390 default strings in the CFF string catalog
        , "UniqueID":      1   // really this just has to be 'anything'
        , "FontBBox":   [input.xMin, input.yMin, input.xMax, input.yMax]
        , "charset":       0   // placeholder for offset to charset block, from the beginning of the CFF file
        , "Encoding":      0   //          "   "            encoding block               "    "
        , "CharStrings":   0   //          "   "            charstrings block            "    "
        , "Private":   [0, 0]  // sizeof + "   "            private dict block           "    "
      });
      this["top dict index"] = topDictIndex;

      var baseSize = this.header.sizeOf() + nameIndex.sizeOf() + stringIndex.sizeOf() + globalSubroutines.sizeOf();
      fixTopDictIndexOffsets(baseSize, topDictIndex, charset, encoding, charStringIndex, privateDict);
    }
  };

  CFF.prototype = new struct([
      ["header",             "LITERAL", "the CFF header"]
    , ["name index",         "LITERAL", "the name index for this font"]
    , ["top dict index",     "LITERAL", "the global font dict"]
    , ["string index",       "LITERAL", "the strings used in this font (there are 390 by-spec strings already)"]
    , ["global subroutines", "LITERAL", "the global subroutines that all charstrings can use"]
    , ["charset",            "LITERAL", "the font's character set"]
    , ["encoding",           "LITERAL", "the encoding information for this font"]
    , ["charstring index",   "LITERAL", "the charstring definition for all encoded glyphs"]
    , ["private dict",       "LITERAL", "the private dicts; each dict maps a partial font."]
  ]);

  return CFF;
});

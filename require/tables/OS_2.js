define(["./Table"], function(Table){

  var OS_2 = function(dataBlock) {
    if(dataBlock) { this.parse(dataBlock); }
  };

  OS_2.prototype = new Table([
    ["version",             "USHORT",    "OS/2 table version"]
  , ["xAvgCharWidth",       "SHORT",     "xAvgCharWidth"]
  , ["usWeightClass",       "USHORT",    "usWeightClass"]
  , ["usWidthClass",        "USHORT",    "usWidthClass"]
  , ["fsType",              "USHORT",    "this value defines embedding/install properties. 0 = no restrictions"]
  , ["ySubscriptXSize",     "SHORT",     ""]
  , ["ySubscriptYSize",     "SHORT",     ""]
  , ["ySubscriptXOffset",   "SHORT",     ""]
  , ["ySubscriptYOffset",   "SHORT",     ""]
  , ["ySuperscriptXSize",   "SHORT",     ""]
  , ["ySuperscriptYSize",   "SHORT",     ""]
  , ["ySuperscriptXOffset", "SHORT",     ""]
  , ["ySuperscriptYOffset", "SHORT",     ""]
  , ["yStrikeoutSize",      "SHORT",     ""]
  , ["yStrikeoutPosition",  "SHORT",     ""]
    // a standard font has font classification 0 (meaning subfamily "Regular")
  , ["sFamilyClass",        "SHORT",     "sFamilyClass"]
    // Oh look! A trademarked classification system, the bytes for which cannot be legally set unless you pay HP.
    // Why this is part of the OS/2 table instead of its own proprietary table, I will likely never truly know.
  , ["bFamilyType",         "BYTE",      ""]
  , ["bSerifStyle",         "BYTE",      ""]
  , ["bWeight",             "BYTE",      ""]
  , ["bProportion",         "BYTE",      ""]
  , ["bContrast",           "BYTE",      ""]
  , ["bStrokeVariation",    "BYTE",      ""]
  , ["bArmStyle",           "BYTE",      ""]
  , ["bLetterform",         "BYTE",      ""]
  , ["bMidline",            "BYTE",      ""]
  , ["bXHeight",            "BYTE",      ""]
  , ["ulUnicodeRange1",     "ULONG",     ""]
  , ["ulUnicodeRange2",     "ULONG",     ""]
  , ["ulUnicodeRange3",     "ULONG",     ""]
  , ["ulUnicodeRange4",     "ULONG",     ""]
  , ["achVendID",           "CHARARRAY", "vendor id (http://www.microsoft.com/typography/links/vendorlist.aspx for the 'real' list)"]
  , ["fsSelection",         "USHORT",    "font selection flag: bit 6 (lsb=0) is high, to indicate 'regular font'."]
  , ["usFirstCharIndex",    "USHORT",    "first character to be in this font."]
  , ["usLastCharIndex",     "USHORT",    "last character to be in this font."]
    // vertical metrics: see http://typophile.com/node/13081 for how the hell these work (it's quite amazing)
  , ["sTypoAscender",       "SHORT",     "typographic ascender"]
  , ["sTypoDescender",      "SHORT",     "typographic descender"]
  , ["sTypoLineGap",        "SHORT",     "line gap"]
  , ["usWinAscent",         "USHORT",    "usWinAscent"]
  , ["usWinDescent",        "USHORT",    "usWinDescent"]
  , ["ulCodePageRange1",    "ULONG",     ""]
  , ["ulCodePageRange2",    "ULONG",     ""]
    // By using the following five records, this becomes an OS/2 version 2, 3, or 4 table, rather than version 1 ---
  , ["sxHeight",            "SHORT",     ""]
  , ["sCapHeight",          "SHORT",     ""]
  , ["usDefaultChar",       "USHORT",    ""]
  , ["usBreakChar",         "USHORT",    ""]
  , ["usMaxContext",        "USHORT",    ""]
  ]);

  OS_2.prototype.constructor = OS_2;

  return OS_2;

});

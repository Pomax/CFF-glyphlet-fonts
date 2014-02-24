define(["../struct"], function(Table){
  "use strict";

  var OS_2 = function(input) {
    if(!this.parse(input)) {
      input = input || {};
      this.fill(input);
      if(input.version < 2) {
       this.unset(["sxHeight","sCapHeight","usDefaultChar","usBreakChar","usMaxContext"]);
      }
    }
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
  , ["sFamilyClass",        "SHORT",     "a standard font has font classification 0 (meaning subfamily 'Regular')"]
  , ["bFamilyType",         "BYTE",      ""] // panose classification, byte 1
  , ["bSerifStyle",         "BYTE",      ""] // panose classification, byte 2
  , ["bWeight",             "BYTE",      ""] // panose classification, byte 3
  , ["bProportion",         "BYTE",      ""] // panose classification, byte 4
  , ["bContrast",           "BYTE",      ""] // panose classification, byte 5
  , ["bStrokeVariation",    "BYTE",      ""] // panose classification, byte 6
  , ["bArmStyle",           "BYTE",      ""] // panose classification, byte 7
  , ["bLetterform",         "BYTE",      ""] // panose classification, byte 8
  , ["bMidline",            "BYTE",      ""] // panose classification, byte 9
  , ["bXHeight",            "BYTE",      ""] // panose classification, byte 10
  , ["ulUnicodeRange1",     "ULONG",     ""]
  , ["ulUnicodeRange2",     "ULONG",     ""]
  , ["ulUnicodeRange3",     "ULONG",     ""]
  , ["ulUnicodeRange4",     "ULONG",     ""]
  , ["achVendID",           "CHARARRAY", "vendor id (http://www.microsoft.com/typography/links/vendorlist.aspx for the 'real' list)"]
  , ["fsSelection",         "USHORT",    "font selection flag: bit 6 (lsb=0) is high, to indicate 'regular font'."]
  , ["usFirstCharIndex",    "USHORT",    "first character to be in this font."]
  , ["usLastCharIndex",     "USHORT",    "last character to be in this font."]
    // for information on how to set the vertical metrics for a font, see
    // http://typophile.com/node/13081 for how the hell these work (it's quite amazing)
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

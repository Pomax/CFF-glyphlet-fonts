define(["struct"], function(struct){
  "use strict";

  var OS_2 = function(input) {
    if(!this.parse(input)) {
      input = input || {};
      input.xAvgCharWidth = input.xAvgCharWidth || 0;
      input.usWeightClass = input.usWeightClass || 400;
      input.usWidthClass = input.usWidthClass || 1;
      // standard font = font classification 0 ("Regular")
      input.sFamilyClass= input.sFamilyClass || 0;
      input.fsType = input.fsType || 0;
      // font selection flag: bit 6 (lsb=0) is high, to indicate 'regular font'
      input.fsSelection = input.fsSelection || 0x0040;
      // we don't really care about the sub/super/strikeout values:
      input.ySubscriptXSize = input.ySubscriptXSize || 0;
      input.ySubscriptYSize = input.ySubscriptYSize || 0;
      input.ySubscriptXOffset = input.ySubscriptXOffset || 0;
      input.ySubscriptYOffset = input.ySubscriptYOffset || 0;
      input.ySuperscriptXSize = input.ySuperscriptXSize || 0;
      input.ySuperscriptYSize = input.ySuperscriptYSize || 0;
      input.ySuperscriptXOffset = input.ySuperscriptXOffset || 0;
      input.ySuperscriptYOffset = input.ySuperscriptYOffset || 0;
      input.yStrikeoutSize = input.yStrikeoutSize || 0;
      input.yStrikeoutPosition = input.yStrikeoutPosition || 0;
      // Oh look! A trademarked classification system the bytes
      // for which cannot be legally set unless you pay HP.
      // Why this is part of the OS/2 table instead of its own
      // proprietary table I will likely never truly know.
      input.bFamilyType = input.bFamilyType || 0;
      input.bSerifStyle = input.bSerifStyle || 0;
      input.bWeight = input.bWeight || 0;
      input.bProportion = input.bProportion || 0;
      input.bContrast = input.bContrast || 0;
      input.bStrokeVariation = input.bStrokeVariation || 0;
      input.bArmStyle = input.bArmStyle || 0;
      input.bLetterform = input.bLetterform || 0;
      input.bMidline = input.bMidline || 0;
      input.bXHeight = input.bXHeight || 0;
      input.ulUnicodeRange1 = input.ulUnicodeRange1 || 0;
      input.ulUnicodeRange2 = input.ulUnicodeRange2 || 0;
      input.ulUnicodeRange3 = input.ulUnicodeRange3 || 0;
      input.ulUnicodeRange4 = input.ulUnicodeRange4 || 0;
      input.ulCodePageRange1 = input.ulCodePageRange1 || 0;
      input.ulCodePageRange2 = input.ulCodePageRange2 || 0;
      // We don't care all too much about the next 5 values, but they're
      // required for an OS/2 version 2, 3, or 4 table.
      input.sxHeight = input.sxHeight || 0;
      input.sCapHeight = input.sCapHeight ||  0;
      input.usDefaultChar = input.usDefaultChar || 0;
      this.fill(input);
      if(input.version < 2) {
       this.unset(["sxHeight","sCapHeight","usDefaultChar","usBreakChar","usMaxContext"]);
      }
    }
  };

  OS_2.prototype = new struct([
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

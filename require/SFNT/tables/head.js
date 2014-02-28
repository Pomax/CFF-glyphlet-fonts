define(["struct"], function(struct){
  "use strict";

  var head = function(input) {
    if(!this.parse(input)) {
      input = input || {};
      input.version = input.version || 0x00010000;
      input.fontRevision = input.fontRevision || 0x00010000;
      input.checkSumAdjustment = input.checkSumAdjustment || 0;
      input.magicNumber =  0x5F0F3CF5;
      input.created = input.created || 0;
      input.modified = input.modified || 0;
      input.flags = input.flags || 0; // see http://www.microsoft.com/typography/otspec/head.htm, "flags" section
      input.macStyle = input.macStyle || 0;
      input.lowestRecPPEM = input.lowestRecPPEM || 8,
      // obsolete value: we force it to 2 as per spec
      input.fontDirectionHint = 2;
      // these two values do not apply to CFF fonts, yet are still necessary
      input.indexToLocFormat = input.indexToLocFormat || 0;
      input.glyphDataFormat = input.glyphDataFormat || 0;
      this.fill(input);
    }
  };

  head.prototype = new struct([
    ["version",            "FIXED",        "table version (should be 0x00010000)"]
  , ["fontRevision",       "FIXED",        "font reversion number"]
  , ["checkSumAdjustment", "ULONG",        "0xB1B0AFBA minus (ULONG sum of the entire font, computed with this value set to 0)"]
  , ["magicNumber",        "ULONG",        "OpenType magic number, used to verify this is, in fact, an OpenType font. Must be 0x5F0F3CF5"]
  , ["flags",              "USHORT",       "flags (see http://www.microsoft.com/typography/otspec/head.htm)"]
  , ["unitsPerEM",         "USHORT",       "how big is our quad, in font units"]
  , ["created",            "LONGDATETIME", "date created (seconds since 1904. often mistakenly seconds since 1970)"]
  , ["modified",           "LONGDATETIME", "date modified (seconds since 1904. often mistakenly seconds since 1970)"]
  , ["xMin",               "SHORT",        "global xMin"]
  , ["yMin",               "SHORT",        "global yMin"]
  , ["xMax",               "SHORT",        "global xMax"]
  , ["yMax",               "SHORT",        "global yMax"]
  , ["macStyle",           "USHORT",       "font style, according to old Apple mac rules"]
  , ["lowestRecPPEM",      "USHORT",       "smallest readable size in pixels."]
  , ["fontDirectionHint",  "SHORT",        "deprecated value (font direction hint). should be 0x0002"]
  , ["indexToLocFormat",   "SHORT",        "offset datatype (0 means SHORT, 1 means LONG)"]
  , ["glyphDataFormat",    "SHORT",        "glyph data format. default value = 0"]
  ]);

  head.prototype.constructor = head;

  return head;

});

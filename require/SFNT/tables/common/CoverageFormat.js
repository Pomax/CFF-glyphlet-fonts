define(["struct"], function(struct) {
	"use strict";

  var CoverageFormat1 = function(input) {
    if(!this.parse(input)) {
      input = input || {};
      input.CoverageFormat = 1;
      this.fill(input);
    }
  };

  CoverageFormat1.prototype = new struct([
      ["CoverageFormat", "USHORT",  "format 1"]
    , ["GlyphCount",     "USHORT",  "number of glyphs"]
    , ["GlyphArray",     "LITERAL", "array of glyphs covered by this table"]
  ]);

  var CoverageFormat2 = function(input) {
    if(!this.parse(input)) {
      input = input || {};
      input.CoverageFormat = 2;
      this.fill(input);
    }
  };

  CoverageFormat2.prototype = new struct([
      ["CoverageFormat", "USHORT",  "format 1"]
    , ["RangeCount",     "USHORT",  "number of ranges"]
    , ["RangeRecord",    "LITERAL", "array of range records covered by this table"]
  ]);

  return {
    "1": CoverageFormat1,
    "2": CoverageFormat2
  };

});

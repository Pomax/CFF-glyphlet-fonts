define(["struct"], function(struct) {
	"use strict";

  /**
   * Format 1 encodes an, effectively, unordered list of glyphs
   */

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


  /**
   * Format 2 encodes sequential ranges of glyphs,
   * using range records.
   */

  var RangeRecord = function(input) {
    if(!this.parse(input)) {
      input = input || {};
      input.CoverageFormat = 2;
      this.fill(input);
    }
  };

  RangeRecord.prototype = new struct([
      ["Start",              "GlyphID", "First GlyphID in the range"]
    , ["End",                "GlyphID", "Last GlyphID in the range"]
    , ["StartCoverageIndex", "USHORT",  "Coverage Index of first GlyphID in range"]
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
    , ["RangeRecords",   "LITERAL", "array of range records covered by this table"]
  ]);


  return {
    "1": CoverageFormat1,
    "2": CoverageFormat2
  };

});

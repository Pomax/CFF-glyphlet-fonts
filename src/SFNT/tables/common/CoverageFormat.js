define(["struct", "makeStructy", "dataBuilding"], function(struct, makeStructy, dataBuilder) {
	"use strict";


  /**
   * Format 1 encodes an, effectively, unordered list of glyphs
   */

  var CoverageFormat1 = function(input) {
    if(!this.parse(input)) {
      input = input || {};
      input.CoverageFormat = 1;
      var data = [];
      input.GlyphArray.forEach(function(v) {
        data = data.concat(dataBuilder.encoder.GlyphID(v));
      });
      input.GlyphArray = data;
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
      input.RangeCount = input.startGlyphs.length;
      input.RangeRecords = input.startGlyphs.map(function(glyph, idx) {
        return new RangeRecord({
          Start: glyph,
          End: glyph,
          StartCoverageIndex: idx
        })
      });
      delete input.startGlyphs;
      this.fill(input);
      makeStructy(input.RangeRecords);
    }
  };

  CoverageFormat2.prototype = new struct([
      ["CoverageFormat", "USHORT",  "format 1"]
    , ["RangeCount",     "USHORT",  "number of ranges"]
    , ["RangeRecords",   "LITERAL", "array of range records covered by this table"]
  ]);


  // return a selection object based on the format
  return {
    "1": CoverageFormat1,
    "2": CoverageFormat2
  };

});

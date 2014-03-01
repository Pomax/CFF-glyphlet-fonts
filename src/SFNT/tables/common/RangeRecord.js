define(["struct"], function(struct) {
  "use strict";

	var RangeRecord = function(input) {
	  if(!this.parse(input) {
      input = input || {};
      this.fill(input);
    }
	};

  RangeRecord.prototype = new struct([
      ["start",              "GlyphID", "start of the coverage range"]
    , ["end",                "GlyphID", "end of the coverage range"]
    , ["StartCoverageIndex", "USHORT",  "Coverage Index of first GlyphID in range"]
  ]);

  return RangeRecord;
})
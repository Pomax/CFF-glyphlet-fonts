define(["../../../struct"], function(Table) {
  "use strict";

  var Segment = function(input) {
    if(!this.parse(input)) {
      input = input || {};
      this.fill(input);
    }
  };

  Segment.prototype = new Table([
  	  ["end",     "USHORT", "end code for this segment"]
  	, ["start",   "USHORT", "start code for this segment"]
  	, ["delta",   "SHORT",  "delta to ensure continuous sequence wrt previous segments"]
  	, ["offset",  "USHORT", "Offsets into glyphIdArray"]
  	, ["glyphId", "USHORT", "Glyph index"]
  ]);

  return Segment;
});

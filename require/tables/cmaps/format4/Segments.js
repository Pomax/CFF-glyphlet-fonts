define(["./Segment", "../../../dataBuilding"], function(Segment, dataBuilder) {
  "use strict";
  var encoder = dataBuilder.encoder;
  var terminator = encoder.USHORT(0xFFFF);

  var Segments = function() {
  	this.data = [];
  };

  Segments.prototype = {
    addSegment: function(code) {
      var idx = this.data.length + 1;
      this.data.push(new Segment({
        end: code,
        start: code,
        delta: -(code - idx),
        offset: 0,
        glyphId: idx
      }));
    },
    finalise: function() {
      var terminator = new Segment({
        end: 0xFFFF,
        start: 0xFFFF,
        delta: 1,
        offset: 0
      });
      terminator.unset(["glyphId"]);
      this.data.push(terminator);
    }
  };

  return Segments;
});

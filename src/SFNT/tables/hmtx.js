define(["struct", "LongHorMetric"], function(struct, LongHorMetric) {
  "use strict";

  var hmtx = function(input, numberOfHMetrics) {
    if(!this.parse(input)) {
      this.fill({});
      this.build(input, numberOfHMetrics);
    }
  };

  hmtx.prototype = new struct("hmtx table", [
    ["hMetrics", "LITERAL", "the array of horizontal metrics for the glyphs in this font"]
  ]);

  hmtx.prototype.build = function(globals, numberOfHMetrics) {
    var data = []
    for(var i=0; i < numberOfHMetrics - 1; i++) {
      data.push(new LongHorMetric({ advanceWidth: 0, lsb: 0 }));
    }
    data.push(new LongHorMetric({
      advanceWidth: globals.xMax - globals.xMin,
      lsb: globals.xMin
    }));
    this.hMetrics = data;
  };

  return hmtx;

});

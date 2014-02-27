define(["struct", "LongHorMetric"], function(struct, LongHorMetric){
  "use strict";

  var hmtx = function(input, numberOfHMetrics) {
    this.hMetrics = [];
    if(!this.parse(input)) {
      this.build(input, numberOfHMetrics);
    }
  };

  hmtx.prototype = new struct();
  hmtx.prototype.constructor = hmtx;

  hmtx.prototype.build = function(globals, numberOfHMetrics) {
    for(var i=0; i < numberOfHMetrics - 1; i++) {
      this.hMetrics.push(new LongHorMetric({ advanceWidth: 0, lsb: 0 }));
    }
    this.hMetrics.push(new LongHorMetric({
      advanceWidth: globals.xMax - globals.xMin,
      lsb: globals.xMin
    }));
  };

  hmtx.prototype.toJSON = function() {
    return {
      hMetrics: this.hMetrics.map(function(v) { return v.toJSON(); })
    };
  };

  hmtx.prototype.toData = function() {
    var data = [];
    this.hMetrics.forEach(function(v) {
      data = data.concat(v.toData());
    });
    return data;
  };

  return hmtx;

});

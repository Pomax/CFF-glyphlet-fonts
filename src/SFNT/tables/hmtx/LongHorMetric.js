define(["struct"], function(struct){
  "use strict";

  /**
   * Name record constructor
   */
  var LongHorMetric = function(input) {
    if(!this.parse(input)) {
      input = input || {};
      this.fill(input);
    }
  };

  /**
   *
   */
  LongHorMetric.prototype = new struct("LongHorMetric", [
      ["advanceWidth", "USHORT", ""]
    , ["lsb",          "SHORT",  ""]
  ]);

  LongHorMetric.prototype.constructor = LongHorMetric;


  return LongHorMetric
});

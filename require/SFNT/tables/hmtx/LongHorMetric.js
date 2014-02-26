define(["struct"], function(Table){
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
  LongHorMetric.prototype = new Table([
      ["advanceWidth", "USHORT", ""]
    , ["lsb",          "SHORT",  ""]
  ]);

  LongHorMetric.prototype.constructor = LongHorMetric;


  return LongHorMetric
});

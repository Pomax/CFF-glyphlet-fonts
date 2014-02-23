define(["../struct"], function(Table){
  "use strict";

  var LongHorMetric = function() {
    return [
      ["advanceWidth", "USHORT", ""]
    , ["lsb",          "SHORT",  ""]
    ];
  };

  var hmtx = function(input) {
    if(!this.parse(input)) {
      input = input || {};
      this.fill(input);
    }
  };

  hmtx.prototype = new Table([
    // CONTINUE HERE
  ]);

  hmtx.prototype.constructor = hmtx;

  return hmtx;

});

define(["./Table"], function(Table){

  var LongHorMetric = function() {
    return [
      ["advanceWidth", "USHORT", ""]
    , ["lsb",          "SHORT",  ""]
    ];
  };

  var hmtx = function(dataBlock) {
    if(dataBlock) { this.parse(dataBlock); }
  };

  hmtx.prototype = new Table([
    // CONTINUE HERE
  ]);

  hmtx.prototype.constructor = hmtx;

  return hmtx;

});

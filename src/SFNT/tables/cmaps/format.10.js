define(["struct"], function(struct){
  "use strict";

  var format10 = function(input) {
    if(!this.parse(input)) {
      input = input || {};
      input.format = 10;
      this.fill(input);
    }
  };

  format10.prototype = new struct("cmap format 10", [
    ["format", "USHORT", "subtable format"]
  ]);

  return format10;
});

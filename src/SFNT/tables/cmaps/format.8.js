define(["struct"], function(struct){
  "use strict";

  var format8 = function(input) {
    if(!this.parse(input)) {
      input = input || {};
      input.format = 8;
      this.fill(input);
    }
  };

  format8.prototype = new struct("cmap format 8", [
    ["format", "USHORT", "subtable format"]
  ]);

  format8.prototype.constructor = format8;

  return format8;
});

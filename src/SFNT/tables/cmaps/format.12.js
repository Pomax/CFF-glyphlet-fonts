define(["struct"], function(struct){
  "use strict";

  var format12 = function(input) {
    if(!this.parse(input)) {
      input = input || {};
      input.format = 12;
      this.fill(input);
    }
  };

  format12.prototype = new struct("cmap format 12", [
    ["format", "USHORT", "subtable format"]
  ]);

  format12.prototype.constructor = format12;

  return format12;
});

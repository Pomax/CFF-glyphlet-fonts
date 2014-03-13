define(["struct"], function(struct){
  "use strict";

  var format0 = function(input) {
    if(!this.parse(input)) {
      input = input || {};
      input.format = 0;
      this.fill(input);
    }
  };

  format0.prototype = new struct("cmap format 0", [
    ["format", "USHORT", "subtable format"]
  ]);

  return format0;
});

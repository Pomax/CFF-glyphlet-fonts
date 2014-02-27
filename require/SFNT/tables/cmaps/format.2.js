define(["struct"], function(struct){
  "use strict";

  var format2 = function(input) {
    if(!this.parse(input)) {
      input = input || {};
      input.format = 2;
      this.fill(input);
    }
  };

  format2.prototype = new struct([
    ["format", "USHORT", "subtable format"]
  ]);

  format2.prototype.constructor = format2;

  return format2;
});

define(["struct"], function(Table){

  var format12 = function(input) {
    if(!this.parse(input)) {
      input = input || {};
      input.format = 12;
      this.fill(input);
    }
  };

  format12.prototype = new Table([
    ["format", "USHORT", "subtable format"]
  ]);

  format12.prototype.constructor = format12;

  return format12;
});

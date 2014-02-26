define(["struct"], function(Table){

  var format2 = function(input) {
    if(!this.parse(input)) {
      input = input || {};
      input.format = 2;
      this.fill(input);
    }
  };

  format2.prototype = new Table([
    ["format", "USHORT", "subtable format"]
  ]);

  format2.prototype.constructor = format2;

  return format2;
});

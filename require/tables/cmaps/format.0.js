define(["../../struct"], function(Table){

  var format0 = function(input) {
    if(!this.parse(input)) {
      input = input || {};
      input.format = 0;
      this.fill(input);
    }
  };

  format0.prototype = new Table([
    ["format", "USHORT", "subtable format"]
  ]);

  format0.prototype.constructor = format0;

  return format0;
});

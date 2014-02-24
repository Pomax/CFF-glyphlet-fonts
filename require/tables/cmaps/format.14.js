define(["../../struct"], function(Table){

  var format14 = function(input) {
    if(!this.parse(input)) {
      input = input || {};
      input.format = 14;
      this.fill(input);
    }
  };

  format14.prototype = new Table([
  	["format", "USHORT", "subtable format"]
  ]);

  format14.prototype.constructor = format14;

  return format14;
});

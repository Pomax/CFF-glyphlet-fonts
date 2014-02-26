define(["struct"], function(Table){

  var format6 = function(input) {
    if(!this.parse(input)) {
      input = input || {};
      input.format = 6;
      this.fill(input);
    }
  };

  format6.prototype = new Table([
    ["format", "USHORT", "subtable format"]
  ]);

  format6.prototype.constructor = format6;

  return format6;
});

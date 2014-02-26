define(["struct", "atou"], function(Table, atou){
  "use strict";

  /**
   * Name record constructor
   */
  var StringRecord = function(input) {
    if(!this.parse(input)) {
      input = input || {};
      this.fill(input);
    }
  };

  /**
   * Name table definition
   */
  StringRecord.prototype = new Table([
    ["string", "CHARARRAY", "The string to be encoded"]
  ]);
  StringRecord.prototype.constructor = StringRecord;

  return StringRecord;
});

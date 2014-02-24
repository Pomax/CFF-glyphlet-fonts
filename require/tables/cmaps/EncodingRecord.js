define(["../../struct"], function(Table) {
  "use strict";

  var EncodingRecord = function(input) {
    if(!this.parse(input)) {
      input = input || {};
      this.fill(input);
    }
  };

  EncodingRecord.prototype = new Table([
     ["platformID", "USHORT", "Platform ID"]
   , ["encodingID", "USHORT", "Platform-specific encoding ID"]
   , ["offset",     "ULONG",  "Byte offset from beginning of table to the subtable for this encoding"]
  ]);

  return EncodingRecord;
});

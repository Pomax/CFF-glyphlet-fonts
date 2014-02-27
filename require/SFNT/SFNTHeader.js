define(["struct"], function(struct) {
  "use strict";

  return function(type) {

    var SFNTHeader = function(input) {
      if(!this.parse(input)) {
        input = input || {};
        this.fill(input);
      }
    };

    SFNTHeader.prototype = new struct([
        ["version", type === "CFF" ? "CHARARRAY" : "FIXED", "either 0x0001000 for TTF, or 'OTTO' for CFF"]
      , ["numTables",     "USHORT", "number of tables in this font"]
      , ["searchRange",   "USHORT", "(Maximum power of 2 <= numTables) x 16"]
      , ["entrySelector", "USHORT", "Log2(maximum power of 2 <= numTables)"]
      , ["rangeShift",    "USHORT", "NumTables x 16-searchRange"]
    ]);

    return SFNTHeader;
  };
})
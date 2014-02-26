define(["struct"], function(Table) {
	"use strict";

  var DirectoryEntry = function(input) {
    if(!this.parse(input)) {
      input = input || {};
      this.fill(input);
    }
  };

  DirectoryEntry.prototype = new Table([
      ["tag",      "CHARARRAY", "4-byte identifier"]
    , ["checkSum", "ULONG", "sum-as-ULONGs for this table"]
    , ["offset",   "ULONG", "offset to this table from the beginning of the file"]
    , ["length",   "ULONG", "length of the table (without padding) in bytes"]
  ]);

  return DirectoryEntry;

});

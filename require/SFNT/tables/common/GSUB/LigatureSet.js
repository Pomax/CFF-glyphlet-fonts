define(["struct", "LigatureTable"], function(struct, LigatureTable) {
  "use strict";

  var LigatureSet = function(input) {
    this.tables = [];
    if(!this.parse(input)) {
      input = input || {};
      this.LigatureCount = 0;
      this.fill(input);
    }
  };

  LigatureSet.prototype = new struct([
      ["LigatureCount",   "USHORT",  "Number of Ligature tables in this set"]
    , ["LigatureOffsets", "LITERAL", "Array of offsets to Ligature tables, from beginning of the LigatureSet table; ordered by preference"]
    , ["Ligatures",       "LITERAL", ""]
  ]);

  LigatureSet.prototype.addLigatureTable = function(options) {
    var table = new LigatureTable(options);
    this.tables.push(table);
    return table;
  }

  return LigatureSet;
});

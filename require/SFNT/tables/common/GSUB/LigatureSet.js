define(["struct", "dataBuilding", "LigatureTable"], function(struct, dataBuilder, LigatureTable) {
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
    , ["LigatureOffsets", "LITERAL", "Array of USHORT offsets to Ligature tables, from beginning of the LigatureSet; assumed ordered by preference"]
    , ["Ligatures",       "LITERAL", ""]
  ]);

  LigatureSet.prototype.addLigatureTable = function(options) {
    var table = new LigatureTable(options);
    this.tables.push(table);
    return table;
  }

  LigatureSet.prototype.finalize = function() {
    var data = [],
        offsets = [];
    this.LigatureCount = this.tables.length;
    this.tables.forEach(function(v) {
      offsets.push(data.length);
      data = data.concat(v.toData());
    });
    this.Ligatures = data;
    offsets = offsets.map(function(v) {
      return v + 2 + 2*offsets.length;
    });
    data = []
    offsets.forEach(function(v) {
      data = data.concat(dataBuilder.encoder.USHORT(v));
    });
    this.LigatureOffsets = data;
  };

  return LigatureSet;
});

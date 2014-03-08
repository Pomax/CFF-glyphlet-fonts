define(["struct", "makeStructy", "dataBuilding", "LigatureTable"], function(struct, makeStructy, dataBuilder, LigatureTable) {
  "use strict";

  var LigatureSet = function(input) {
    this.tables = [];
    if(!this.parse(input)) {
      input = input || {};
      this.LigatureCount = 0;
      this.fill(input);
    }
  };

  LigatureSet.prototype = new struct("LigatureSet", [
      ["LigatureCount",   "USHORT",  "Number of Ligature tables in this set"]
    , ["LigatureOffsets", "LITERAL", "Array of USHORT offsets to Ligature tables, from beginning of the LigatureSet; assumed ordered by preference"]
    , ["Ligatures",       "LITERAL", ""]
  ]);

  LigatureSet.prototype.addLigatureTable = function(options) {
    var table = new LigatureTable(options);
    this.tables.push(table);
    return table;
  }

  LigatureSet.prototype.finalise = function() {
    var ligatures = [],
        offsets = [];
    this.LigatureCount = this.tables.length;
    this.tables.forEach(function(v) {
      offsets.push(ligatures.length);
      v.finalise();
      ligatures.push(v);
    });
    this.Ligatures = makeStructy(ligatures);
    offsets = offsets.map(function(v) {
      return v + 2 + 2*offsets.length;
    });
    var data = []
    offsets.forEach(function(v) {
      data = data.concat(dataBuilder.encoder.USHORT(v));
    });
    this.LigatureOffsets = data;
  };

  return LigatureSet;
});

define(["struct", "makeStructy", "LookupTable", "dataBuilding"], function(struct, makeStructy, LookupTable, dataBuilder) {
  "use strict";

  var LookupList = function(input) {
    this.tables = [];
    if(!this.parse(input)) {
      input = input || {};
      this.fill(input);
    }
  };

  LookupList.prototype = new struct([
      ["LookupCount",  "USHORT",  "number of lookups in the list"]
    , ["LookupOffsets", "LITERAL", "Array of offsets to the Lookup tables, from beginning of LookupList"]
    , ["LookupTables", "LITERAL", "the list of lookups"]
  ]);

  LookupList.prototype.addLookup = function(options) {
    var table = new LookupTable(options);
    this.tables.push(table);
    return table;
  }

  LookupList.prototype.finalize = function() {
    this.LookupCount = this.tables.length;
    var lookuptables = [];
    var offsets = [];
    var offset = 0;
    this.tables.forEach(function(t,idx) {
      offsets = offsets.concat(dataBuilder.encoder.USHORT(offset));
      t.finalize(idx);
      lookuptables.push(t);
      offset += t.toData().length;
    })
    this.LookupOffsets = offsets;
    this.LookupTables = makeStructy(lookuptables);
  }

  return LookupList;

});

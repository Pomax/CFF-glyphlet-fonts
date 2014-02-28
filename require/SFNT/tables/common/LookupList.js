define(["struct", "makeStructy", "LookupTable"], function(struct, makeStructy, LookupTable) {
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
    this.tables.forEach(function(t,idx) {
      t.finalize(idx);
      lookuptables.push(t);
    })
    this.LookupTables = makeStructy(lookuptables);
  }

  return LookupList;

});

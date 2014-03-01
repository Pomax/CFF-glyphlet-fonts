define(["struct", "makeStructy", "ScriptRecord", "ScriptTable"], function(struct, makeStructy, ScriptRecord, ScriptTable) {
  "use strict";

  var ScriptList = function(input) {
    this.pairs = [];
    if(!this.parse(input)) {
      input = input || {};
      this.fill(input);
    }
  };

  ScriptList.prototype = new struct([
      ["ScriptCount",   "USHORT",  "Number of ScriptRecords"]
    , ["ScriptRecords", "LITERAL", "Array of ScriptRecords, listed alphabetically by ScriptTag"]
    , ["ScriptTables",  "LITERAL", "The ScriptTables in this script list"]
  ]);

  ScriptList.prototype.addScript = function(options) {
    var scriptRecord = new ScriptRecord({
      ScriptTag: options.ScriptTag ? options.ScriptTag : "DFLT"
    });
    delete options.ScriptTag;

    var scriptTable = new ScriptTable(options);
    this.pairs.push({
      record: scriptRecord,
      table: scriptTable,
      finalize: function(idx) {
        this.record.Offset = idx;
        this.table.finalize();
      }
    });
    return scriptTable;
  };

  var duplicateTable = function(tables, table) {
    var todata = function(v) { return v.toData(); };
    var collapse = function (arr) { return arr.map(todata).join(''); };
    var i, a, b;
    for(var i=0, last=tables.length; i<last; i++) {
      a = collapse(tables[i].langsystables);
      b = collapse(table.langsystables);
      if(a == b) return true;
    }
    return false;
  }

  ScriptList.prototype.finalize = function() {
    this.ScriptCount = this.pairs.length;
    this.pairs.sort(function(a,b) {
      return a.record.ScriptTag < b.record.ScriptTag ? -1 : 1;
    });
    var records = [],
        tables = [];
    this.pairs.forEach(function(p, idx) {
      if(duplicateTable(tables, p.table)) return;
      if(tables.indexOf(p.table) === -1) {
        p.finalize(idx);
        records.push(p.record);
        tables.push(p.table);
      }
    });
    this.ScriptRecords = makeStructy(records);
    this.ScriptTables = makeStructy(tables);
  };

  return ScriptList;

});

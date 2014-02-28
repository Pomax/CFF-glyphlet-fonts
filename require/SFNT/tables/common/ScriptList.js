define(["struct", "ScriptRecord", "ScriptTable"], function(struct, ScriptRecord, ScriptTable) {
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

  ScriptList.prototype.finalize = function() {
    this.ScriptCount = this.pairs.length;
    this.pairs.sort(function(a,b) {
      return a.record.ScriptTag < b.record.ScriptTag ? -1 : 1;
    });
    var rdata = [],
        tdata = [];
    this.pairs.forEach(function(p, idx) {
      p.finalize(idx);
      rdata = rdata.concat(p.record.toData());
      tdata = tdata.concat(p.table.toData());
    });
    this.ScriptRecords = rdata;
    this.ScriptTables = tdata;
  };

  return ScriptList;

});

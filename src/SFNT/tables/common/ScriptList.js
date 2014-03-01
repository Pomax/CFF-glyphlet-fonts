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
      finalize: function(scriptCount, offset) {
        this.table.finalize();
        this.record.Offset = 2 + scriptCount * 6 + offset;
      }
    });
    return scriptTable;
  };

  // Do we already have a table pointing to the same langsys data?
  // If we do, we don't want to encode it a second (or third etc) time.
  var alreadyReferenced = function(tables, table) {
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
    var count = this.pairs.length;
    this.ScriptCount = count;
    this.pairs.sort(function(a,b) {
      return a.record.ScriptTag < b.record.ScriptTag ? -1 : 1;
    });
    var records = [],
        tables = [],
        oldoffset = 0,
        offset = 0;
    this.pairs.forEach(function(p, idx) {
      if(alreadyReferenced(tables, p.table)) {
        p.finalize(count, oldoffset);
        records.push(p.record);
        return;
      }
      oldoffset = offset;
      p.finalize(count, offset);
      records.push(p.record);
      tables.push(p.table);
      // FIXME: use a sizeOf
      offset += p.table.toData().length;
    });
    this.ScriptRecords = makeStructy(records);
    this.ScriptTables = makeStructy(tables);
  };

  return ScriptList;

});

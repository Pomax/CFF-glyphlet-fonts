define(["struct", "ScriptRecord", "ScriptTable"], function(struct, ScriptRecord, ScriptTable) {
  "use strict";

  var ScriptList = function(input) {
    this.records = [];
    this.tables = [];
    if(!this.parse(input)) {
      input = input || {};
      input.ScriptCount = this.records.length;
      this.fill(input);
    }
  };

  ScriptList.prototype = new struct([
      ["ScriptCount",   "USHORT",  "Number of ScriptRecords"]
    , ["ScriptRecords", "LITERAL", "The ScriptRecords in this script list"]
    , ["ScriptTables",  "LITERAL", "The ScriptTables in this script list"]
  ]);

  ScriptList.prototype.addScript = function(options) {
    var scriptRecord = new ScriptRecord({
      ScriptTag: options.ScriptTag ? options.ScriptTag : "DFLT"
    });
    delete options.ScriptTag;
    this.records.push(scriptRecord);


    var scriptTable = new ScriptTable(options);
    this.tables.push(scriptTable);
    return scriptTable;
  };

  return ScriptList;

});

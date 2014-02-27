define(["struct"], function(struct) {
  "use strict";

  var ScriptList = function(input) {
    this.scripts = [];
    if(!this.parse(input)) {
      input = input || {};
      input.ScriptCount = this.scripts.length;
      this.fill(input);
    }
  };

  ScriptList.prototype = new struct([
      ["ScriptCount",   "USHORT",  "Number of ScriptRecords"]
    , ["ScriptRecords", "LITERAL", "The ScriptRecords in this script list"]
    , ["ScriptTables",  "LITERAL", "The ScriptTables in this script list"]
  ]);

  ScriptList.prototype.addScript = function() {
    // ...
  };

  return ScriptList;

});

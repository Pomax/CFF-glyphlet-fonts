define(["struct"], function(struct) {
  "use strict";

  var ScriptRecord = function(input) {
    if(!this.parse(input)) {
      input = input || {};
      input.ScriptTag = "DFLT";
      this.fill(input);
    }
  };

  ScriptRecord.prototype = new struct([
      ["ScriptTag", "CHARARRAY", "script name ('DFLT' for the default script)"]
    , ["Offset",    "OFFSET",    "Offset to the associated ScriptTable (offset from the start of the ScriptList)"]
  ]);

  return ScriptRecord;

});

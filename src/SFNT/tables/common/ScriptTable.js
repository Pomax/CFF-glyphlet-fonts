define(["struct", "makeStructy"], function(struct, makeStructy) {
  "use strict";

  var ScriptTable = function(input) {
    this.langsystables = [];
    if(!this.parse(input)) {
      input = input || {};
      input.defaultLangSys = 4;
      var langsystables = input.LangSysTables;
      delete input.LangSysTables;
      this.fill(input);
      if(langsystables) {
        this.langsystables = langsystables;
      }
    }
  };

  ScriptTable.prototype = new struct("ScriptTable", [
      ["defaultLangSys", "OFFSET",  "the langsys record to use in absence of a specific language, from start of script table"]
    , ["LangSysCount",   "USHORT",  "how many language systam tables are used?"]
    , ["LangSysTables",  "LITERAL", "the collection of LangSys objects"]
  ]);

  ScriptTable.prototype.finalise = function(lookups) {
    this.LangSysCount = this.langsystables.length - 1; // offset for DFLT
    var data = [];
    this.langsystables.forEach(function(v, idx){
      v.finalise();
      data.push(v);
    });
    this.LangSysTables = makeStructy(data);
  };

  return ScriptTable;

});

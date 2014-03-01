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

  ScriptTable.prototype = new struct([
      ["defaultLangSys", "OFFSET",  "the langsys record to use in absence of a specific language, from start of script table"]
    , ["LangSysCount",   "USHORT",  "how many language systam tables are used?"]
    , ["LangSysTables",  "LITERAL", "the collection of LangSys objects"]
  ]);

  ScriptTable.prototype.finalize = function(lookups) {
    this.LangSysCount = this.langsystables - 1; // offset for DFLT
    var langsystables = []
    this.langsystables.forEach(function(v){
      v.finalize();
      langsystables.push(v);
    });
    this.LangSysTables = makeStructy(langsystables);
  };

  return ScriptTable;

});

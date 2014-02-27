define(["struct"], function(struct) {
  "use strict";

  var ScriptTable = function(input) {
    this.tables = [];
    if(!this.parse(input)) {
      input = input || {};
      input.defaultLangSys = 4;
      var langsystables = input.LangSysTables;
      delete input.LangSysTables;
      this.fill(input);
      if(langsystables) {
        this.tables = langsystables;
        this.LangSysCount = this.tables.length;
      }
    }
  };

  ScriptTable.prototype = new struct([
      ["defaultLangSys", "OFFSET",  "the langsys record to use in absence of a specific language, from start of script table"]
    , ["LangSysCount",   "USHORT",  "how many language systam tables are used?"]
    , ["LangSysTables",  "LITERAL", "the collection of LangSys objects"]
  ]);

  return ScriptTable;

});

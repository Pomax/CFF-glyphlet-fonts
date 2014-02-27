define(["struct"], function(struct) {
  "use strict";

  var ScriptTable = function(input) {
    if(!this.parse(input) {
      input = input || {};
      input.defaultLangSys = 4;
      this.fill(input);
    }
  };

  ScriptTable.prototype = new struct([
      ["defaultLangSys", "OFFSET",  "the langsys record to use in absence of a specific language, from start of script table"]
    , ["LangSysCount",   "USHORT",  "this font is not language specific, so has no langsys records beyond default"]
    , ["LangSys",        "LITERAL", "the collection of LangSys objects"]
  ]);

  return ScriptTable;

});

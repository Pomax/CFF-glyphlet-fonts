(function setupRequireJS() {

  var paths = {};

  var extend = function(location, files) {
    files.forEach(function(filename) {
      paths[filename] = "src/" + location + "/" + filename;
    });
  };

  // Font-related filed
  extend(".",                         ["builder", "formGlobals"]);
  extend("utils",                     ["atou", "buildTables", "convertOutline", "dataBuilding", "Mapper", "shimFname", "struct", "toWOFF", "addStyleSheet", "asHex", "asChars", "asNumbers", "asGlyphIDs", "makeStructy", "addLabelSubstitution", "addMappings", "getColor"]);
  extend("SFNT",                      ["SFNT", "SFNTHeader", "DirectoryEntry", "tables"]);
  extend("SFNT/tables",               ["BASE", "CFF_", "cmap", "GDEF", "GPOS", "GSUB", "head", "hhea", "hmtx", "JSTF", "maxp", "name", "OS_2", "post"]);
  extend("SFNT/tables/common",        ["CoverageFormat", "FeatureList", "FeatureRecord", "FeatureTable", "LangSysTable", "LookupList", "LookupTable", "RangeRecord", "ScriptList", "ScriptRecord", "ScriptTable"]);
  extend("SFNT/tables/common/GSUB",   ["lookups", "LookupType4", "LigatureSet", "LigatureTable"]);
  extend("SFNT/tables/cmaps",         ["format.0", "format.2", "format.4", "format.6", "format.8", "format.10", "format.12", "format.13", "format.14", "subtables", "EncodingRecord"]);
  extend("SFNT/tables/cmaps/format4", ["Segment", "Segments"]);
  extend("SFNT/tables/hmtx",          ["LongHorMetric"]);
  extend("SFNT/tables/name",          ["NameRecord", "NameRecords", "StringRecord"]);
  extend("SFNT/tables/cff",           ["CFFHeader", "NameIndex", "TopDictIndex", "CFFDict"]);

  // Set up require.js for this project
  var config = {
    baseUrl: ".",
    paths: paths,
    shim: { "shimFname": {} }
  };
  require.config(config);

}());

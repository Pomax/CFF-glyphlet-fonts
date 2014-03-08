define(["struct", "ScriptList", "FeatureList", "LookupList", "LangSysTable"], function(struct, ScriptList, FeatureList, LookupList, LangSysTable){
  "use strict";

  var GSUB = function(input) {
    this.scripts  = new ScriptList();
    this.features = new FeatureList();
    this.lookups  = new LookupList();

    if(!this.parse(input)) {
      input = input || {};
      input.version = input.version || 0x00010000;
      input.ScriptListOffset = 10; // scriptlist starts immediately after the GSUB header
      this.fill(input);
    }
  };

  GSUB.prototype = new struct("GSUB table", [
      // GSUB header is four fields
      ["version",           "FIXED",  "Version of the GSUB table; initially set to 0x00010000"]
    , ["ScriptListOffset",  "OFFSET", "Offset to ScriptList table, from beginning of GSUB table"]
    , ["FeatureListOffset", "OFFSET", "Offset to FeatureList table, from beginning of GSUB table"]
    , ["LookupListOffset",  "OFFSET", "Offset to LookupList table, from beginning of GSUB table"]
      // and then the actual data
    , ["ScriptList",        "LITERAL", "the ScriptList object for this table"]
    , ["FeatureList",       "LITERAL", "the FeatureList object for this table"]
    , ["LookupList",        "LITERAL", "the LookupList object for this table"]
  ]);

  GSUB.prototype.constructor = GSUB;

  GSUB.prototype.addScript = function(options) {
    return this.scripts.addScript(options)
  };

  GSUB.prototype.addFeature = function(options) {
    return this.features.addFeature(options);
  };

  GSUB.prototype.addLookup = function(options) {
    return this.lookups.addLookup(options);
  };

  GSUB.prototype.makeLangSys = function(options) {
    return new LangSysTable(options);
  }

  // finalise in reverse order: first the lookup list,
  // then the feature list, then the script list.
  GSUB.prototype.finalise = function() {
    this.lookups.finalise();
    this.LookupList = this.lookups;
    this.features.finalise();
    this.FeatureList = this.features;
    this.scripts.finalise();
    this.ScriptList  = this.scripts;
    this.FeatureListOffset = this.ScriptListOffset + this.ScriptList.toData().length;
    this.LookupListOffset = this.FeatureListOffset + this.FeatureList.toData().length;
  }

  return GSUB;
});

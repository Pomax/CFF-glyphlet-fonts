define(["struct", "common", "ScriptList"], function(struct, common){
  "use strict";

  var GSUB = function(input) {
    if(!this.parse(input)) {
      input = input || {};
      input.version = input.version || 0x00010000;
      this.ScriptListOffset = 10; // scriptlist starts immediately after the GSUB header
      this.ScriptList  = new ScriptList();
      this.FeatureList = new FeatureList();
      this.LookupList  = new LookupList();
      this.fill(input);
    }
  };

  GSUB.prototype = new struct([
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

  GSUB.prototype.addScript = function() {
    this.ScriptList.addScript.call(this.ScriptList, arguments);
  };

  GSUB.prototype.addFeature = function() {
    this.FeatureList.addFeature.call(this.FeatureList, arguments);
  };

  GSUB.prototype.addLookup = function() {
    this.LookupList.addLookup.call(this.LookupList, arguments);
  };

  GSUB.prototype.finalize = function() {
    var scriptlist = [],
        featurelist = [],
        lookuplist = [];
    this.script.forEach(function() {

    });
    this.ScriptList = this.scriptlist;
  }

  return GSUB;
});

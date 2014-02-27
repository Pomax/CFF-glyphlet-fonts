define(["struct", "FeatureRecord", "FeatureTable"], function(struct, FeatureRecord, FeatureTable) {
  "use strict";

  var FeatureList = function(input) {
    this.records = [];
    this.tables = [];
    if(!this.parse(input)) {
      input = input || {};
      this.fill(input);
    }
  };

  FeatureList.prototype = new struct([
      ["FeatureCount",    "USHORT", "Number of features in this feature list"]
    , ["FeatureRecords",  "LITERAL", "Array of FeatureRecords; zero-based (first feature has FeatureIndex = 0), listed alphabetically by FeatureTag"]
    , ["FeatureTables",   "LITERAL", "the list of feature tables"]
  ]);

  FeatureList.prototype.addFeature = function(options) {
    var featureRecord = new FeatureRecord({
      FeatureTag: options.FeatureTag
    });
    delete options.FeatureTag;
    this.records.push(featureRecord);

    var featureTable = new FeatureTable(options);
    this.tables.push(featureTable);
    return featureTable;
  }

  return FeatureList
});

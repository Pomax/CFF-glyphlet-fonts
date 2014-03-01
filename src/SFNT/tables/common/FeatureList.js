define(["struct", "makeStructy", "FeatureRecord", "FeatureTable"], function(struct, makeStructy, FeatureRecord, FeatureTable) {
  "use strict";

  var FeatureList = function(input) {
    this.pairs = [];
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
    var featureTable = new FeatureTable(options);
    this.pairs.push({
      record: featureRecord,
      table: featureTable,
      finalize: function(featureCount, idx, offset) {
        this.table.finalize(idx);
        this.record.Offset = 2 + featureCount * 6 + offset;
      }
    });
    return featureTable;
  };

  FeatureList.prototype.finalize = function() {
    var count = this.pairs.length;
    this.FeatureCount = count;
    this.pairs.sort(function(a,b) {
      return a.record.FeatureTag < b.record.FeatureTag ? -1 : 1;
    });
    var records = [],
        tables = [],
        offset = 0;
    this.pairs.forEach(function(p, idx) {
      p.finalize(count, idx, offset);
      records.push(p.record);
      tables.push(p.table);
      // FIXME: use a sizeOf
      offset += p.table.toData().length;
    });
    this.FeatureRecords = makeStructy(records);
    this.FeatureTables = makeStructy(tables);
  };

  return FeatureList
});

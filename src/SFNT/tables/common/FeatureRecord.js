define(["struct"], function(struct) {
  "use strict";

  var FeatureRecord = function(input) {
    if(!this.parse(input)) {
      input = input || {};
      this.fill(input);
    }
  };

  FeatureRecord.prototype = new struct([
      ["FeatureTag", "CHARARRAY", "The feature name (4 characters)"]
    , ["Offset",     "OFFSET", "Offset to Feature table, from beginning of FeatureList"]
  ]);

  return FeatureRecord
});

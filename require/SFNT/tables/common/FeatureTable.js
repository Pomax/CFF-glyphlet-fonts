define(["struct"], function(struct) {
  "use strict";

  var FeatureTable = function(input) {
    this.lookups = [];
    if(!this.parse(input)) {
      input = input || {};
      this.lookups = input.lookups;
      delete input.lookups;
      this.fill(input);
    }
  };

  FeatureTable.prototype = new struct([
      ["FeatureParams", "PADDING2", "reserved"]
    , ["LookupCount",   "OFFSET",   "The number of lookups used in this feature"]
    , ["LookupListIndex", "LITERAL", "USHORT[lookupcount] of indices in the lookup list"]
  ]);

  return FeatureTable
});

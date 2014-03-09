define(["struct", "dataBuilding"], function(struct, dataBuilder) {
  "use strict";

  var dictionaryStructure = dataBuilder.encoder.types.map(function(record) {
    return [record, "CFF." + record, record];
  });

  var DICT = function(input) {
  	if(!this.parse(input)) {
      input = input || {};
      this.usedFields = Object.keys(input);
      this.fill(input);
      this.finalise();
  	}
  };

  DICT.prototype = new struct("CFF DICT", dictionaryStructure);

  DICT.prototype.finalise = function() {
    this.use(this.usedFields);
  }

  return DICT;
});

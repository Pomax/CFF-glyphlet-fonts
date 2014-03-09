define(["INDEX", "dataBuilding"], function(INDEX, dataBuilder) {
  "use strict";

  var encode = dataBuilder.encoder.CHARARRAY;

  var NameIndex = function(names) {
    INDEX.call(this);
    var self = this;
    names.forEach(function(name) {
      self.addItem(encode(name));
    });
  }

  NameIndex.prototype = Object.create(INDEX.prototype);

  return NameIndex;

});

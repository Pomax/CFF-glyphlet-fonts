define(["INDEX", "dataBuilding"], function(INDEX, dataBuilder) {
  "use strict";

  var encode = dataBuilder.encoder.CHARARRAY;

  var StringIndex = function(names) {
    INDEX.call(this);
    var self = this;
    names.forEach(function(name) {
      self.addItem(encode(name));
    });
    this.strings = names;
  }

  StringIndex.prototype = Object.create(INDEX.prototype);

  // there are 390 predefined strings in CFF, so custom strings
  // start at index 391, rather than index 0!
  StringIndex.prototype.getStringId = function(string) {
    return 391 + this.strings.indexOf(string);
  };

  return StringIndex;

});

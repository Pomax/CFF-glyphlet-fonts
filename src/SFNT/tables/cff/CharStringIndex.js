define(["INDEX", "dataBuilding"], function(INDEX, dataBuilder) {
  "use strict";

  var encode = dataBuilder.encoder.CHARARRAY;

  var CharStringIndex = function(letters, charString) {
    var self = this;
    INDEX.call(this);
    this.setName("CharStringIndex");
    // .notdef
    this.addItem(dataBuilder.encoder.OPERAND(14));
    // all letters except the "real" letters
    letters.forEach(function(letter, idx) {
      if(idx < letters.length - 1) {
        self.addItem(dataBuilder.encoder.OPERAND(14));
      }
    });
    // and then our true glyph
    this.addItem(charString);
    this.finalise();
  }

  CharStringIndex.prototype = Object.create(INDEX.prototype);

  return CharStringIndex;

});

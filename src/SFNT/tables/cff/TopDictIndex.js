define(["INDEX", "DICT"], function(INDEX, DICT) {
  "use strict";

  var TopDictIndex = function(input) {
    INDEX.call(this);
    var topdict = new DICT(input);
    this.addItem(topdict);
  }

  TopDictIndex.prototype = new INDEX();

  return TopDictIndex;

});

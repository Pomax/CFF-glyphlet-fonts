define(["INDEX", "DICT"], function(INDEX, DICT) {
  "use strict";

  var TopDictIndex = function(input) {
    INDEX.call(this);
    this.topdict = new DICT(input);
    this.addItem(this.topdict);
  }

  TopDictIndex.prototype = Object.create(INDEX.prototype);

  TopDictIndex.prototype.set = function(field, v) {
  	this.topdict[field] = v;
  }

  return TopDictIndex;

});

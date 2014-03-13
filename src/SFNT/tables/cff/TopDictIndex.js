define(["INDEX", "DICT"], function(INDEX, DICT) {
  "use strict";

  var TopDictIndex = function(input) {
    INDEX.call(this);
    this.setName("TopDictIndex");
    this.topdict = new DICT(input);
    this.addItem(this.topdict);
  }

  TopDictIndex.prototype = Object.create(INDEX.prototype);

  // used for setting the various offset values after all the data has been bound for the CFF table
  TopDictIndex.prototype.set = function(field, v) {
  	this.topdict[field] = v;
  }

  return TopDictIndex;

});

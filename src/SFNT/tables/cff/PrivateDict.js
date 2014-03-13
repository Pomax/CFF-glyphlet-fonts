define(["DICT"], function(DICT) {
  "use strict";

  var PrivateDict = function(input) {
  	DICT.call(this, input);
    this.setName("PrivateDict");
  }

  PrivateDict.prototype = Object.create(DICT.prototype);

  return PrivateDict;

});

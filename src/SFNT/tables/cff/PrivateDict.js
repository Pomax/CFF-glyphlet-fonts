define(["DICT"], function(DICT) {
  "use strict";

  var PrivateDict = function(input) {
    DICT.call(this, input);
  }

  PrivateDict.prototype = new DICT();

  return PrivateDict;

});

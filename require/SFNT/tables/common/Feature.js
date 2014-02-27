define(["struct"], function() {
  "use strict";

  var Feature = function(input) {
    if(!this.parse(input) {
      input = input || {};
      this.fill(input);
    }
  };

  Feature.prototype = new struct([
    // ...
  ]);

  return Feature;

});

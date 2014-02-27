define(["struct"], function() {
  "use strict";

  var Lookup = function(input) {
    if(!this.parse(input) {
      input = input || {};
      this.fill(input);
    }
  };

  Lookup.prototype = new struct([
    // ...
  ]);

  return Lookup;

});

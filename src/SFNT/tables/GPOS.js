define(["struct"], function(struct){
  "use strict";

  var GPOS = function(input) {
    if(!this.parse(input)) {
      input = input || {};
      this.fill(input);
    }
  };

  GPOS.prototype = new struct("GPOS table", [
    //...
  ]);

  return GPOS;
});

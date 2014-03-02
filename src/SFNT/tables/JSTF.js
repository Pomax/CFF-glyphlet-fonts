define(["struct"], function(struct){
  "use strict";

  var JSTF = function(input) {
    if(!this.parse(input)) {
      input = input || {};
      this.fill(input);
    }
  };

  JSTF.prototype = new struct("JSTF table", [
    //...
  ]);

  JSTF.prototype.constructor = JSTF;

  return JSTF;
});

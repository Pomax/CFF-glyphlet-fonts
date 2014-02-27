define(["struct"], function(struct){
  "use strict";

  var GDEF = function(input) {
    if(!this.parse(input)) {
      input = input || {};
      this.fill(input);
    }
  };

  GDEF.prototype = new struct([
    //...
  ]);

  GDEF.prototype.constructor = GDEF;

  return GDEF;
});

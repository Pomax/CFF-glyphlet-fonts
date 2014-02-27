define(["struct"], function(struct){
  "use strict";

  var BASE = function(input) {
    if(!this.parse(input)) {
      input = input || {};
      this.fill(input);
    }
  };

  BASE.prototype = new struct([
    //...
  ]);

  BASE.prototype.constructor = BASE;

  return BASE;
});

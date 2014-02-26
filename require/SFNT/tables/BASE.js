define(["struct", "common"], function(Table, common){
  "use strict";

  var BASE = function(input) {
    if(!this.parse(input)) {
      input = input || {};
      this.fill(input);
    }
  };

  BASE.prototype = new common();
  BASE.prototype.constructor = BASE;

  return BASE;
});

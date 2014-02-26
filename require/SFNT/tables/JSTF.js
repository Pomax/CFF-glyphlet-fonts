define(["struct", "common"], function(Table, common){
  "use strict";

  var JSTF = function(input) {
    if(!this.parse(input)) {
      input = input || {};
      this.fill(input);
    }
  };

  JSTF.prototype = new common();
  JSTF.prototype.constructor = JSTF;

  return JSTF;
});

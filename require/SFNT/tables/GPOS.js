define(["struct", "common"], function(Table, common){
  "use strict";

  var GPOS = function(input) {
    if(!this.parse(input)) {
      input = input || {};
      this.fill(input);
    }
  };

  GPOS.prototype = new common();
  GPOS.prototype.constructor = GPOS;

  return GPOS;
});

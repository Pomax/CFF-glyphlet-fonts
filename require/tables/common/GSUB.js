define(["../../struct", "./common"], function(Table, common){
  "use strict";

  var GSUB = function(input) {
    if(!this.parse(input)) {
      input = input || {};
      this.fill(input);
    }
  };

  GSUB.prototype = new common();
  GSUB.prototype.constructor = GSUB;

  return GSUB;
});

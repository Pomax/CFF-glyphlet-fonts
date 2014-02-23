define(["../struct"], function(Table){
  "use strict";

  var CFF = function(input) {
    if(!this.parse(input)) {
      input = input || {};
      this.fill(input);
    }
  };

  CFF.prototype = new Table([
    // ...def goes here...
  ]);

  CFF.prototype.constructor = CFF;

  return CFF;
});

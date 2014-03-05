define(["struct"], function(struct) {
  "use strict";

  var CFFDict = function(input) {
  	if(!this.parse(input)) {
      input = input || {};
      this.fill(input);
  	}
  };

  var CFFDict = new struct([
    // ...
  ]);

  return CFFDict;
});

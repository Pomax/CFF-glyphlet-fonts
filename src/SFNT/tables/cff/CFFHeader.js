define(["struct"], function(struct) {
  "use strict";

  var CFFHeader = function(input) {
    if(!this.parse(input)) {
      input = input || {};
      input.length = 4;
      this.fill(input);
    }
  }

  CFFHeader.prototype = new struct([
      ["major",   "Card8",   "major version"]
    , ["minor",   "Card8",   "minor version"]
    , ["length",  "Card8",   "header length in bytes"]
    , ["offSize", "OffSize", "how many bytes for an offset value?"]
  ]);

  return CFFHeader;

});

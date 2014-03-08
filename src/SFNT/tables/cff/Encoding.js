define(["struct", "dataBuilding"], function(struct, dataBuilder) {
  "use strict";

  // FIXME: technically this is only the format1 Encoding object

  var Encoding = function(input) {
    var codes = [];
    if(!this.parse(input)) {
      input = input || {};
      input.format = 0;
      var codes = input.letters.map(function(v,idx) {
        return idx+1;
      });
      input.nCodes = codes.length;
      input.codes = codes;
      this.fill(input);
    }
  };

  Encoding.prototype = new struct([
      ["format", "BYTE",    "encoding format"]
    , ["nCodes", "BYTE",    "..."]
    , ["codes",  "LITERAL", ""]
  ]);

  return Encoding;
});

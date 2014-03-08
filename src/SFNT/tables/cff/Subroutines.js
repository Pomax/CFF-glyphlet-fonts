define(["struct", "dataBuilding"], function(struct, dataBuilder) {
  "use strict";

  // FIXME: technically this is only the format1 charset object

  var Subroutines = function(stringIndex, input) {
    if(!this.parse(input)) {
      input = input || {};
      this.fill(input);
      // FIXME: TODO: implement (we don't use it atm, so it'll work the way it is now)
      this.subroutines = [];
    }
  };

  Subroutines.prototype = new struct([
    ["subroutines", "LITERAL", "actually a USHORT[]."]
  ]);

  return Subroutines;
});

define(["struct", "dataBuilding"], function(struct, dataBuilder) {
  "use strict";

  // FIXME: technically this is only the format0 charset object

  var Charset = function(stringIndex, input) {
    var glyphs = [];
    if(!this.parse(input)) {
      input = input || {};
      input.format = 0;
      input.letters = input.letters || [];
      this.fill(input);
      input.letters.forEach(function(letter) {
        var sid = stringIndex.getStringId(letter);
        var SID = dataBuilder.encoder.USHORT(sid);
        glyphs = glyphs.concat(SID);
      });
      this.glyphs = glyphs;
      this.setName("Charset");
    }
  };

  Charset.prototype = new struct("CFF charset", [
      ["format", "BYTE", ""]
    , ["glyphs", "LITERAL", "actually a USHORT[]."]
  ]);

  return Charset;
});

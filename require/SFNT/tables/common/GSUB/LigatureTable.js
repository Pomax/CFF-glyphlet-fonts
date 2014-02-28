define(["struct", "dataBuilding"], function(struct, dataBuilder) {
  "use strict";

  var LigatureTable = function(input) {
    if(!this.parse(input)) {
      input = input || {};
      input.Components = input.Components || [];
      input.CompCount = input.Components.length;
      input.Components = (function(list) {
        console.log(list);
        var data = [];
        list.forEach(function(v) {
          data.push(dataBuilder.encoder.USHORT(v));
        })
        return data;
      }(input.Components));
      this.fill(input);
    }
  };

  LigatureTable.prototype = new struct([
      ["LigGlyph",   "GlyphID",  "our target 'to show' ligature glyph"]
    , ["CompCount",  "USHORT",   "Number of components (=glyphs) involved in this ligature"]
    , ["Components", "LITERAL",  "GlyphID[compcount-1], list all the component glyphids in sequence, except for the first (which comes from the coverage table)"]
  ]);

  LigatureTable.prototype.finalize = function() {
  };

  return LigatureTable;
});

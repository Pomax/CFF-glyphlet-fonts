define(["struct"], function(struct) {
  "use strict";

  var LigatureTable = function(input) {
    this.tables = [];
    if(!this.parse(input)) {
      input = input || {};
      this.LigatureCount = 0;
      this.fill(input);
    }
  };

  LigatureTable.prototype = new struct([
      ["LigGlyph",   "GlyphID",  "our target 'to show' ligature glyph"]
    , ["CompCount",  "USHORT",   "Number of components (=glyphs) involved in this ligature"]
    , ["Components", "LITERAL",  "GlyphID[compcount-1], list all the component glyphids in sequence, except for the first (which comes from the coverage table)"]
  ]);

  return LigatureTable;
});

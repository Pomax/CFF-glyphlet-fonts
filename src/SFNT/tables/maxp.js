define(["struct"], function(struct){
  "use strict";

  var maxp = function(input) {
    if(!this.parse(input)) {
      input = input || {};
      this.fill(input);
      if(input.version === 0x00005000) {
        var keep = ["version", "numGlyphs"];
        var remove = Object.keys(this.fields).filter(function(v) {
          return keep.indexOf(v) === -1;
        });
        this.unset(remove);
      }
    }
  };

  maxp.prototype = new struct("maxp table", [
    ["version",               "FIXED",  "table version. For CFF this must be 0.5, for TTF it must be 1.0"]
  , ["numGlyphs",             "USHORT", "number of glyphs in the font"]
    // --- v0.5 only uses the previous two fields. 1.0 uses the rest as well ---
  , ["maxPoints",             "USHORT", "Maximum points in a non-composite glyph"]
  , ["maxContours",           "USHORT", "Maximum contours in a non-composite glyph"]
  , ["maxCompositePoints",    "USHORT", "Maximum points in a composite glyph"]
  , ["maxCompositeContours",  "USHORT", "Maximum contours in a composite glyph"]
  , ["maxZones",              "USHORT", "1 if instructions do not use the twilight zone (Z0), or 2 if instructions do use Z0; should be set to 2 in most cases."]
  , ["maxTwilightPoints",     "USHORT", "Maximum points used in Z0"]
  , ["maxStorage",            "USHORT", "Number of Storage Area locations"]
  , ["maxFunctionDefs",       "USHORT", "Number of FDEFs"]
  , ["maxInstructionDefs",    "USHORT", "Number of IDEFs"]
  , ["maxStackElements",      "USHORT", "Maximum stack depth (including Font and CVT programs, and glyph instructions"]
  , ["maxSizeOfInstructions", "USHORT", "Maximum byte count for glyph instructions"]
  , ["maxComponentElements",  "USHORT", "Maximum number of components referenced at “top level” for any composite glyph."]
  , ["maxComponentDepth",     "USHORT", "Maximum levels of recursion; 1 for simple components."]
  ]);

  return maxp;

});

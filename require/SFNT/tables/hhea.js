define(["struct"], function(struct){
  "use strict";

  var hhea = function(input) {
    if(!this.parse(input)) {
      input = input || {};
      input.version = input.version || 0x00010000;
      input.LineGap = input.LineGap || 0;
      input.minLeftSideBearing = input.minLeftSideBearing || 0;
      input.minRightSideBearing = input.minRightSideBearing || 0;
      input.caretSlopeRise = input.caretSlopeRise || 0;
      input.caretSlopeRun = input.caretSlopeRun || 0;
      input.caretOffset = input.caretOffset || 0;
      input.metricDataFormat = input.metricDataFormat || 0;
      this.fill(input);
    }
  };

  hhea.prototype = new struct([
    ["version",             "FIXED",     "Table version (must be 0x00010000"]
  , ["Ascender",            "FWORD",     "Typographic ascender"]
  , ["Descender",           "FWORD",     "Typographic descender"]
  , ["LineGap",             "FWORD",     "Typographic line gap"]
  , ["advanceWidthMax",     "UFWORD",    "Maximum advance width value in 'hmtx' table."]
  , ["minLeftSideBearing",  "FWORD",     "Minimum left sidebearing value in 'hmtx' table."]
  , ["minRightSideBearing", "FWORD",     "Minimum right sidebearing value; calculated as Min(aw - lsb - (xMax - xMin))."]
  , ["xMaxExtent",          "FWORD",     "Max(lsb + (xMax - xMin))"]
  , ["caretSlopeRise",      "SHORT",     "Used to calculate the slope of the cursor (rise/run); 1 for vertical."]
  , ["caretSlopeRun",       "SHORT",     "0 for vertical."]
  , ["caretOffset",         "SHORT",     "The amount by which a slanted highlight on a glyph needs to be shifted to produce the best appearance. Set to 0 for non-slanted fonts"]
  , ["_reserved1",          "PADDING2",  "reserved; must be 0"]
  , ["_reserved2",          "PADDING2",  "reserved; must be 0"]
  , ["_reserved3",          "PADDING2",  "reserved; must be 0"]
  , ["_reserved4",          "PADDING2",  "reserved; must be 0"]
  , ["metricDataFormat",    "SHORT",     "metricDataFormat, 0 for current format"]
  , ["numberOfHMetrics",    "USHORT",    "number of hMetric entries."]
  ]);

  hhea.prototype.constructor = hhea;

  return hhea;

});

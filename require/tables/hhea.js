define(["./Table"], function(Table){

  var hhea = function(dataBlock) {
    if(dataBlock) { this.parse(dataBlock); }
  };

  hhea.prototype = new Table([
    ["version",             "FIXED",  "Table version (must be 0x00010000"]
  , ["Ascender",            "FWORD",  "Typographic ascender"]
  , ["Descender",           "FWORD",  "Typographic descender"]
  , ["LineGap",             "UFWORD", "Typographic line gap"]
  , ["advanceWidthMax",     "FWORD",  "Maximum advance width value in 'hmtx' table."]
  , ["minLeftSideBearing",  "FWORD",  "Minimum left sidebearing value in 'hmtx' table."]
  , ["minRightSideBearing", "FWORD",  "Minimum right sidebearing value; calculated as Min(aw - lsb - (xMax - xMin))."]
  , ["xMaxExtent",          "FWORD",  "Max(lsb + (xMax - xMin))"]
  , ["caretSlopeRise",      "SHORT",  "Used to calculate the slope of the cursor (rise/run); 1 for vertical."]
  , ["caretSlopeRun",       "SHORT",  "0 for vertical."]
  , ["caretOffset",         "SHORT",  "The amount by which a slanted highlight on a glyph needs to be shifted to produce the best appearance. Set to 0 for non-slanted fonts"]
  , ["_reserved1",          "SHORT",  "reserved; must be 0"]
  , ["_reserved2",          "SHORT",  "reserved; must be 0"]
  , ["_reserved3",          "SHORT",  "reserved; must be 0"]
  , ["_reserved4",          "SHORT",  "reserved; must be 0"]
  , ["metricDataFormat",    "SHORT",  "metricDataFormat, 0 for current format"]
  , ["numberOfHMetrics",    "USHORT", "number of hMetric entries."]
  ]);

  hhea.prototype.constructor = hhea;

  return hhea;

});

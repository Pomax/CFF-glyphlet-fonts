define(["struct", "Segments"], function(struct, Segments){
  "use strict";

  var format4 = function(input) {
    if(!this.parse(input)) {
      input = input || {};
      input.language = 0;
      this.fill(input);
      this.build(input);
    }
  };

  format4.prototype = new struct("cmap format 4", [
    ["format",   "USHORT", "format 4 subtable"]
  , ["length",   "USHORT", "table length in bytes"]
  , ["language", "USHORT", "language"]
    // The following four values all derive from an implicitly
    // encoded value called "segCount", representing the number
    // of segments that this subtable format 4 cmap has.
    // Silly as it may seem, these values must be 100% correct,
    // and cannot, in any way, be omitted. This is a bit silly.
  , ["segCountX2",    "USHORT", "2x segment count"]
  , ["searchRange",   "USHORT", "search range: 2 * (2^floor(log2(segCount)))"]
  , ["entrySelector", "USHORT", "entry selector: log2(searchRange/2)"]
  , ["rangeShift",    "USHORT", "range shift: 2x segment count - search range"]
  , ["endCount",      "LITERAL",  "the endcounts for each segment in this subtable"]
  , ["reservedPad",   "PADDING2", "a 'reserve padding' value"]
  , ["startCount",    "LITERAL",  "the startcounts for each segment in this subtable"]
  , ["idDelta",       "LITERAL", ""]
  , ["idRangeOffset", "LITERAL", ""]
  , ["glyphIdArray",  "LITERAL", ""]
  ]);

  format4.prototype.constructor = format4;

  /**
   * Build the segment-based subtable
   */
  format4.prototype.build = function(options) {
    // first, form the basic segments
    var segments = new Segments();
    var codes = options.letters.map(function(l) { return l.charCodeAt(0); });
    codes.forEach(function(code) { segments.addSegment(code); })
    segments.finalise();

    // Now we can record the segCount administrative values
    var segCount = segments.data.length;
    this.segCountX2 = segCount * 2;
    this.searchRange = 2 * Math.pow(2, Math.floor(Math.log(segCount)/Math.log(2)));
    this.entrySelector = Math.log(this.searchRange/2)/Math.log(2);
    this.rangeShift = this.segCountX2 - this.searchRange;

    // then we can form the parallel segment data arrays
    var endCount = [],
        startCount = [],
        idDelta = [],
        idRangeOffset = [],
        glyphIdArray = [];

    segments.data.forEach(function(segment) {
      endCount = endCount.concat(segment.values["end"]);
      startCount = startCount.concat(segment.values["start"]);
      idDelta = idDelta.concat(segment.values["delta"]);
      idRangeOffset = idRangeOffset.concat(segment.values["offset"]);
      if(segment.values["glyphId"]) {
        glyphIdArray = glyphIdArray.concat(segment.values["glyphId"]);
      }
    });

    // and finally we can bind the parallel segment data arrays
    this.endCount = endCount;
    this.startCount = startCount;
    this.idDelta = idDelta;
    this.idRangeOffset = idRangeOffset;
    this.glyphIdArray = glyphIdArray;

    // set up the toString, toJSON, and toData functions.
    // FIXME: this should be necessary with properly written code.
    [endCount, startCount, idDelta, idRangeOffset, glyphIdArray].forEach(function(arr) {
      arr.toData = function() { return arr; };
      arr.toJSON = function() { return { data: arr}; };
      arr.toString = function() { return JSON.stringify(arr.toJSON(), false, 2); };
    });

    // And record the size of this subtable
    var fixed = 14 + 2,
        variable = endCount.length + startCount.length + idDelta.length + idRangeOffset.length + glyphIdArray.length;
    this.length = fixed + variable;
  };

  return format4;
});

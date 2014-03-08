define(["struct", "makeStructy", "dataBuilding", "CoverageFormat", "LigatureSet"], function(struct, makeStructy, dataBuilder, CoverageFormat, LigatureSet) {
  "use strict";

  var LookupType4 = function(input) {
    this.coveragetables = [];
    this.ligaturesets = [];
    if(!this.parse(input)) {
      input = input || {};
      input.SubstFormat = 1;
      this.fill(input);
    }
  };

  LookupType4.prototype = new struct("GSUB Lookup type 4", [
      ["SubstFormat",        "USHORT",  "lookup type 4 must be format 1"]
    , ["CoverageOffset",     "OFFSET",  "Offset to Coverage table, from beginning of Substitution table"]
    , ["LigSetCount",        "USHORT",  "Number of ligature sets"]
    , ["LigatureSetOffsets", "LITERAL", "Array of offsets to LigatureSet tables, from beginning of Substitution table; assumed ordered by Coverage Index"]
      // coverage data
    , ["CoverageTables",     "LITERAL", ""]
    , ["LigatureSetTables",  "LITERAL", ""]
  ]);

  LookupType4.prototype.addCoverage = function(options) {
    var format = options.format;
    delete options.format;
    var coverageformat = new CoverageFormat[format](options);
    this.coveragetables.push(coverageformat);
    return coverageformat;
  };

  LookupType4.prototype.addLigatureSet = function(options) {
    var ligatureset = new LigatureSet(options);
    this.ligaturesets.push(ligatureset);
    return ligatureset;
  };

  LookupType4.prototype.finalise = function() {
    this.LigSetCount = this.ligaturesets.length;
    this.CoverageOffset = 6 + 2 * this.LigSetCount;
    var coverage = [];
    this.coveragetables.forEach(function(v){
      coverage.push(v);
    });
    this.CoverageTables = makeStructy(coverage);

    var offset = this.CoverageOffset + coverage.toData().length;
    var offsets = [];

    var ligaturesets = [];
    this.ligaturesets.forEach(function(v) {
      v.finalise();
      ligaturesets.push(v);
      offsets = offsets.concat(dataBuilder.encoder.USHORT(offset));
      offset += v.toData().length;
    });
    this.LigatureSetTables = makeStructy(ligaturesets);
    this.LigatureSetOffsets = offsets;
  };

  return LookupType4;
});

define(["struct", "makeStructy", "dataBuilding", "CoverageFormat", "LigatureSet"], function(struct, makeStructy, dataBuilder, CoverageFormat, LigatureSet) {
  "use strict";

  var LookupType4 = function(input) {
    this.coverage = [];
    this.ligaturesets = [];
    if(!this.parse(input)) {
      input = input || {};
      input.SubstFormat = 1;
      this.fill(input);
    }
  };

  LookupType4.prototype = new struct([
      ["SubstFormat",        "USHORT",  "lookup type 4 must be format 1"]
    , ["Coverage",           "OFFSET",  "Offset to Coverage table, from beginning of Substitution table"]
    , ["LigSetCount",        "USHORT",  "Number of ligature sets"]
    , ["LigatureSetOffsets", "LITERAL", "Array of offsets to LigatureSet tables, from beginning of Substitution table; assumed ordered by Coverage Index"]
      // coverage data
    , ["CoverageTables",     "LITERAL", ""]
    , ["LigatureSetTables",  "LITERAL", ""]
  ]);

  LookupType4.prototype.addCoverage = function(options) {
    var format = options.format;
    delete options.format;
    var coverage = new CoverageFormat[format](options);
    this.coverage.push(coverage);
    return coverage;
  };

  LookupType4.prototype.addLigatureSet = function(options) {
    var ligatureset = new LigatureSet(options);
    this.ligaturesets.push(ligatureset);
    return ligatureset;
  };

  LookupType4.prototype.finalize = function() {
    this.LigSetCount = this.ligaturesets.length;
    this.Coverage = 6 + 2 * this.LigSetCount;
    var coverage = [];
    this.coverage.forEach(function(v){
      coverage.push(v);
    });
    this.CoverageTables = makeStructy(coverage);

    var distance = this.Coverage + coverage.length;
    var offsets = [];

    var ligaturesets = [];
    this.ligaturesets.forEach(function(v) {
      v.finalize();
      offsets.push(distance + ligaturesets.length);
      ligaturesets.push(v);
    });
    this.LigatureSetTables = makeStructy(ligaturesets);

    var data = [];
    offsets.forEach(function(v) {
      data = data.concat(dataBuilder.encoder.USHORT(v));
    });
    this.LigatureSetOffsets = data;
  };

  return LookupType4;
});

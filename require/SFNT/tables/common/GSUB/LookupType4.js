define(["struct", "CoverageFormat", "LigatureSet"], function(struct, CoverageFormat, LigatureSet) {
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
    , ["LigatureSetOffsets", "LITERAL", ""]
      // coverage data
    , ["CoverageTables",     "LITERAL", ""]
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
    // TODO: continue here
    return this;
  };

  return LookupType4;
});

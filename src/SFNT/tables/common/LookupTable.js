define(["struct", "makeStructy", "lookups", "dataBuilding"], function(struct, makeStructy, lookups, dataBuilder) {
  "use strict";

  var LookupTable = function(input) {
    this.tables = [];
    if(!this.parse(input)) {
      input = input || {};
      input.LookupFlag = input.LookupFlag || 0;
      this.fill(input);
      // check the UseMarkFilteringSet bit in the lookup flags:
      if((this.LookupFlag & 0x0010) !== 0x0010) {
        this.unset(["MarkFilteringSet"]);
      }
    }
  };

  LookupTable.prototype = new struct("LookupTable", [
      ["LookupType",       "USHORT",  "defined in the GSUB and GPOS tables"]
    , ["LookupFlag",       "USHORT",  "lookup qualifiers (see 'LookupFlag bit enumeration' in the 'Common Table Formats' docs)"]
    , ["SubTableCount",    "USHORT",  "the number of subtables (=actual lookup objects) for this lookup"]
    , ["SubtableOffsets",  "LITERAL", "Array of offsets to SubTables-from beginning of Lookup table"]
    , ["MarkFilteringSet", "USHORT",  "Index (base 0) into GDEF mark glyph sets structure. This field is only present if bit UseMarkFilteringSet of lookup flags is set."]
    , ["SubTables",        "LITERAL", "the array of subtables"]
  ]);

  LookupTable.prototype.addSubTable = function(options) {
    var subtable = new lookups[this.LookupType](options);
    this.tables.push(subtable);
    return subtable;
  }

  LookupTable.prototype.finalise = function(idx) {
    this.SubTableCount = this.tables.length;
    var subtables = [];
    var offsets = [];
    var offset = 6 + this.tables.length * 2; // USHORT offsets
    this.tables.forEach(function(v) {
      v.finalise()
      subtables.push(v);
      offsets = offsets.concat(dataBuilder.encoder.USHORT(offset));
      offset += v.toData().length;
    });
    this.SubtableOffsets = offsets;
    this.SubTables = makeStructy(subtables);
    this.lookupListIndex = idx;
  }


  return LookupTable;

});

define(["struct", "lookups"], function(struct, lookups) {
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

  LookupTable.prototype = new struct([
      ["LookupType",       "USHORT",  "defined in the GSUB and GPOS tables"]
    , ["LookupFlag",       "USHORT",  "lookup qualifiers (see 'LookupFlag bit enumeration' in the 'Common Table Formats' docs)"]
    , ["SubTableCount",    "USHORT",  "the number of subtables (=actual lookup objects) for this lookup"]
    , ["SubTables",        "LITERAL", "the array of subtables"]
    , ["MarkFilteringSet", "USHORT",  "Index (base 0) into GDEF mark glyph sets structure. This field is only present if bit UseMarkFilteringSet of lookup flags is set."]
  ]);

  LookupTable.prototype.addSubTable = function(options) {
    var subtable = new lookups[this.LookupType](options);
    this.tables.push(subtable);
    return subtable;
  }

  LookupTable.prototype.finalize = function(idx) {
    this.SubTableCount = this.tables.length;
    var data = [];
    this.tables.forEach(function(v) {
      v.finalize()
      data = data.concat(v.toData());
    });
    this.SubTables = data;
    this.lookupListIndex = idx;
  }


  return LookupTable;

});

define(["struct", "EncodingRecord", "subtables"], function(struct, EncodingRecord, subtables) {
  "use strict";

  var cmap = function(input) {
    this.tables = [];
    if(!this.parse(input)) {
      input = input || {};
      this.fill(input);
      this.numTables = 0;
    }
  };

  cmap.prototype = new struct("cmap table", [
      ["version", "USHORT", "cmap table version"]
    , ["numTables", "USHORT", "number of subtables"]
    , ["encodingRecords", "LITERAL", "array[numTables] of encoding records"]
    , ["subTables", "LITERAL", "the set of character map subtables"]
  ]);

  cmap.prototype.addTable = function(options) {
    var subtable = new subtables[options.format](options);
    this.tables.push(subtable);
    this.numTables = this.numTables + 1;
  };

  cmap.prototype.finalise = function() {
    var encodingrecords = [];
    var offset = 4 + (this.numTables * 8); // sizeOf(EncodingRecord) is 8
    for(var i=0; i<this.numTables; i++) {
      encodingrecords.push(new EncodingRecord({
        platformID: 3,   // Windows
        encodingID: 1,   // Unicode BMP (UCS-2)
        offset: offset
      }));
      offset += this.tables[i].length;
    }
    this.subTables = this.tables;
    this.encodingRecords = encodingrecords;
  };

  return cmap;
});

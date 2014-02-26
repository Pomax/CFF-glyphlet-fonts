define(["struct", "EncodingRecord", "subtables"], function(Table, EncodingRecord, subtables){
  "use strict";

  var cmap = function(input) {
    this.tables = [];

    this.tables.toJSON = function() {
      return this.map(function(r) { return r.toJSON(); });
    };
    this.tables.toData = function() {
      var data = [];
      this.forEach(function(r) { data = data.concat(r.toData()); });
      return data;
    };

    if(!this.parse(input)) {
      input = input || {};
      this.fill(input);
      this.numTables = 0;
    }
  };

  cmap.prototype = new Table([
      ["version", "USHORT", "cmap table version"]
    , ["numTables", "USHORT", "number of subtables"]
    , ["encodingRecords", "LITERAL", "array[numTables] of encoding records"]
    , ["subTables", "LITERAL", "the set of character map subtables"]
  ]);

  cmap.prototype.constructor = cmap;

  cmap.prototype.addTable = function(options) {
    var subtable = new subtables[options.format](options);
    this.tables.push(subtable);
    this.numTables = this.numTables + 1;
  };

  cmap.prototype.finalise = function() {

    var encodingrecords = (function(encodingrecords) {
      encodingrecords.toJSON = function() {
        return this.map(function(r) { return r.toJSON(); });
      };
      encodingrecords.toString = function() {
        return JSON.stringify(this.toJSON(), false, 2);
      }
      encodingrecords.toData = function() {
        var data = [];
        this.forEach(function(r) {
          data = data.concat(r.toData());
        });
        return data;
      };
      return encodingrecords;
    }([]));

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

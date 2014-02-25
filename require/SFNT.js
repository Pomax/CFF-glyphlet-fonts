define(["dataBuilding", "tables", "./SFNTHeader", "./DirectoryEntry"], function(dataBuilding, tables, SFNTHeader, DirectoryEntry) {
  "use strict";

  var header = SFNTHeader("CFF");

  var SFNT = function(type) {
    this.stub = {
      BASE:   tables.BASE,
      "CFF ": tables.CFF,
      GDEF:   tables.GDEF,
      GPOS:   tables.GPOS,
      GSUB:   tables.GSUB,
      JSTF:   tables.JSTF,
      "OS/2": tables.OS_2,
      cmap:   tables.cmap,
      head:   tables.head,
      hhea:   tables.hhea,
      hmtx:   tables.hmtx,
      maxp:   tables.maxp,
      name:   tables.name,
      post:   tables.post
    };
    this.header = new header();
  };

  SFNT.prototype = {
    use: function(tags) {
      var self = this,
          keys = Object.keys(this.stub),
          remove = keys.filter(function(v) { return tags.indexOf(v) === -1; });
      remove.forEach(function(tag) { delete self.stub[tag]; });
    },
    toJSON: function() {
      var self = this,
          obj = {};
      Object.keys(this.stub).forEach(function(tag) {
        if(self.stub[tag].toJSON) {
          obj[tag] = self.stub[tag].toJSON();
        }
      });
      return obj;
    },
    toData: function() {
      var self = this,
          tags = {},
          dataBlocks = {};

      // form data blocks and table directory
      Object.keys(this.stub).forEach(function(tag) {
        if(self.stub[tag].toData) {
          var tagStruct = new DirectoryEntry();
          tags[tag] = tagStruct;
          tagStruct.tag = tag;
          dataBlocks[tag] = self.stub[tag].toData();
          tagStruct.length = dataBlocks[tag].length;
          while(dataBlocks[tag].length % 4 !== 0) { dataBlocks[tag].push(0); }
          tagStruct.checkSum = dataBuilding.computeChecksum(dataBlocks[tag]);
          // offset is computed when we actually fix the block locations in the file
        }
      });

      // fill in the header values that are based on the number of tables
      var log2 = function(v) { return (Math.log(v) / Math.log(2)) | 0; }
      var header = this.header;
      header.version = "OTTO";
      header.numTables = Object.keys(tags).length;
      var maxPower2 = log2(header.numTables);
      header.searchRange = 16 * maxPower2;
      header.entrySelector = log2(maxPower2);
      header.rangeShift = header.numTables * 16 - header.searchRange;
      var headerBlock = header.toData();

      // optimise table data block ordering
      var sorted = Object.keys(tags).sort();
      var offsets = {};
      var dataBlock = [];
      var preferred = (function getOptimizedTableOrder(sorted) {
        var preferred = ["head", "hhea", "maxp", "OS/2", "name", "cmap", "post", "CFF "],
            filtered = sorted.filter(function(v) {
              return preferred.indexOf(v) === -1;
            }),
            keys = preferred.concat(filtered);
        return keys;
      }(sorted));
      var offset = headerBlock.length + header.numTables * 16;
      preferred.forEach(function(tag) {
        if(dataBlocks[tag]) {
          offsets[tag] = offset + dataBlock.length;
          dataBlock = dataBlock.concat(dataBlocks[tag]);
        }
      });

      // finalise and write out the directory block
      var directoryBlock = [];
      sorted.forEach(function(tag) {
        if(tags[tag]) {
          tags[tag].offset = offsets[tag];
          directoryBlock = directoryBlock.concat(tags[tag].toData());
        }
      })

      // assemble the final font data into one "file"
      return headerBlock.concat(directoryBlock).concat(dataBlock);
    }
  };

  return SFNT;
});

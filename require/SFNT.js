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

      var header = this.header;
      header.version = "OTTO";

      // fill in the header values that are based on the number of tables
      var log2 = function(v) { return (Math.log(v) / Math.log(2)) | 0; }
      var numTables = Object.keys(tags).length;
      header.numTables = numTables;
      var highestPowerOf2 = Math.pow(2, log2(numTables));
      var searchRange = 16 * highestPowerOf2;
      header.searchRange = searchRange;
      header.entrySelector = log2(highestPowerOf2);
      header.rangeShift = numTables * 16 - searchRange;
      var headerBlock = header.toData();

      // optimise table data block ordering, based on the
      // "Optimized Table Ordering" section on
      // http://www.microsoft.com/typography/otspec140/recom.htm
      var sorted = Object.keys(tags).sort(),
          offsets = {},
          block_offset = headerBlock.length + header.numTables * 16,
          dataBlock = [],
          preferred = (function getOptimizedTableOrder(sorted) {
            var preferred = ["head", "hhea", "maxp", "OS/2", "name", "cmap", "post", "CFF "],
                filtered = sorted.filter(function(v) {
                  return preferred.indexOf(v) === -1;
                }),
                keys = preferred.concat(filtered);
            return keys;
          }(sorted));

      preferred.forEach(function(tag) {
        if(dataBlocks[tag]) {
          offsets[tag] = block_offset + dataBlock.length;
          dataBlock = dataBlock.concat(dataBlocks[tag]);
        }
      });

      // Then, finalise and write out the directory block:
      var directoryBlock = [];
      sorted.forEach(function(tag) {
        if(tags[tag]) {
          tags[tag].offset = offsets[tag];
          directoryBlock = directoryBlock.concat(tags[tag].toData());
        }
      })

      // And then assemble the final font data into one "file",
      // making sure the checkSumAdjustment value in the <head>
      // table is based on the final serialized font data.
      var font = headerBlock.concat(directoryBlock).concat(dataBlock);
      var checksum = dataBuilding.computeChecksum(font);
      return font.slice(0, offsets["head"] + 8)
                 .concat(dataBuilding.encoder.ULONG(0xB1B0AFBA - checksum))
                 .concat(font.slice(offsets["head"] + 12));
    }
  };

  return SFNT;
});

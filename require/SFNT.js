define(["dataBuilding", "tables", "./tables/name/StringRecord"], function(dataBuilding, tables, StringRecord) {
  "use strict";

  var SFNT = function() {
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
          dataBlocks = {};
      Object.keys(this.stub).forEach(function(tag) {
        if(self.stub[tag].toData) {
          dataBlocks[tag] = self.stub[tag].toData();
        }
      });

      // form table directory

      // optimise table data blocks

      // update the head.checksum

      var data = [];
      Object.keys(dataBlocks).forEach(function(tag) {
        data = data.concat(dataBlocks[tag]);
      })
      return data;
    }
  };

  return SFNT;
});

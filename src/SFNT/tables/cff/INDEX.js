define(["struct", "dataBuilding"], function(struct, dataBuilder) {
  "use strict";

  var INDEX = function(input) {
    this.items = [];
    if(!this.parse(input)) {
      input = input || {};
      input.count = 0;
      this.fill(input);
    }
  }

  INDEX.prototype = new struct("CFF INDEX", [
      ["count",   "Card16",  "number of stored items"]
    , ["offSize", "OffSize", "how many bytes do offset values use in this index"]
    , ["offset",  "LITERAL", "depending on offSize, this is actually BYTE[], USHORT[], UINT24[] or ULONG[]. Note that offsets are relative to the byte *before* the data block, so the first offset is (almost always) 1, not 0."]
    , ["data",    "LITERAL", "the data block for this index"]
  ]);

  INDEX.prototype.addItem = function(item) {
    this.items.push(item);
    this.count++;
    this.finalise();
  };

  INDEX.prototype.toJSON = function() {
    if(this.count === 0) {
      return { count: 0 };
    }
    return struct.prototype.toJSON.call(this);
  };

  INDEX.prototype.toData = function(offset, mapper) {
    if(this.count === 0) {
      return [0,0];
    }
    return struct.prototype.toData.call(this, offset, mapper);
  };

  INDEX.prototype.sizeOf = function(fieldName) {
    if(this.count === 0) {
      return 2;
    }
    return struct.prototype.sizeOf.call(this, fieldName);
  };

  INDEX.prototype.finalise = function() {
    var self = this;

    if(this.count === 0) {
      return;
    }

    var data = [];
    this.items.forEach(function(item) {
      if (item.toData) {
        data = data.concat(item.toData());
      }
      else if(item instanceof Array) {
        data = data.concat(item);
      }
      else {
        data.push(item);
      }
    });
    this.data = data;
    var len = Math.max(1, data.length);

    var offSize = (1 + Math.floor(Math.log(len)/Math.log(2)) / 8) | 0,
        encode = dataBuilder.encoder.OffsetX[offSize],
        offset = 1,
        offsets = [],
        val = false;

    this.offSize = offSize;
    this.items.forEach(function(v) {
      val = encode(offset);
      offset += (v.toData ? v.toData() : v).length;
      offsets = offsets.concat(val);
    });
    offsets = offsets.concat(encode(offset));
    this.offset = offsets;
  };

  return INDEX;

});

define(["struct", "dataBuilding"], function(struct, dataBuilder) {
  "use strict";

  var NameIndex = function(input) {
    var self = this;
    this.strings = [];
  	if(!this.parse(input)) {
  		input = input || {};
      var strings = input.strings || [];
      delete input.strings;
  		this.fill(input);
      strings.forEach(function(s) {
        self.addString(s);
      });
  	}
  }

  // fun fact: the postscriptName must be at least 10 characters long before Firefox accepts the font
  NameIndex.prototype = new struct([
      ["count",   "Card16",    "number of stored names (We only have one)"]
    , ["offSize", "OffSize",   "offsets use 1 byte"]
    , ["offset",  "LITERAL",   "this is actually BYTE[], USHORT[], UINT24[] or ULONG[], depending on offSize"]
    , ["data",    "CHARARRAY", "we only include one name, namely the compact font name"]
  ]);

  NameIndex.prototype.addString = function(str) {
    this.strings.push(str);
    this.finalize();
  };

  NameIndex.prototype.finalize = function() {
    var self = this,
        count = this.strings.length,
        offSize = 1 + Math.ceil(Math.log(count)/Math.log(2)),
        encode = dataBuilder.encoder.OffsetX[offSize],
        // offsets are relative to the byte *before* the data block,
        // so the first offset is (almost always) 1, not 0.
        offset = 1,
        val = false;
    this.count = count;
    this.offSize = offSize;
    this.offset = [];
    this.strings.map(function(v) {
      val = encode(offset);
      offset += v.length;
      self.offset = self.offset.concat(val);
    });
    self.offset = self.offset.concat(encode(offset));
    this.data = this.strings.join('');
  };


  return NameIndex;

});

define(["makeStructy", "NameRecord", "StringRecord"], function(makeStructy, NameRecord, StringRecord) {
  "use strict";

  var NameRecords = function() {
    var self = this;
    self.records = makeStructy([]);
    self.strings = makeStructy([]);
    self.strings.toJSON = function() {
      return this.map(function(r) {
        return r.values["string"].map(function(i) {
          return String.fromCharCode(i);
        }).join('');
     });
    };
    this.offset = 0;
  };

  NameRecords.prototype = {
    addRecord: function(recordID, string, platform, encoding, language) {
      var len = string.length;
      var record = new NameRecord({
        platform: platform,
        encoding: encoding,
        language: language,
        recordID: recordID,
        length: len,
        offset: this.offset
      });
      this.records.push(record);
      this.strings.push(new StringRecord({ string: string }));
      this.offset += len;
    },
    // ensure the namerecords are sorted by platform,
    // and that the offsets are corrected for the size of
    // the namerecords in front of the string heap.
    finalise: function() {
      this.records.sort(function(a,b) {
        var diff = a.platform - b.platform;
        if(diff !== 0) return diff;
        return a.recordID - b.recordID;
      });
    }
  };

  return NameRecords;
});

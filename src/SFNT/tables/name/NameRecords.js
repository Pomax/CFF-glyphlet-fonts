define(["struct", "NameRecord", "StringRecord"], function(struct, NameRecord, StringRecord) {
  "use strict";

  var NameRecords = function(input) {
    this.records = [];
    this.strings = [];
    this.offset = 0;

    this.strings.toJSON = function() {
      return this.map(function(r) {
        return r.values["string"].map(function(i) {
          return String.fromCharCode(i);
        }).join('');
     });
    };

    if(!this.parse(input)) {
      input = input || {};
      this.fill(input);
    }
  };

  NameRecords.prototype = new struct("NameRecords", [
      ["Name Records", "LITERAL", "The list of name records for this font."]
    , ["Strings",      "LITERAL", "The strings used by the preceding name records."]
  ]);

  NameRecords.prototype.addRecord = function(recordID, string, platform, encoding, language) {
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
  };

  // ensure the namerecords are sorted by platform,
  // and that the offsets are corrected for the size of
  // the namerecords in front of the string heap.
  NameRecords.prototype.finalise = function() {
    this.records.sort(function(a,b) {
      var diff = a.platform - b.platform;
      if(diff !== 0) return diff;
      return a.recordID - b.recordID;
    });
    this["Name Records"] = this.records;
    this["Strings"] = this.strings;
  };

  return NameRecords;
});

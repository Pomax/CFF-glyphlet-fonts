define(["./NameRecord", "./StringRecord"], function(NameRecord, StringRecord) {
  "use strict";

  var NameRecords = function() {
    var self = this;

    // FIXME: this should be necessary with properly written code.
    (function(records) {
      records.toJSON = function() {
        return this.map(function(r) { return r.toJSON(); });
      };
      records.toData = function() {
        var data = [];
        this.forEach(function(r) { data = data.concat(r.toData()); });
        return data;
      };
      records.toString = function() {
        return JSON.stringify(this.toJSON(), false, 2);
      }
      self.records = records;
    }([]));

    // FIXME: this should be necessary with properly written code.
    (function(strings) {
      strings.toJSON = function() {
        return this.map(function(r) { return r.values["string"].map(function(i) { return String.fromCharCode(i); }).join(''); });
      };
      strings.toData = function() {
        var data = [];
        this.forEach(function(r) { data = data.concat(r.values["string"]); });
        return data;
      };
      strings.toString = function() {
        return JSON.stringify(this.toJSON(), false, 2);
      }
      self.strings = strings;
    }([]))

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

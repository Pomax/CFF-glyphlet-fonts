define(["./NameRecord", "./StringRecord"], function(NameRecord, StringRecord) {
  "use strict";

  var NameRecords = function() {
    var self = this;

    (function(records) {
      records.toJSON = function() {
        return this.map(function(r) { return r.toJSON(); });
      };
      records.toString = function() {
        return JSON.stringify(this.toJSON(), false, 2);
      }
      self.records = records;
    }([]));

    (function(strings) {
      strings.toJSON = function() {
        return this.map(function(r) { return r.values["string"].map(function(i) { return String.fromCharCode(i); }).join(''); });
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
      this.records.push(new NameRecord({
        platform: platform,
        encoding: encoding,
        language: language,
        recordID: recordID,
        length: len,
        offset: this.offset
      }));
      this.strings.push(new StringRecord({ string: string }));
      this.offset += len;
    }
  };

  return NameRecords;
});

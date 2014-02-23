define(["../../struct"], function(Table){
  "use strict";

  /**
   * Name record constructor
   */
  var NameRecord = function(input) {
    if(!this.parse(input)) {
      input = input || {};
      this.fill(input);
    }
  };

  /**
   * Name table definition
   */
  NameRecord.prototype = new Table([
      ["platform", "USHORT", "which platform?"]
    , ["encoding", "USHORT", "which platform-specific encoding?"]
    , ["language", "USHORT", "which platform-specific language"]
    , ["recordID", "USHORT", "See the 'Name IDs' section on http://www.microsoft.com/typography/otspec/name.htm for details"]
    , ["length",   "USHORT", "the length of this string"]
    , ["offset",   "USHORT", "offset for this string in the string heap"]
  ]);
  NameRecord.prototype.constructor = NameRecord;

  /**
   * first half of a name record, encoding {platform, encoding, language} triplet
   */
  NameRecord.prototype.setPEL = function(platform, encoding, language) {
    this.platform = platform;
    this.encoding = encoding;
    this.language = language;
  };

  /**
   * second half of a name record, encoding {recordID, length, offset} triplet
   */
  NameRecord.prototype.setRLO = function(recordID, length, offset) {
    this.recordID = recordID;
    this.length = length;
    this.offset = offset;
  };


  return NameRecord
});

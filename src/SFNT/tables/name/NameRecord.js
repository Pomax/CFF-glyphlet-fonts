define(["struct"], function(struct){
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
  NameRecord.prototype = new struct("NameRecord", [
      ["platform", "USHORT", "which platform?"]
    , ["encoding", "USHORT", "which platform-specific encoding?"]
    , ["language", "USHORT", "which platform-specific language"]
    , ["recordID", "USHORT", "See the 'Name IDs' section on http://www.microsoft.com/typography/otspec/name.htm for details"]
    , ["length",   "USHORT", "the length of this string"]
    , ["offset",   "USHORT", "offset for this string in the string heap"]
  ]);

  return NameRecord
});

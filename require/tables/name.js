/**
 * Name table
 */

// TEST: mac encoding 32 (uninterpreted) instead of 0 (Roman).
// TEST: no mac strings
// TEST: no windows strings
// TODO: make the headers controllable

define(["./Table.js", "atou"], function(Table, atou) {

  var macHeader = [
        ["platform", Table.USHORT, "macintosh", 1]
      , ["encoding", Table.USHORT, "roman", 0]
      , ["language", Table.USHORT, "english (a bit nonsense if we're uninterpreted)", 0]];

  var winHeader = [
        ["platform", Table.USHORT, "windows", 3]
      , ["encoding", Table.USHORT, "Unicode BMP (UCS-2)", 1]
      , ["language", Table.USHORT, "US english (a bit nonsense if we're doing unicode)", 0x0409]];

  var buildDataStructure = function(strings) {
    var offset = 0,
        macRecords = [],
        winRecords = [],
        nameRecordPartial = [],
        stringHeap = [];

    Object.keys(strings).forEach(function(key) {
      var string = strings[key];
      var recordId = parseInt(key, 10);

      // mac string
      nameRecordPartial = [
          ["recordID", Table.USHORT, "See the 'Name IDs' section on http://www.microsoft.com/typography/otspec/name.htm for details", recordId]
        , ["length",   Table.USHORT, "the length of this string", string.length]
        , ["offset",   Table.USHORT, "offset for this string in the string heap", offset]
      ];
      macRecords.push(macHeader.concat(nameRecordPartial));
      stringHeap.push(["(ascii)", Table.CHARARRAY, "mac version of "+string, string]);
      offset += string.length;

      // windows string
      var ustring = atou(string);
      nameRecordPartial = [
          ["recordID", Table.USHORT, "See the 'Name IDs' section on http://www.microsoft.com/typography/otspec/name.htm for details", recordId]
        , ["length",   Table.USHORT, "the length of this string", ustring.length]
        , ["offset",   Table.USHORT, "offset for this string in the string heap", offset]
      ];
      winRecords.push(winHeader.concat(nameRecordPartial));
      stringHeap.push(["(utf16)", Table.CHARARRAY, "windows version of "+string, ustring]);
      offset += ustring.length;
    });

    return {
      nameRecords: macRecords.concat(winRecords),
      nameRecordLength: offset,
      nameStrings: stringHeap
    };
  }

  /**
   * Name table constructor
   */
  var name = function(dataBlock) {
    this.strings = {};
    if(!dataBlock) { this.format = 0; }
    else { this.parse(dataBlock); }
  };

  /**
   * Name table definition
   */
  name.prototype = new Table([
    ["format",       "USHORT",  "<name> table format"]
  , ["count",        "USHORT",  "Number of name records in this table"]
  , ["stringOffset", "OFFSET",  "offset to the string data, relative to the table start"]
  , ["NameRecords",   "LITERAL", "The name record metadata"]
  , ["StringData",   "LITERAL", "The actual strings that describe this font"]
  ]);

  name.prototype.constructor = name;

  name.prototype.set = function(id, string) {
    if(string !== undefined) { this.strings[""+id] = string; }
    else { delete this.strings[""+id]; }
  };

  name.prototype.finalise = function() {
    this.count = Object.keys(this.strings).length;
    var data = buildDataStructure(this.strings);
    this.stringOffset = this.offset("NameRecords") + data.nameRecordLength;
    this.NameRecords = data.nameRecords;
    this.StringData = data.nameStrings;
  };

  return name;
})
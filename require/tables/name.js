/**
 * Name table
 */

// TEST: mac encoding 32 (uninterpreted) instead of 0 (Roman).
// TEST: no mac strings
// TEST: no windows strings
// TODO: make the headers controllable

define(["./Table.js", "atou"], function(Table, atou) {

  var NameRecord_PEL = function(platform, encoding, language, desc) {
    return [
      ["platform", Table.USHORT, desc.platform, platform]
    , ["encoding", Table.USHORT, desc.encoding, encoding]
    , ["language", Table.USHORT, desc.language, language]
    ];
  };

  var NameRecord_RLO = function(recordID, length, offset) {
    return [
        ["recordID", Table.USHORT, "See the 'Name IDs' section on http://www.microsoft.com/typography/otspec/name.htm for details", recordID]
      , ["length",   Table.USHORT, "the length of this string", length]
      , ["offset",   Table.USHORT, "offset for this string in the string heap", offset]
    ];
  };

  var macHeader = NameRecord_PEL(1, 0, 0, {
    platform: "macintosh",
    encoding: "roman",
    language: "english (a bit nonsense, really"
  });

  var winHeader = NameRecord_PEL(3, 1, 0x0409, {
    platform: "windows",
    encoding: "Unicode BMP (UCS-2)",
    language: "US english (pure nonsense if we're doing unicode)"
  });

  var buildDataStructure = function(strings) {
    var offset = 0,
        macRecords = [],
        winRecords = [],
        nameRecordPartial = [],
        stringHeap = [];

    Object.keys(strings).forEach(function(key) {
      var string = strings[key];
      var recordID = parseInt(key, 10);
      // mac string
      nameRecordPartial = NameRecord_RLO(recordID, string.length, offset);
      macRecords.push(macHeader.concat(nameRecordPartial));
      stringHeap.push(["(ascii)", Table.CHARARRAY, "mac version of "+string, string]);
      offset += string.length;
      // windows string
      var ustring = atou(string);
      nameRecordPartial = NameRecord_RLO(recordID, ustring.length, offset);
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
  , ["NameRecords",  "LITERAL", "The name record metadata"]
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
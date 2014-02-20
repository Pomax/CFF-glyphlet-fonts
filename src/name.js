/**
 * Name table
 */
// TEST: mac encoding 32 (uninterpreted) instead of 0 (Roman).
// TEST: no mac strings
// TEST: no windows strings
define("name", function() {
	var atou = function(s) {
		var n = String.fromCharCode(0);
		return s.split('').map(function(v) { return n+v; }).join('');
	}

  // TODO: make the headers controllable
  var macHeader = [
        ["platform", USHORT, "macintosh", 1]
      , ["encoding", USHORT, "roman", 0]
      , ["language", USHORT, "english (a bit nonsense if we're uninterpreted)", 0]];

  var winHeader = [
        ["platform", USHORT, "windows", 3]
      , ["encoding", USHORT, "Unicode BMP (UCS-2)", 1]
      , ["language", USHORT, "US english (a bit nonsense if we're doing unicode)", 0x0409]];

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
          ["recordID", USHORT, "See the 'Name IDs' section on http://www.microsoft.com/typography/otspec/name.htm for details", recordId]
        , ["length", USHORT, "the length of this string", string.length]
        , ["offset", USHORT, "offset for this string in the string heap", offset]
      ];
      macRecords.push(macHeader.concat(nameRecordPartial));
      stringHeap.push(["(ascii)", CHARARRAY, "mac version of "+string, string]);
      offset += string.length;

      // windows string
      var ustring = atou(string);
      nameRecordPartial = [
          ["recordID", USHORT, "See the 'Name IDs' section on http://www.microsoft.com/typography/otspec/name.htm for details", recordId]
        , ["length", USHORT, "the length of this string", ustring.length]
        , ["offset", USHORT, "offset for this string in the string heap", offset]
      ];
      winRecords.push(winHeader.concat(nameRecordPartial));
      stringHeap.push(["(utf16)", CHARARRAY, "windows version of "+string, ustring]);
      offset += ustring.length;
    });

    return {
    	nameRecords: macRecords.concat(winRecords),
    	nameRecordLength: offset,
    	nameStrings: stringHeap
    };
  }

  var name = function() {
  	this.strings = {};
  };

  name.prototype = new Table();

  name.prootype.setString = function(id, string) {
  	this.string[""+id] = string;
  };

  name.prototype.removeString = function(id, string) {
  	delete this.string[""+id];
  };

  name.prototype.toDataStructure = function() {
  	var data = buildDataStructures(this.strings);
  	this.struct = [
        ["format", USHORT, "format 0", 0]
      , ["count", USHORT, "number of name records", this.strings.length]
      , ["stringOffset", USHORT, "offset for the string data, relative to the table start", 6 + data.nameRecordLength],
      , ["NameRecord", data.nameRecords]
      , ["stringData", data.nameStrings]
    ];
    return struct;
  };

  return name;
})
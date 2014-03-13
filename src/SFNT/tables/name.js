/**
 * Name table
 */

// TEST: mac encoding 32 (uninterpreted) instead of 0 (Roman).
// TEST: no mac strings
// TEST: no windows strings
// TODO: make the headers controllable
define(["struct", "atou", "dataBuilding", "NameRecords"], function(struct, atou, databuilder, NameRecords) {
  "use strict";

  /**
   * Name table constructor
   */
  var name = function(input) {
    this.strings = {};
    if(!this.parse(input)) {
      input = input || {};
      input.format = input.format || 0;
      this.fill(input);
      this.setStrings(input);
    }
  };

  /**
   * Name table definition
   */
  name.prototype = new struct("name table", [
    ["format",       "USHORT", "<name> table format"]
  , ["count",        "USHORT", "Number of name records in this table"]
  , ["stringOffset", "OFFSET", "offset to the string data, relative to the table start"]
  , ["NameRecords",  "LITERAL", "The name record metadata"]
  , ["StringData",   "LITERAL", "The actual strings that describe this font"]
  ]);

  /**
   * Turn an array of strings into a table structure that
   * can be serialized to byte code.
   */
  name.prototype.buildDataStructure = function(strings) {
    var nameRecords = new NameRecords();
    var strings = this.strings,
        string,
        ustring,
        recordID;
    Object.keys(strings).forEach(function(key) {
      recordID = parseInt(key, 10);
      // store for {macintosh / roman / english}
      string = strings[key];
      nameRecords.addRecord(recordID,  string, 1, 0, 0);
      // store for {windows / Unicode BMP (UCS-2) / US English}
      ustring = atou(string);
      nameRecords.addRecord(recordID, ustring, 3, 1, 0x0409);
    });
    nameRecords.finalise();
    return {
      nameRecords: nameRecords.records,
      nameRecordLength: nameRecords.offset,
      nameStrings: nameRecords.strings
    };
  };

  /**
   * add a string to the collection of strings, or
   * remove one by omitting its [string] parameter.
   */
  name.prototype.set = function(id, string) {
    if(string !== undefined) { this.strings[""+id] = string; }
    else { delete this.strings[""+id]; }
  };

  /**
   * Set all strings based on the globals object
   */
  name.prototype.setStrings = function(globals) {
    this.set(1, globals.fontFamily);
    this.set(2, globals.subFamily);
    if(!globals.minimal) {
      if(globals.copyright      !== undefined)  this.set( 0, globals.copyright);
      if(globals.identifier     !== undefined)  this.set( 3, globals.identifier);
      if(globals.fontName       !== undefined)  this.set( 4, globals.fontName);
      if(globals.fontVersion    !== undefined)  this.set( 5, globals.fontVersion);
      if(globals.postscriptName !== undefined)  this.set( 6, globals.postscriptName);
      if(globals.trademark      !== undefined)  this.set( 7, globals.trademark);
      if(globals.license        !== undefined)  this.set(13, globals.license);
      // NameID 19 is for the "preview text" in font preview utilities. Since we're
      // only implementing a single glyph, that's the entire preview string.
      this.set(19, "~");
    }
    this.finalise();
  }

  /**
   * convert the current string collection
   * into a name table structure.
   */
  name.prototype.finalise = function() {
    var data = this.buildDataStructure();
    this.count = data.nameRecords.length;
    this.NameRecords = data.nameRecords;
    this.StringData = data.nameStrings;
    this.stringOffset = this.offset("StringData");
  };

  return name;
})
define(["struct", "dataBuilding"], function(Table, dataBuilder) {

  /**
   * repackage an SFNT block as WOFF
   */
  return function formWOFF(font) {
    var data = font.toData();
    var numTables = font.header.numTables;

    var wOFFheader = function(input) {
      if(!this.parse(input)) {
        input = input || {};
        input.signature = "wOFF";
        input.majorVersion = 1;
        input.minorVersion = 0;
        input.metaOffset = 0;
        input.metaLength = 0;
        input.metaOrigLength = 0;
        input.privOffset = 0;
        input.privLength = 0;
        this.fill(input);
      }
    };

    wOFFheader.prototype = new Table([
        ["signature",      "CHARARRAY", "this has to be the string 'wOFF'..."]
      , ["flavour",        "CHARARRAY", "The sfnt version of the wrapped font"]
      , ["length",         "ULONG",     "Total size of the WOFF file (placeholder, we compute this later)."]
      , ["numTables",      "USHORT",    "Number of entries in the directory of font tables."]
      , ["reserved",       "PADDING2",  "this must be set to zero"]
      , ["totalSfntSize",  "ULONG",     "Total size needed for the uncompressed original font"]
      , ["majorVersion",   "USHORT",    "Major version of the WOFF file (1 in this case)."]
      , ["minorVersion",   "USHORT",    "Minor version of the WOFF file (0 in this case)."]
      , ["metaOffset",     "ULONG",     "Offset to metadata block, from beginning of WOFF file. We don't use one"]
      , ["metaLength",     "ULONG",     "Length of compressed metadata block. This is obviously 0"]
      , ["metaOrigLength", "ULONG",     "Uncompressed size of metadata block. Also 0, of course."]
      , ["privOffset",     "ULONG",     "Offset to private data block, from beginning of WOFF file. We don't use one"]
      , ["privLength",     "ULONG",     "Length of private data block. Also obviously 0"]
    ]);

    var woff_header = new wOFFheader({
      flavour: "OTTO",
      numTables: numTables,
      totalSfntSize: data.length
    });

    var woff_dictionary = [],
        woff_data = [],
        woffset = woff_header.length + numTables * 20,
        woff;

    var wOFFdictionaryEntry = function(input) {
      if(!this.parse(input)) {
        input = input || {};
        this.fill(input);
      }
    };
    wOFFdictionaryEntry.prototype = new Table([
        ["tag",          "LITERAL", "tag name"]
      , ["offset",       "ULONG",   "Offset to the data, from beginning of WOFF file"]
      , ["compLength",   "LITERAL", "length of the compressed data table"]
      , ["origLength",   "LITERAL", "length of the original uncompressed data table"]
      , ["origChecksum", "LITERAL", "orginal table checksum"]
    ]);

    // build the woff table directory by copying the sfnt table
    // directory entries and duplicating the length value: we
    // are allowed to form uncompressed WOFF files, and do so.
    for(var i=0, last=numTables, chunk, entry; i<last; i++) {
      chunk = data.slice(12+i*16, 12 + (i+1)*16);
      var entry = new wOFFdictionaryEntry({
        tag: chunk.slice(0,4),
        offset: woffset + woff_data.length,
        compLength:chunk.slice(12,16),
        origLength: chunk.slice(12,16),
        origChecksum: chunk.slice(4,8)
      });

      woff_dictionary = woff_dictionary.concat(entry.toData());
      var otf_offset = dataBuilder.decodeULONG(chunk.slice(8,12)),
          otf_length = dataBuilder.decodeULONG(chunk.slice(12,16)),
          table_data = data.slice(otf_offset, otf_offset+otf_length);
      woff_data = woff_data.concat(table_data);
      while(woff_data.length % 4 !== 0) { woff_data.push(0); }
    }

    // finalise the header by recording the correct length for the font
    // (note that changing the value won't change the number of bytes).
    woff = woff_header.toData().concat(woff_dictionary).concat(woff_data);
    woff_header.length = woff.length;

    // done. WOFF is thankfully fairly straight-forward
    return woff_header.toData().concat(woff_dictionary).concat(woff_data);
  };

});

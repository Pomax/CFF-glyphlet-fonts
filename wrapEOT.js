(function(context) {

  // Convert ASCII to UTF16, the cheap way.
  function atou(v) {
    var pad = String.fromCharCode(0),
        a = v.split(''),
        out = [];
    a.forEach(function(v) {
      // reverse byteorder.
      out.push(v);
      out.push(pad);
    })
    return out.join('');
  }

  // because fun!
  function btolEndian(v) {
    console.log(v);
    return v.reverse(); }

  /**
   * Turning an opentype font into an EOT is principly a matter
   * of duplicating several of the table fields, and then adding
   * that in front of the actual font's bytecode. It's... fairly
   * stupid, but IE won't load your font without it.
   *
   * The twist? Byte ordering is reversed. The OpenType font uses
   * big endian ordering, and the EOT data must be encoded in
   * little ending. So we can't just copy, we have to copy and
   * reverse each more-than-one-byte value.
   */
	context.wrapEOT = function wrapEOT(options, tables, otfdata) {
    var OS2 = tables["OS/2"];
    var head = tables["head"];

    // little endian encoding for USHORT
    var USHORT = function(v) {
      return [v & 0xFF, (v>>8) & 0xFF];
    }

    // little endian encoding for ULONG
    var ULONG = function(v) {
      return [v & 0xFF, (v>>8) & 0xFF, (v>>16) & 0xFF, (v>>24) & 0xFF];
    }

    // we use version 1 of the EOT wrapper, because everything after that
    // introduces a million things we don't need. In fact, if there were
    // a version that doesn't bother with the Unicode/codepage range
    // nonesense, this would almost be sensible. Almost.
    var EOT = [
          ["EOTSize", ULONG, "Total structure length in bytes (including string and font data)", 0],
        , ["FontDataSize", ULONG, "Length of the OpenType font (FontData) in bytes", otfdata.length],
        , ["Version", ULONG, "EOT layout version", 0x00010000],
        , ["Flags", ULONG, "processing flags", 0]
        , ["FontPANOSE", OS2[16][1]]
        , ["Charset", BYTE, "derived from TEXTMETRIC.tmCharSet. This value specifies the character set of the font. DEFAULT_CHARSET (0x01", 1]
        , ["Italic", BYTE, "is this an italic font? no. it is not.", 0]
        , ["Weight", ULONG, "from OS/2", OS2[2][3]]
        , ["fsType", USHORT, "from OS/2", OS2[4][3]]
        , ["MagicNumber", USHORT, "... because why not...", 0x504C]
        , ["UnicodeRange1", ULONG, "we still don't care about these", 1]
        , ["UnicodeRange2", ULONG, "we still don't care about these", 0]
        , ["UnicodeRange3", ULONG, "we still don't care about these", 0]
        , ["UnicodeRange4", ULONG, "we still don't care about these", 0]
        , ["CodePageRange1", ULONG, "don't care about these either", 0]
        , ["CodePageRange2", ULONG, "don't care about these either", 0]
        , ["CheckSumAdjustment", ULONG, "from head", head[2][3]]
        , ["Reserved1", ULONG, "stupid unused padding", 0]
        , ["Reserved2", ULONG, "stupid unused padding", 0]
        , ["Reserved3", ULONG, "stupid unused padding", 0]
        , ["Reserved4", ULONG, "stupid unused padding", 0]
        , ["Padding1", USHORT, "even more amazing padding to ensure longalign", 0]
        , ["FamilyNameSize", USHORT, "familyname array size", atou(options.compactFontName).length]
        , ["FamilyName", CHARARRAY, "actual string", atou(options.compactFontName)]
        , ["Padding2", USHORT, "seriousl. what? null termination?", 0]
        , ["StyleNameSize", USHORT, "string length for style", atou("Regular").length]
        , ["StyleName", CHARARRAY, "and the stylename...", atou("Regular")]
        , ["Padding3", BYTE, "think there were enough of these yet? you wish.", 0]
        , ["VersionNameSize", USHORT, "yes. this really is the <name> table. Insanely encoded", atou(options.fontVersion).length]
        , ["VersionName", CHARARRAY, "...", atou(options.fontVersion)]
        , ["Padding4", BYTE, "it's like null-terminated strings!", 0]
        , ["FullNameSize", USHORT, "...", atou(options.fontName).length]
        , ["FullName", USHORT, "...", atou(options.fontName)]
      ];

    // build and return
    var eotData = serialize(EOT);
    return eotData.concat(otfdata);
	};

}(this));

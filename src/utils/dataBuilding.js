define([], function() {
  "use strict";

  var sizeOf = {},
      encoder = {},
      decoder = {},
      builder = {
        sizeOf: sizeOf,
        encoder: encoder,
        decoder: decoder,
        computeChecksum: function(chunk) {
          while(chunk.length % 4 !== 0) { chunk.push(0); }
          var tally = 0;
          for(var i=0, last=chunk.length; i<last; i+=4) {
            tally += (chunk[i] << 24) + (chunk[i + 1] << 16) + (chunk[i + 2] << 8) + (chunk[i + 3]);
          }
          tally %= Math.pow(2,32);
          return tally;
        },
        // this function probably shouldn't exist...
        decodeULONG: function(input) {
          var b = input.split ? input.split('').map(function(c) { return c.charCodeAt(0); }) : input;
          var val = (b[0] << 24) + (b[1] << 16) + (b[2] << 8) + b[3];
          if (val < 0 ) { val += Math.pow(2,32); }
          return val;
        }
      };


  (function() {
    for(var i=1; i<=4; i++) {
      (function setupPadding(size) {
        // this needs closure wrapped, because of that late binding for the encode.PADDING function.
        encoder["PADDING"+size] = function PADDING(v) { return (new Array(size+1)).join(0).split('').map(function(v) { return 0; }); };
        decoder["PADDING"+size] = function PADDING(v) { return 0; };
        sizeOf[ "PADDING"+size] = function(v) { return size; };
      }(i));
    }
  }());


  /***
   *
   * OpenType data types
   *
   ***/

  encoder.BYTE = function BYTE(v) { return [v]; };
  decoder.BYTE = function BYTE(v) { return v[0]; };
  sizeOf.BYTE  = function() { return 1; };

  encoder.CHAR = function CHAR(v) { return [v.charCodeAt(0)]; };
  decoder.CHAR = function CHAR(v) { return String.fromCharCode(v[0]); };
  sizeOf.CHAR  = function() { return 1; };

  encoder.CHARARRAY = function CHARARRAY(v) { return v.split('').map(function(v) { return v.charCodeAt(0); }); };
  decoder.CHARARRAY = function CHARARRAY(v) { return v.map(function(v) { return String.fromCharCode(v); }).join(''); };
  sizeOf.CHARARRAY  = function(a) { return a.length; };

  encoder.USHORT = function USHORT(v) { return [(v >> 8) & 0xFF, v & 0xFF]; };
  decoder.USHORT = function USHORT(v) { return (v[0] << 8)  + v[1]; };
  sizeOf.USHORT  = function() { return 2; };

  encoder.SHORT = function SHORT(v)  {
    var limit = 32768;
    if(v >= limit) { v = -(2*limit - v); } // 2's complement
    return [(v >> 8) & 0xFF, v & 0xFF];
  };
  decoder.SHORT = function SHORT(v)  {
    var limit = 32768;
    var v = (v[0] <<8) + v[1];
    if(v > limit) { v -= 2*limit; }
    return v;
  };
  sizeOf.SHORT  = function() { return 2; };

  encoder.UINT24 = function UINT24(v) { return [(v >> 16) & 0xFF, (v >> 8) & 0xFF, v & 0xFF]; };
  decoder.UINT24 = function UINT24(v) { return (v[0] << 16) + (v[1] << 8) + v[2]; };
  sizeOf.UINT24  = function() { return 3; };

  encoder.ULONG = function ULONG(v) { return [(v >> 24) & 0xFF, (v >> 16) & 0xFF, (v >> 8) & 0xFF, v & 0xFF]; };
  decoder.ULONG = function ULONG(v) { return (v[0] << 24) + (v[1] << 16) + (v[2] << 8) + v[3]; };
  sizeOf.ULONG  = function() { return 4; };

  encoder.LONG = function LONG(v)  {
    var limit = 2147483648;
    if(v >= limit) { v = -(2*limit - v); } // 2's complement
    return [(v >> 24) & 0xFF, (v >> 16) & 0xFF, (v >> 8) & 0xFF, v & 0xFF];
  };
  decoder.LONG = function SHORT(v)  {
    var limit = 2147483648;
    var v = (v[0] << 24) + (v[1] << 16) + (v[2] <<8) + v[3];
    if(v > limit) { v -= 2*limit; }
    return v;
  };
  sizeOf.LONG  = function() { return 4; };

  // This doesn't actually work in JS. Then again, these values that use
  // this are irrelevant, too, so we just return a 64bit "zero"
  encoder.LONGDATETIME = function LONGDATETIME(v) { return [0,0,0,0,0,0,0,0]; };
  decoder.LONGDATETIME = function LONGDATETIME(v) { return 0; }
  sizeOf.LONGDATETIME = function() { return 4; };


  // aliased datatypes
  encoder.FIXED  = encoder.ULONG;
  decoder.FIXED  = decoder.ULONG;
  sizeOf.FIXED   = sizeOf.ULONG;

  encoder.FWORD  = encoder.SHORT;
  decoder.FWORD  = decoder.SHORT;
  sizeOf.FWORD   = sizeOf.SHORT;

  encoder.UFWORD = encoder.USHORT;
  decoder.UFWORD = decoder.USHORT;
  sizeOf.UFWORD  = sizeOf.USHORT;

  encoder.OFFSET = encoder.USHORT;
  decoder.OFFSET = decoder.USHORT;
  sizeOf.OFFSET  = sizeOf.USHORT;


  /***
   *
   * CFF data types
   *
   ***/

  encoder.NUMBER = function NUMBER(v) {
    if (-107 <= v && v <= 107) {
      return [v + 139];
    }
    if (108 <= v && v <= 1131) {
      var v2 = v - 108;
      var b0 = (v2 >> 8) & 0xFF,
          b1 = v2 - (b0 << 8);
      return [b0 + 247, b1];
    }
    if (-1131 <= v && v <= -108) {
      var v2 = -v - 108,
          b0 = (v2 >> 8) & 0xFF,
          b1 = v2 - (b0 << 8);
      return [b0 + 251, b1];
    }
    if (-32768 <= v && v <= 32767) {
      return [28, (v >> 8) & 0xFF, v & 0xFF];
    }
    return [29, (v >> 24) & 0xFF, (v >> 16) & 0xFF, (v >> 8) & 0xFF, v & 0xFF];
  };

  decoder.NUMBER = function NUMBER(bytes) {
    var b0 = bytes.splice(0,1)[0];
    if(b0 === 28) {
      var b1 = bytes.splice(0,1)[0];
      var b2 = bytes.splice(0,1)[0];
      return (b1 << 8) | b2;
    }
    if(b0 === 29) {
      var b1 = bytes.splice(0,1)[0];
      var b2 = bytes.splice(0,1)[0];
      var b3 = bytes.splice(0,1)[0];
      var b4 = bytes.splice(0,1)[0];
      return (b1 << 8) | b2;
    }
    if(b0 >= 32 && b0 <= 246) {
      return b0 - 139;
    }
    if(b0 >= 247 && b0 <= 250) {
      var b1 = bytes.splice(0,1)[0];
      return ((b0-247) << 8) + b1 + 108;
    }
    if(b0 >= 251 && b0 <= 254) {
      var b1 = bytes.splice(0,1)[0];
      return -((b0-251) << 8) - b1 - 108;
    }
  };

  sizeOf.NUMBER = function(v) {
    return encoder.NUMBER(v).length;
  };

  encoder.OPERAND = function OPERAND(v1, v2) {
    var opcode = encoder.BYTE(v1);
    if(v2 !== undefined) { opcode.concat(BYTE(v2)); }
    return opcode;
  };

  encoder.DICTINSTRUCTION = function DICTINSTRUCTION(codes) {
    var data = [];
    codes.forEach(function(code) {
      data = data.concat(code);
    });
    return data;
  };

  /***
   *
   * Aliased data types
   *
   ***/

  encoder.GlyphID = encoder.USHORT;
  decoder.GlyphID = decoder.USHORT;
  sizeOf.GlyphID  = sizeOf.USHORT;

  encoder.Offset  = encoder.USHORT;
  decoder.Offset  = decoder.USHORT;
  sizeOf.Offset   = sizeOf.USHORT;

  encoder.Card8   = encoder.BYTE;
  decoder.Card8   = decoder.BYTE;
  sizeOf.Card8    = sizeOf.BYTE;

  encoder.Card16  = encoder.USHORT;
  decoder.Card16  = decoder.USHORT;
  sizeOf.Card16   = sizeOf.USHORT;

  encoder.SID     = encoder.USHORT;
  decoder.SID     = decoder.USHORT;
  sizeOf.SID   = sizeOf.USHORT;

  encoder.OffSize = encoder.BYTE;
  decoder.OffSize = decoder.BYTE;
  sizeOf.OffSize    = sizeOf.BYTE;

  encoder.OffsetX = [undefined, encoder.BYTE, encoder.USHORT, encoder.UINT24, encoder.ULONG];
  decoder.OffsetX = [undefined, decoder.BYTE, decoder.USHORT, decoder.UINT24, decoder.ULONG];
  sizeOf.OffsetX  = [undefined, sizeOf.BYTE,  sizeOf.USHORT,  sizeOf.UINT24,  sizeOf.ULONG];

  encoder.BOOLEAN = function(v) { return v ? [1] : [0]; };
  decoder.BOOLEAN = function(v) { return !!v[0]; };
  sizeOf.BOOLEAN  = function()  { return 1; };

  encoder.NUMBERS = function(v) {
    var data = [];
    v.forEach(function(c) {
      data = data.concat(encoder.NUMBER(c));
    })
    return data;
  };
  decoder.NUMBERS = function(v) {
    var numbers = [];
    while(v.length > 0) {
      numbers.push(decoder.NUMBER(v));
    }
    return numbers;
  };
  sizeOf.NUMBERS  = function(v)  { return v.length; };

  // type2 opcode encoding/decoding
  (function(encoder, decoder, sizeOf) {
    var CFFtypes = [
      // Top dict values
      ["version",            "NUMBER",   [0]      ]
    , ["Notice",             "NUMBER",   [1]      ]
    , ["Copyright",          "NUMBER",   [12, 0]  ]
    , ["FullName",           "NUMBER",   [2]      ]
    , ["FamilyName",         "NUMBER",   [3]      ]
    , ["Weight",             "NUMBER",   [4]      ]
    , ["isFixedPitch",       "BOOLEAN",  [12, 1]  ]
    , ["ItalicAngle",        "NUMBER",   [12, 2]  ]
    , ["UnderlinePosition",  "NUMBER",   [12, 3]  ]
    , ["UnderlineThickness", "NUMBER",   [12, 4]  ]
    , ["PaintType",          "NUMBER",   [12, 5]  ]
    , ["CharstringType",     "NUMBER",   [12, 6]  ]
    , ["FontMatrix",         "NUMBERS",  [12, 7]  ]
    , ["UniqueID",           "NUMBER",   [13]     ]
    , ["FontBBox",           "NUMBERS",  [5]      ]
    , ["StrokeWidth",        "NUMBER",   [12, 8]  ]
    , ["XUID",               "NUMBERS",  [14]     ]
    , ["charset",            "NUMBER",   [15]     ]
    , ["Encoding",           "NUMBER",   [16]     ]
    , ["CharStrings",        "NUMBER",   [17]     ]
    , ["Private",            "NUMBERS",  [18]     ]
    , ["SyntheticBase",      "NUMBER",   [12, 20] ]
    , ["PostScript",         "NUMBER",   [12, 21] ]
    , ["BaseFontName",       "NUMBER"    [12, 22] ]
    , ["BaseFontBlend",      "NUMBER",   [12, 23] ]
      // CID font specific values
    , ["ROS",                "NUMBERS",  [12, 30] ]
    , ["CIDFontVersion",     "NUMBER",   [12, 31] ]
    , ["CIDFontRevision",    "NUMBER",   [12, 32] ]
    , ["CIDFontType",        "NUMBER",   [12, 33] ]
    , ["CIDCount",           "NUMBER",   [12, 34] ]
    , ["UIDBase",            "NUMBER",   [12, 35] ]
    , ["FDArray",            "NUMBER",   [12, 36] ]
    , ["FDSelect",           "NUMBER",   [12, 37] ]
    , ["FontName",           "NUMBER",   [12, 38] ]
      // Private dict values
    , ["BlueValues",         "NUMBERS",  [6]      ]
    , ["OtherBlues",         "NUMBERS",  [7]      ]
    , ["FamilyBlues",        "NUMBERS",  [8]      ]
    , ["FamilyOtherBlues",   "NUMBERS",  [9]      ]
    , ["BlueScale",          "NUMBER",   [12,  9] ]
    , ["BlueShift",          "NUMBER",   [12, 10] ]
    , ["BlueFuzz",           "NUMBER",   [12, 11] ]
    , ["StdHW",              "NUMBER",   [10]     ]
    , ["StdVW",              "NUMBER",   [11]     ]
    , ["StemSnapH",          "NUMBER",   [12, 12] ]
    , ["StemSnapV",          "NUMBER",   [12, 13] ]
    , ["ForceBold",          "BOOLEAN",  [12, 14] ]
    , ["LanguageGroup",      "NUMBER",   [12, 17] ]
    , ["ExpansionFactor",    "NUMBER",   [12, 18] ]
    , ["initialRandomSeed",  "NUMBER",   [12, 19] ]
    , ["Subrs",              "NUMBER",   [19]     ]
    , ["defaultWidthX",      "NUMBER",   [20]     ]
    , ["nominalWidthX",      "NUMBER",   [21]     ]
    ];

    encoder.CFF = {};
    decoder.CFF = {};
    sizeOf.CFF = {};

    CFFtypes.forEach(function(r) {
      encoder.CFF[r[0]] = function(v) {
        return encoder[r[1]](v).concat(r[2]);
      };
      decoder.CFF[r[0]] = function(v) {
        v.splice(-r[2].length, r[2].length);
        return decoder[r[1]](v);
      };
      sizeOf.CFF[r[0]] = function(v) {
        return sizeOf[r[1]](v) + r[2].length;
      };
    });

    encoder.types = CFFtypes.map(function(v) { return v[0]; });
    decoder.types = encoder.types;

  }(encoder, decoder, sizeOf));

  /**
   * Helper function for copying data regions
   */
  encoder.LITERAL = function LITERAL(array) { return array; };
  decoder.LITERAL = encoder.LITERAL;
  sizeOf.LITERAL = function(v) { if(v.toData) return v.toData().length; return v.length; };


  return builder;
});

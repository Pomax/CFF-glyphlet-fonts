define(["Mapper"], function(Mapper) {
  "use strict";

  var sizeOf = {},
      encoder = {},
      decoder = {},
      builder = {
        sizeOf: sizeOf,
        encoder: encoder,
        decoder: decoder,
        bind: function(obj) {
          Object.keys(encoder).forEach(function(key) {
            obj[key] = encoder[key];
          });
        },
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
  encoder.Offset  = encoder.USHORT;
  decoder.Offset  = decoder.USHORT;
  encoder.Card8   = encoder.BYTE;
  decoder.Card8   = decoder.BYTE;
  encoder.Card16  = encoder.USHORT;
  decoder.Card16  = decoder.USHORT;
  encoder.SID     = encoder.USHORT;
  decoder.SID     = decoder.USHORT;
  encoder.OffSize = encoder.BYTE;
  decoder.OffSize = decoder.BYTE;
  encoder.OffsetX = [undefined, encoder.BYTE, encoder.USHORT, encoder.UINT24, encoder.ULONG];
  decoder.OffsetX = [undefined, decoder.BYTE, decoder.USHORT, decoder.UINT24, decoder.ULONG];

  /**
   * Helper function for copying data regions
   */
  encoder.LITERAL = function LITERAL(array) { return array; };
  decoder.LITERAL = encoder.LITERAL;
  sizeOf.LITERAL = function(v) { if(v.toData) return v.toData().length; return v.length; };

  /**
   * Helper function for decoding strings as ULONG
   */
  encoder.decodeULONG = function decodeULONG(ulong) {
    var b = ulong.split ? ulong.split('').map(function(c) { return c.charCodeAt(0); }) : ulong;
    var val = (b[0] << 24) + (b[1] << 16) + (b[2] << 8) + b[3];
    if (val < 0 ) { val += Math.pow(2,32); }
    return val;
  };

  // const, but const in strict mode is not allowed
  var LABEL = 0;
  var READER = 1;
  var NESTED_RECORD = 1;
  var DESCRIPTION = 2;
  var DATA = 3;

  /**
   * Serialise a record structure into byte code
   */
  encoder.serialize = function serialize(base_record, mapper, basename, offset) {
    basename = basename || "";
    offset = offset || 0;
    var data = [];
    var map = mapper ? new Mapper() : false;
    (function _serialize(record, prefix) {
      if(prefix == parseInt(prefix,10)) {
        prefix = "";
      } else if(prefix !== "") { prefix += "."; }
      var start = offset + data.length;
      if (typeof record[LABEL] !== "string") {
        try {
          record.forEach(function(_r, idx) {
            _serialize(_r, prefix + "[" + idx + "]");
          });
        } catch(e) { console.error(record); throw e; }
      }
      else if (typeof record[READER] === "function") {
        data = data.concat(record[READER](record[DATA]));
      }
      else {
        var nested = record[NESTED_RECORD];
        if(nested instanceof Array) {
          _serialize(nested, prefix + "." + record[LABEL]);
        }
        else {
          console.error(record);
          throw new Error("what?");
        }
      }
      var end = offset + data.length;
      if(map && typeof record[LABEL] === "string") {
        var value = false;
        if(typeof record[DATA] === "number" || typeof record[DATA] === "string") {
          value = record[DATA];
        }
        map.addMapping(prefix + record[LABEL], start, end, "field", record[DESCRIPTION], value);
      }
    }(base_record, basename));

    if(map) {
      map.mappings.sort(function(a,b) {
        if(a.start !== b.start) {
          return a.start - b.start;
        }
        return a.end - b.end;
      });
      mapper.mappings = mapper.mappings.concat(map.mappings);
    }
    return data;
  };

  return builder;
});

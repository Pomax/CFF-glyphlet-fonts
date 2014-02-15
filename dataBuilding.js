(function(context) {
  "use strict";

  // Convert ASCII to UTF16, the cheap way.
  context.atou = function atou(v) {
    var pad = String.fromCharCode(0),
        a = v.split(''),
        out = [];
    a.forEach(function(v) {
      // This works because for the ANSI range 0x00-0xFF,
      // the equivalent UTF16 code is 0x0000-0x00FF.
      out.push(pad);
      out.push(v);
    })
    return out.join('');
  };

  /***
   *
   * OpenType data types
   *
   ***/

  context.BYTE = function BYTE(v) { return [v]; };
  context.CHAR = function CHAR(v) { return [v.charCodeAt(0)]; };
  context.CHARARRAY = function CHARARRAY(v) { return v.split('').map(function(v) { return v.charCodeAt(0); }); };
  context.FIXED = function FIXED(v) { return [(v >> 24) & 0xFF, (v >> 16) & 0xFF, (v >> 8) & 0xFF, v & 0xFF]; };
  context.USHORT = function USHORT(v) { return [(v >> 8) & 0xFF, v & 0xFF]; };
  context.SHORT = function SHORT(v)  {
    var limit = 32768;
    if(v >= limit) { v = -(2*limit - v); } // 2's complement
    return [(v >> 8) & 0xFF, v & 0xFF];
  };
  context.UINT24 = function UINT24(v) { return [(v >> 16) & 0xFF, (v >> 8) & 0xFF, v & 0xFF]; };
  context.ULONG = function ULONG(v) { return [(v >> 24) & 0xFF, (v >> 16) & 0xFF, (v >> 8) & 0xFF, v & 0xFF]; };
  context.LONG = function LONG(v)  {
    var limit = 2147483648;
    if(v >= limit) { v = -(2*limit - v); } // 2's complement
    return [(v >> 24) & 0xFF, (v >> 16) & 0xFF, (v >> 8) & 0xFF, v & 0xFF];
  };

  context.LONGDATETIME = function LONGDATETIME(v) {
    // This doesn't actually work in JS. Then again, these values that use
    // this are irrelevant, too, so we just return a 64bit "zero"
    return [0,0,0,0,0,0,0,0];
  };


  // aliased datatypes
  context.FWORD = SHORT;
  context.UFWORD = USHORT;
  context.OFFSET = USHORT;

  /***
   *
   * CFF data types
   *
   ***/

  context.NUMBER = function NUMBER(v) {
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

  context.OPERAND = function OPERAND(v1, v2) {
    var opcode = BYTE(v1);
    if(v2 !== undefined) { opcode.concat(BYTE(v2)); }
    return opcode;
  };

  context.DICTINSTRUCTION = function DICTINSTRUCTION(codes) {
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

  context.GlyphID = USHORT;
  context.Offset = USHORT;
  context.Card8 = BYTE;
  context.Card16 = USHORT;
  context.SID = USHORT;
  context.OffSize = BYTE;
  context.OffsetX = [undefined, BYTE, USHORT, UINT24, ULONG];

  /**
   * Helper function for copying data regions
   */
  context.LITERAL = function LITERAL(array) {
    return array;
  };

  /**
   * Helper function for decoding strings as ULONG
   */
  context.decodeULONG = function decodeULONG(ulong) {
    var b = ulong.split ? ulong.split('').map(function(c) { return c.charCodeAt(0); }) : ulong;
    var val = (b[0] << 24) + (b[1] << 16) + (b[2] << 8) + b[3];
    if (val < 0 ) { val += Math.pow(2,32); }
    return val;
  };

  // const, but const in strict mode is not allowed
  var LABEL = 0;
  var READER = 1;
  var NESTED_RECORD = 1;
  var DATA = 3;

  /**
   * Serialise a record structure into byte code
   */
  context.serialize = function serialize(base_record, mapper, basename, offset) {
    basename = basename || "";
    offset = offset || 0;
    var data = [];
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
      if(mapper && typeof record[LABEL] === "string") {
        mapper.addMapping(prefix + record[LABEL], start, end, "field");
      }
    }(base_record, basename));
    return data;
  };

}(this));


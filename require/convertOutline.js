define(["dataBuilding"], function(dataBuilder) {

  var NUMBER  = dataBuilder.encoder.NUMBER;
  var OPERAND = dataBuilder.encoder.OPERAND;

  return function convertOutline(options) {

    var outline = options.outline;
    var sections = outline.match(/[MmLlCcZz]\s*([\-\d]+\s*)*/g).map(function(s){return s.trim()});
    var mx = 99999999, MX=-99999999, my=mx, MY=MX;
    var x=0, y=0, cx=false, cy=false, i=0, last=0;
    var charstring = [];
    var terminated = false;

    var mark = function(x,y) {
      if(x < mx) { mx = x; }
      if(y < my) { my = y; }
      if(x > MX) { MX = x; }
      if(y > MY) { MY = y; }
    }

    sections.forEach(function(d) {
      var op = d.substring(0,1);
      var values = d.substring(1).trim().split(/\s+/).map(function(v) { return parseInt(v); });

      // first, make all sections relative coordinates (if absolute)
      if(op === op.toUpperCase()) {
        op = op.toLowerCase();
        if(op === 'm') {
          values[0] -= x; x += values[0];
          values[1] -= y; y += values[1];
          mark(x,y);
        }
        else if(op === 'l') {
          for(i=0, last=values.length; i<last; i+=2) {
            values[i+0] -= x; x += values[i+0];
            values[i+1] -= y; y += values[i+1];
            mark(x,y);
          }
        }
        else if(op === 'c') {
          for(i=0, last=values.length; i<last; i+=6) {
            cx = x + values[i+2];
            cy = y + values[i+3];
            values[i+0] -= x;
            values[i+1] -= y;
            values[i+2] -= x;
            values[i+3] -= y;
            values[i+4] -= x; x += values[i+4];
            values[i+5] -= y; y += values[i+5];
            mark(x,y);
          }
        }
      }

      // then convert the data to Type2 charstrings
      if(op === 'm') {
        charstring = charstring.concat( NUMBER(values[0]).concat(NUMBER(values[1])).concat(OPERAND(21)) );
      }
      else if(op === 'l') {
        for(i=0, last=values.length; i<last; i+=2) {
          charstring = charstring.concat( NUMBER(values[i]).concat(NUMBER(values[i+1])).concat(OPERAND(5)) );
        }
      }
      else if(op === 'c') {
        for(i=0, last=values.length; i<last; i+=6) {
          charstring = charstring.concat(
            NUMBER(values[i+0])
            .concat(NUMBER(values[i+1]))
            .concat(NUMBER(values[i+2]))
            .concat(NUMBER(values[i+3]))
            .concat(NUMBER(values[i+4]))
            .concat(NUMBER(values[i+5]))
            .concat(OPERAND(8))
          );
        }
      }
      else if(op === 'z') {
        charstring = charstring.concat(OPERAND(14));
        terminated = true;
      }
      else {
        // FIXME: add 's' and 'a' support
        throw "op "+op+" not supported at this time."
      }
    });

    if(!terminated) {
      charstring = charstring.concat(OPERAND(14));
    }

    // bounding box
    options.xMin = mx;
    options.yMin = my;
    options.xMax = MX;
    options.yMax = MY;

    // If the glyph is wider than the default width, we can note this
    // by recording [nominal - true] width as first charstring value.
    // Note: both default and nominal width are defined as options.xMax in this font.
    if(MX != options.xMax) { charstring = NUMBER(options.xMax - MX).concat(charstring); }
    options.charString = charstring;
  };

});

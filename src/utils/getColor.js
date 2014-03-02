define(function() {

  var s = 0.8;
  var l = 0.8;

  function hue2rgb(p, q, t) {
    if(t < 0) t += 1;
    if(t > 1) t -= 1;
    if(t < 1/6) return p + (q - p) * 6 * t;
    if(t < 1/2) return q;
    if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  }

  function tohex(v) {
    v = ((255*v)|0).toString(16);
    if(v.length === 1) v = "0" + v;
    return v;
  }

  return function getColor(idx) {
    var h = (idx/10);
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    var r = hue2rgb(p, q, h + 1/3);
    var g = hue2rgb(p, q, h);
    var b = hue2rgb(p, q, h - 1/3);
    return "#" + tohex(r) + tohex(g) + tohex(b);
  };

});

define(function() {
  return function asHex(v) {
    v = v.toString(16).toUpperCase();
    if(v.length === 1) { v = "0" + v; }
    return v;
  };
});
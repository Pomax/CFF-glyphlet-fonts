/**

    Node.js compile script.
    Simply run as:

    $> node compile

    note: assumes you have TTX installed
    (http://github.com/behdad/fonttools)

**/

var fs = require("fs");
var spawn = require('child_process').spawn;
var dataBuilder = require("./dataBuilding.js");
var Mapper = require("./Mapper.js").Mapper;
var buildFont = require("./Tables.js");
var asHex = function(v) { return v.toString(16).toUpperCase(); };
var asChars = function(v) { return String.fromCharCode(v); }
var font;
var y = -120;
var outline = "M  20 "+(100 + y) + " L  20 "+(800 + y) + " 700 "+(800 + y) + " 700 "+(100 + y) + " 20 "+(100 + y)
            + "M 170 "+(250 + y) + " L 550 "+(250 + y) + " 550 "+(650 + y) + " 170 "+(650 + y);

function formStyleSheet(font, cssFontFamily) {
  cssFontFamily = cssFontFamily || "custom font";
  var bota = function btoa(str) {
    return (str instanceof Buffer ? str : buffer = new Buffer(str.toString(), 'binary')).toString("base64");
  };
  var mime_otf = "font/opentype";
  var dataurl_otf = "data:" + mime_otf + ";base64," + btoa(font.otf.map(asChars).join(''));
  var mime_woff = "application/font-woff";
  var dataurl_woff = "data:" + mime_woff + ";base64," + btoa(font.woff.map(asChars).join(''));
  var fontface = ["@font-face {\n  font-family: '" + cssFontFamily + "';"
                 , "  font-weight: normal;"
                 , "  font-style: normal;"
                 , "  src: url('" +dataurl_otf+ "') format('opentype'),"
                 , "       url('" +dataurl_woff+ "') format('woff');"
                 , "}"].join("\n");
  return fontface;
};

function toBuffer(a) {
  var arr = new Int8Array(arr.length);
  var arb = new ArrayBuffer(arr);
  for(var i=0, last=a.length; i<last; i++) {
    arb[i] = a[i];
  }
  return new Buffer(arb);
}

// generate small font
var small = {
    outline: outline
  , glyphName: "~"
  , fontFamily: "c"
  , subFamily: "c"
  , fontVersion: "1"
  , fontName: "c"
  , minimal: true
};

font = buildFont(small, Mapper, dataBuilder);
["cff","otf","woff"].forEach(function(type) {
  fs.writeFileSync("binaries/customfont." + type, new Buffer(font[type]));
});
fs.unlink("binaries/customfont.ttx");
spawn('ttx', ['binaries/customfont.otf', '-o', 'binaries/customfont.ttx']);

// generate big font with GSUB
var big = {
    outline: outline
  , label: "custom"
  , glyphName: "custom"
  , fontFamily: "Custom Font"
  , subFamily: "Regular"
  , fontName: "Custom Glyph Font"
  , compactFontName: "customfont"
  , fontVersion: "Version 1.0"
};

font = buildFont(big, Mapper, dataBuilder);
["cff","otf","woff"].forEach(function(type) {
  fs.writeFileSync("binaries/with GSUB/customfont." + type, new Buffer(font[type]));
});
fs.unlink("binaries/with GSUB/customfont.ttx");
spawn('ttx', ['binaries/with GSUB/customfont.otf', '-o', 'binaries/with GSUB/customfont.ttx']);

//console.log(formStyleSheet(font));

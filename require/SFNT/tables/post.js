define(["struct"], function(Table){
  "use strict";

  var post = function(input) {
    if(!this.parse(input)) {
      input = input || {};
      input.version = input.version || 0x00030000;
      input.italicAngle = input.italicAngle || 0;
      input.underlinePosition = input.underlinePosition || 0;
      input.underlineThickness = input.underlineThickness || 0;
      input.isFixedPitch = input.isFixedPitch || 1;
      input.minMemType42 = input.minMemType42 || 0;
      input.maxMemType42 = input.maxMemType42 || 0;
      input.minMemType1 = input.minMemType1 || 0;
      input.maxMemType1 = input.maxMemType1 || 0;
      this.fill(input);
    }
  };

  post.prototype = new Table([
    ["version",            "FIXED", "post table format"]
  , ["italicAngle",        "FIXED", ""]
  , ["underlinePosition",  "FWORD", ""]
  , ["underlineThickness", "FWORD", ""]
  , ["isFixedPitch",       "ULONG", ""]
  , ["minMemType42",       "ULONG", ""]
  , ["maxMemType42",       "ULONG", ""]
  , ["minMemType1",        "ULONG", ""]
  , ["maxMemType1",        "ULONG", ""]
  ]);

  post.prototype.constructor = post;

  return post;

});

define(["struct"], function(Table){
  "use strict";

  var post = function(input) {
    if(!this.parse(input)) {
      input = input || {};
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

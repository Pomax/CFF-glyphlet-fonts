define(["./Table"], function(Table){

  var post = function(dataBlock) {
    if(dataBlock) { this.parse(dataBlock); }
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

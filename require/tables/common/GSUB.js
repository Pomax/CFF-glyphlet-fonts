define(["../Table", "./common"], function(Table){
  var GSUB = function() {}
  GSUB.prototype = new Table([]);
  GSUB.prototype.constructor = GSUB;
  return GSUB;
});

define(["../Table", "./common"], function(Table){
  var GDEF = function() {}
  GDEF.prototype = new Table([]);
  GDEF.prototype.constructor = GDEF;
  return GDEF;
});

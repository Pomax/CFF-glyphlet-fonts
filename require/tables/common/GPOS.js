define(["../Table", "./common"], function(Table){
  var GPOS = function() {}
  GPOS.prototype = new Table([]);
  GPOS.prototype.constructor = GPOS;
  return GPOS;
});

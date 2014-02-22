define(["../Table", "./common"], function(Table){
  var JSTF = function() {}
  JSTF.prototype = new Table([]);
  JSTF.prototype.constructor = JSTF;
  return JSTF;
});

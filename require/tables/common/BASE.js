define(["../Table", "./common"], function(Table){
  var BASE = function() {}
  BASE.prototype = new Table([]);
  BASE.prototype.constructor = BASE;
  return BASE;
});

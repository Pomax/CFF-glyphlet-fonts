define(["./Table"], function(Table){
  var cmap = function() {}
  cmap.prototype = new Table([]);
  cmap.prototype.constructor = cmap;
  return cmap;
});

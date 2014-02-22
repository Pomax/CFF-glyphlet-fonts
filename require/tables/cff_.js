define(["./Table"], function(Table){
  var cff = function() {}
  cff.prototype = new Table([]);
  cff.prototype.constructor = cff;
  return cff;
});

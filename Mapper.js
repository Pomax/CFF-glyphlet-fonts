(function Mapper() {
  "use strict";
  var Mapper = function() {
  	this.mappings = [];
  };
  Mapper.prototype = {
    addMapping: function addMapping(name, start, end, type) {
      this.mappings.push({name:name, start:start, end:end, type:type});
    }
  };
  window.Mapper = Mapper;
}());

(function Mapper(context) {
  "use strict";
  var Mapper = function() {
  	this.mappings = [];
  };
  Mapper.prototype = {
    addMapping: function addMapping(name, start, end, type) {
      this.mappings.push({name:name, start:start, end:end, type:type});
    }
  };

  // AMD style function
  if(context.define) {
    context.define(function() {
      return Mapper;
    });
  }

  // Node.js
  else if(context.module) {
    context.module.exports = Mapper;
  }

  // any other context
  else {
    context.Mapper = Mapper;
  }

}(this));

define(function() {
  "use strict";

  var mappings, locked, offset = 0;

  var reset = function reset() {
    mappings = [];
  };

  var addMapping = function addMapping(options) {
    if(locked || !mappings) return;
    var mapping = {
      name: options.name || '',
      start: offset,
      end: offset + options.length,
      type: options.type || '',
      description: options.description || '',
      value: options.value || false
    };
//    offset += options.length;
    mappings.push(mapping);
    return mapping;
  };

  var lock = function lock() {
    locked = true;
  };

  return {
    reset: reset,
    lock: lock,
    addMapping: addMapping,
    getMappings: function() {
      return mappings;
    }
  };

});

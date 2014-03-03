define(function() {
  "use strict";

  var Mapper = function() {
    this.mappings = [];
  };

  Mapper.prototype = {
    reset: function reset() {
      this.mappings = [];
    },
    addMapping: function addMapping(offset, options) {
      var mapping = {
        name: options.name || '',
        start: offset,
        end: offset + options.length,
        type: options.type || '',
        description: options.description || '',
        value: options.value !== undefined ? options.value instanceof Array ? "<structured>" : options.value : false,
        structure: options.structure || false
      };
      this.mappings.push(mapping);
      return mapping;
    },
    last: function() {
      return this.mappings[this.mappings.length-1];
    },
    sort: function() {
      this.mappings.sort(function(a,b) {
        // order by start offsets
        var diff = a.start - b.start;
        // but, if they're the same: the longest mapping comes first
        if(diff === 0) { return b.end - a.end; }
        return diff;
      });
    }
  };

  return Mapper;
});

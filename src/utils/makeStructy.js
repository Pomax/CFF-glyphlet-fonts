define(function() {
	return function makeStructy(array, name) {
    array.toJSON = function() {
      return this.map(function(r) { return r.toJSON(); });
    };
    array.toData = function(offset, mappings) {
      offset = offset || 0;
      var data = [], val;
      this.forEach(function(r) {
        val = r.toData(offset, mappings);
        data = data.concat(val);
        if(mappings) {
          mappings.addMapping(offset, {
            name: name,
            length: val.length,
            structure: r.toJSON()
          });
        }
        offset += val.length;
      });
      return data;
    };
    array.toString = function() {
      return JSON.stringify(this.toJSON(), false, 2);
    };
    return array;
	};
})
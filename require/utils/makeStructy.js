define(function() {
	return function makeStructy(array) {
    array.toJSON = function() {
      return this.map(function(r) { return r.toJSON(); });
    };
    array.toData = function() {
      var data = [];
      this.forEach(function(r) { data = data.concat(r.toData()); });
      return data;
    };
    array.toString = function() {
      return JSON.stringify(this.toJSON(), false, 2);
    };
    return array;
	};
})
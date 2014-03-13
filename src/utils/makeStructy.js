define(["nodeBuilder"], function(nodeBuilder) {

  return function makeStructy(name, array) {
    if(!name || !array) {
      throw "nope";
    }
    array.name = name;
    array.toJSON = function() {
      return this.map(function(r) {
        return r.toJSON();
      });
    };
    array.toHTML = function() {
      var self = this,
          obj = nodeBuilder.create("div");
      obj.setAttribute("class", this.name);
      this.forEach(function(field) {
        if (field.toHTML) {
          obj.appendChild(field.toHTML());
        } else {
          var d = nodeBuilder.create("div");
          d.setAttribute("class", "value");
          d.setAttribute("data-value", field);
          obj.appendChild(d);
        }
      });
      return obj;
    };
    array.toData = function(offset, mappings) {
      offset = offset || 0;
      var data = [], val;
      this.forEach(function(r) {
        if(!r.toData) {
          data.push(r);
          return;
        }
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

});

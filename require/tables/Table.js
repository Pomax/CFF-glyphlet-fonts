define(["dataBuilding"], function(dataBuilder) {

  var encoder = dataBuilder.encoder,
      decoder = dataBuilder.decoder,
      sizeOf = dataBuilder.sizeOf,
      serialize = encoder.serialize;

	var Table = function(fields) {
    var self = this;
    this.fields = {};
    this.values = {};
    fields.forEach(function(record) {
      var fieldName = record[0];
      var fieldType = record[1];
      var fieldDesc = record[2];
      self.fields[fieldName] = fieldType;
      self.values[fieldName] = 0;
      Object.defineProperty(self, fieldName, {
        get: function() { return decoder[fieldType](self.values[fieldName]); },
        set: function(v) { self.values[fieldName] = encoder[fieldType](v);   }
      });
    });
  };

  Table.prototype = {
    offset: function(fieldName) {
      var offset = 0, names = Object.keys(this.fields);
      for(var i=0, last=names.length; i<last; i++) {
        var name = names[i];
        if (name === fieldName) return offset;
        offset += this.sizeOf(name);
      };
      return 0;
    },
    sizeOf: function(fieldName) { return sizeOf[this.fields[fieldName]](this[fieldName]); },
    parse: function(data){},
    finalise: function(){},
    serialize: function() {
      var self = this;
      var data = [];
      Object.keys(this.values).forEach(function(fieldName) {
        data = data.concat(self.values[fieldName]);
      });
      return data;
    }
  };

  dataBuilder.bind(Table);

  return Table;
})
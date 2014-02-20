define(["dataBuilding"], function(dataBuilder) {

  var encoder = dataBuilder.encoder,
      decoder = dataBuilder.decoder,l
      sizeOf = dataBuilder.sizeOf;

	var Table = function(fields) {
    var self = this;

    this.fields = {};

    fields.forEach(function(record) {
      var fieldValue = 0;
      var fieldName = record[0];
      var fieldType = record[1];
      var fieldDesc = record[2];
      self.fields[fieldName] = fieldType;
      Object.defineProperty(self, fieldName, {
        get: function() { return decoder[fieldType](fieldValue); },
        set: function(v) { fieldValue = encoder[fieldType](v);   }
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
    finalise: function(){}
  };

  dataBuilder.bind(Table);

  return Table;
})
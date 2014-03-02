define(["dataBuilding"], function(dataBuilder) {
  "use strict";

  var encoder = dataBuilder.encoder,
      decoder = dataBuilder.decoder,
      sizeOf = dataBuilder.sizeOf,
      serialize = encoder.serialize;

	var Struct = function(name, structData) {
    if(!structData) {
      structData = name;
      name = "";
    }
    this.name = name;
    this.definition = structData;
    // the real magic happens in .fill()
  };

  Struct.prototype = {
    fill: function(values) {
      this.fields = {};
      this.values = {};
      this.bindFields(this.definition);
      var self = this;
      if (values) {
        Object.keys(values).forEach(function(key) {
          self[key] = values[key];
        })
      }
    },
    bindFields: function(structData) {
      var self = this;
      structData.forEach(function(record) {
        (function(fieldName, fieldType, fieldDesc) {
          self.fields[fieldName] = fieldType;
          Object.defineProperty(self, fieldName, {
            // decode the stored value
            get: function() {
              return self.values[fieldName] !== undefined ? decoder[fieldType](self.values[fieldName]) : "-";
            },
            // store values so that they're already encoded correctly
            set: function(v) {
              self.values[fieldName] = v.encode ? v.encode() : encoder[fieldType](v);
            }
          });
          // ensure padding fields are always zero, rather than uninitialised
          if(fieldType === "PADDING1" || fieldType === "PADDING2" || fieldType === "PADDING3" || fieldType === "PADDING4") {
            self[fieldName] = 0;
          }
        }(record[0], record[1], record[2]));
      });
    },
    unset: function(fields) {
      var self = this;
      fields.forEach(function(fieldName) {
        delete self.fields[fieldName];
        delete self.values[fieldName];
      });
    },
    offset: function(fieldName) {
      var offset = 0,
          names = Object.keys(this.fields);
      for(var i=0, last=names.length; i<last; i++) {
        var name = names[i];
        if (name === fieldName) {
          return offset;
        }
        offset += this.sizeOf(name);
      };
      return 0;
    },
    sizeOf: function(fieldName) {
      var val = this.values[fieldName] ? this[fieldName] : false;
      return sizeOf[this.fields[fieldName]](val);
    },
    parse: function(data){
      this.values = {};
      if(!data) return false;
      if(typeof data !== "string" && !(data instanceof Int8Array)) return false;
      if(typeof data === "string") data = data.split('').map(function(v) { return v.charCodeAt(0); });
      // TODO: code goes here
    },
    finalise: function(){
      // a struct is considered final by default.
    },
    valueOf: function() {
      return this.toString();
    },
    toJSON: function() {
      var self = this,
          obj = {};
      Object.keys(this.fields).forEach(function(field) {
        var f = self[field];
        obj[field] = f.toJSON ? f.toJSON() : f.toString();
      });
      return obj;
    },
    toString: function() {
      return JSON.stringify(this.toJSON(), false, 2);
    },
    toData: function(offset, mapper) {
      offset = offset || 0;
      var self = this,
          data = [],
          val;
      Object.keys(this.fields).forEach(function(field) {
        if(self.fields[field] === "LITERAL") {
          if(self.values[field].toData) {
            val = self.values[field].toData(offset, mapper);
          }
          else {
            val = self.values[field];
          }
        }
        else {
          val = self.values[field];
        }

        if(mapper) {
          mapper.addMapping(offset, {
            length: val.length,
            name: (self.name ? self.name : '') + ":" + field,
            value: self[field]
          });
        }
        offset += val.length;

        data = data.concat(val);
      });
      return data;
    }
  };

  dataBuilder.bind(Struct);

  return Struct;
})
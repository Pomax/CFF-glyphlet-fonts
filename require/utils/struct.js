define(["dataBuilding"], function(dataBuilder) {
  "use strict";

  var encoder = dataBuilder.encoder,
      decoder = dataBuilder.decoder,
      sizeOf = dataBuilder.sizeOf,
      serialize = encoder.serialize;

	var Struct = function(structData) {
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
              if(self.values[fieldName] && self.values[fieldName].encode) {
                return self.values[fieldName];
              }
              return self.values[fieldName] !== undefined ? decoder[fieldType](self.values[fieldName]) : "-";
            },
            // store values so that they're already encoded correctly
            set: function(v) {
//              console.log(fieldName, "-", v);
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
    finalise: function(){},
    serialize: function() {
      var self = this;
      var data = [];
      Object.keys(this.values).forEach(function(fieldName) {
        data = data.concat(self.values[fieldName]);
      });
      return data;
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
    toData: function() {
      var self = this,
          data = [],
          val;
      Object.keys(this.fields).forEach(function(field) {
        if(self.fields[field] === "LITERAL") {
//          console.log(field);
          if(self.values[field].toData) {
            val = self.values[field].toData();
          }
          else {
            val = self.values[field];
          }
        }
        else { val = self.values[field]; }
        data = data.concat(val);
      });
      return data;
    }
  };

  dataBuilder.bind(Struct);

  return Struct;
})
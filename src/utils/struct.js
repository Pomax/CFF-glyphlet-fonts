define(["dataBuilding", "nodeBuilder", "makeStructy"], function(dataBuilder, nodeBuilder, makeStructy) {
  "use strict";

  var encoder = dataBuilder.encoder,
      decoder = dataBuilder.decoder,
      sizeOf  = dataBuilder.sizeOf;

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
    setName: function(name) {
      this.name = name;
    },
    fill: function(values) {
      this.bindFields(this.definition);
      var self = this;
      if (values) {
        Object.keys(values).forEach(function(key) {
          if(self.fields[key]) {
            self[key] = values[key];
          }
        })
      }
    },
    bindFields: function(structData) {
      this.fields = {};
      this.values = {};
      this.descriptions = {};
      var self = this;
      structData.forEach(function(record) {
        (function(fieldName, fieldType, fieldDesc) {
          self.fields[fieldName] = fieldType;
          self.descriptions[fieldName] = fieldDesc;
          Object.defineProperty(self, fieldName, {
            // decode the stored value
            get: function() {
              if (self.values[fieldName] === undefined) {
                throw "Cannot find a value bound for " + fieldName;
              }
              var val = self.values[fieldName];
              if(fieldType.indexOf("CFF.") === 0) {
                if(val.slice) {
                  // CFF.NUMBER will splice an array, so we need to make
                  // sure we pass around copies of the internal values,
                  // to prevent content wiping!
                  val = val.slice();
                }
                return decoder.CFF[fieldType.replace("CFF.",'')](val);
              }
              return decoder[fieldType](val);
            },
            // store values so that they're already encoded correctly
            set: function(v) {
              if(fieldType.indexOf("CFF.") === 0) {
                self.values[fieldName] = encoder.CFF[fieldType.replace("CFF.",'')](v);
              } else {
                if(fieldType === "LITERAL" && !v.toData) {
                  makeStructy(fieldName, v);
                }
                self.values[fieldName] = encoder[fieldType](v);
              }
            }
          });
          // ensure padding fields are always zero, rather than uninitialised
          if(fieldType === "PADDING1" || fieldType === "PADDING2" || fieldType === "PADDING3" || fieldType === "PADDING4") {
            self[fieldName] = 0;
          }
        }(record[0], record[1], record[2]));
      });
    },
    // only use the fields indicated
    use: function(fields) {
      var unused = Object.keys(this.fields).filter(function(f) {
        return fields.indexOf(f) === -1;
      });
      this.unset(unused);
    },
    // remove all the fields indicated
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
      var self = this,
          size = 0,
          fields = fieldName ? [fieldName] : Object.keys(this.fields);
      fields.forEach(function(fieldName) {
        var val = self.values[fieldName] ? self[fieldName] : false;
        var fieldType = self.fields[fieldName];
        if(fieldType.indexOf("CFF.") === 0) {
          size += sizeOf.CFF[fieldType.replace("CFF.",'')](val);
        } else {
          size += sizeOf[self.fields[fieldName]](val);
        }
      });
      return size;
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
          obj = {},
          keys = Object.keys(this.fields)
      keys.forEach(function(field) {
        var f = self[field];
        if(f instanceof Array) {
          if(f[0].toJSON) {
            obj[field] = f.toJSON();
          } else {
            obj[field] = f.slice();
          }
        }
        else if (f.toJSON) {
          obj[field] = f.toJSON();
        }
        else {
          obj[field] = f.toString();
        }
      });
      return obj;
    },
    toString: function() {
      return JSON.stringify(this.toJSON(), false, 2);
    },
    toHTML: function() {
      var self = this,
          obj = nodeBuilder.create("div"),
          keys = Object.keys(this.fields);
      obj.setAttribute("class", this.name);
      keys.forEach(function(field) {
        if (self[field].toHTML) {
          obj.appendChild(self[field].toHTML());
        } else {
          var d = nodeBuilder.create("div");
          d.setAttribute("class", field);
          d.setAttribute("data-value", self[field]);
          d.setAttribute("data-type", self.fields[field]);
          obj.appendChild(d);
        }
      });
      return obj;
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
            value: self[field],
            description: self.descriptions[field]
          });
        }
        offset += val.length;

        data = data.concat(val);
      });
      return data;
    }
  };

  return Struct;
})
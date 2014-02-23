define(["../struct",
  "./cmaps/format.0",
  "./cmaps/format.2",
  "./cmaps/format.4",
  "./cmaps/format.6",
  "./cmaps/format.8",
  "./cmaps/format.10",
  "./cmaps/format.12",
  "./cmaps/format.13",
  "./cmaps/format.14"
], function(Table, format0, format2, format4, format6, format8, format10, format12, format13, format14){
  "use strict";

  var cmap = function(input) {
    if(!this.parse(input)) {
      input = input || {};
      this.fill(input);
    }
  };

  cmap.prototype = new Table([
    // ...def goes here...
  ]);
  cmap.prototype.constructor = cmap;

  return cmap;
});

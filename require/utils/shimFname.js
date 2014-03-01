/**
 * function naming shim for browsers that don't have Function.name
 */
define(function shimIE() {
  "use strict";
	if (Function.prototype.name === undefined && Object.defineProperty !== undefined) {
    Object.defineProperty(Function.prototype, 'name', {
      get: function() {
        var funcNameRegex = /function\s+(.{1,})\s*\(/;
        var results = (funcNameRegex).exec((this).toString());
        return (results && results.length > 1) ? results[1] : "";
      },
      set: function(value) {}
    });
	}
});

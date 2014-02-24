define(["convertOutline"], function(convertOutline) {
  "use strict";

	return function(options) {

    // ensure we have all the necessary globals
    var globals = {
        outline: options.outline || ""
      , vendorId: " =) "
      , fontFamily: options.fontFamily || "Custom"
      , subFamily: options.subFamily || "Regular"
      , fontName: options.fontName || "Custom Glyph Font"
      , postscriptName: options.postscriptName || "customfont"
      , fontVersion: options.fontVersion || "Version 1.0"
      , copyright: options.copyright || "License-free"
      , trademark: options.trademark || "Trademark-free"
      , license: options.license || "License-free"
      , glyphName: options.glyphName || "~"
      , glyphCode: "~".charCodeAt(0)
      , quadSize: options.quadSize || 1024
      , label: options.label || false
      , identifier: options.identifier || "-"
      , minimal: options.minimal !== "undefined" ? options.minimal : false
      , compliant: options.compliant !== "undefined" ? options.compliant : true
      , letters: (function(globals) {
          var letters = ["~"];
          if(globals.label) {
            letters = [];
            globals.label.split('').forEach(function(l) {
              if(letters.indexOf(l) === -1) {
                letters.push(l);
              }
            });
            letters.push(String.fromCharCode(globals.glyphCode));
            letters.sort();
          }
          return letters;
        }(options))
    };

    // Turn the SVG outline into a charstring,
    // and ensure correct bounding values.
    convertOutline(globals);

		return globals;
	}
})
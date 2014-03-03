/**
 * Build our font, add it to the page as a webfont, and show its layout in table form.
 */
require(
  ["builder", "buildTables", "addStyleSheet", "addMappings"],
  function(builder, buildTables, addStyleSheet, addMappings) {
    "use strict";

    var y = -120;
    var outline = "M  20 "+(100 + y) + " L  20 "+(800 + y) + " 700 "+(800 + y) + " 700 "+(100 + y) + " 20 "+(100 + y)
               + " M 170 "+(250 + y) + " L 550 "+(250 + y) + " 550 "+(650 + y) + " 170 "+(650 + y);
    outline = outline.replace(/\s+/g,' ');
    document.getElementById("svg").innerHTML = outline;

    var options = {
      outline: outline,
      label: "custom",
      minimal: true
    };

    var font = builder.build(options);
    addStyleSheet(font, "customfont", "custom");
    var mappings = font.getMappings();
    buildTables(font, window, "#tables", "custom font", "The byte layout views for our small, custom font.");
    addMappings("#tables", mappings);
});

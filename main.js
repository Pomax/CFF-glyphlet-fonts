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
      minimal: false
    };

    var font = builder.build(options);
    addStyleSheet(font, "customfont", "custom");
    var mapper = font.getMapper();
    var addDownloads = true;

    buildTables(font, window, "#tables", "The byte layout views for our small, custom font.", addDownloads);
    addMappings("#tables", mapper.mappings);

    buildTables(font.stub["CFF "], window, "#CFF-table", "The byte layout views for our CFF table, specifically.");
    addMappings("#CFF-table", mapper.mappings, mapper.find("CFF  table").start);

    buildTables(font.stub["CFF "].header, window, "#cffheader", false, false, false, true);
    buildTables(font.stub["CFF "]["name index"], window, "#cffname", false, false, false, true);
    buildTables(font.stub["CFF "]["top dict index"], window, "#cfftopdict", false, false, false, true);
    buildTables(font.stub["CFF "]["string index"], window, "#cffstring", false, false, false, true);
    buildTables(font.stub["CFF "]["global subroutines"], window, "#cffgsubr", false, false, false, true);
    buildTables(font.stub["CFF "]["charset"], window, "#cffcharset", false, false, false, true);
    buildTables(font.stub["CFF "]["encoding"], window, "#cffencoding", false, false, false, true);
    buildTables(font.stub["CFF "]["charstring index"], window, "#cffcharstring", false, false, false, true);
    buildTables(font.stub["CFF "]["private dict"], window, "#cffprivate", false, false, false, true);

    // add the font to the page O_O
    var SFNTHTML = font.toHTML();
    document.getElementById("sfntstructure").appendChild(SFNTHTML);
  }
);

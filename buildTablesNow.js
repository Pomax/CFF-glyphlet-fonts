(function() {
  "use strict";

  // array to hex filter
  function asHex(v) {
     v = v.toString(16).toUpperCase();
     if(v.length === 1) v = "0" + v;
     return v;
  }

  // array to string filter
  function asChars(v) {
    return String.fromCharCode(v);
  }

  // array to HTML table function
  function makeTable(data, limit) {
    limit = limit || 16;
    var table = document.createElement("table");
    for(var i=0, end = data.length; i*limit<end; i++) {
      var row = document.createElement("tr");
      var prefix = document.createElement("td");
      prefix.innerHTML = (i*16)|0;
      prefix.style.background = "rgba(100,180,220,0.3)";
      prefix.style.textAlign = "right";
      row.appendChild(prefix)

      var entries = data.slice(limit*i, limit*(i+1));
      var addColumn = function(entry, pos) {
        var column = document.createElement("td");
        column.classList.add("b");
        if(entry !== "—") { column.classList.add("p"+pos); }
        column.innerHTML = entry;
        row.appendChild(column);
      };
      for(var j=0, last=Math.min(entries.length,limit); j<last; j++) {
        addColumn(entries[j], j+limit*i);
      }
      var len = 16 - entries.length;
      if(len>0) {
        (new Array(len+1)).join('—').split('').forEach(addColumn);
      }
      table.appendChild(row);
    }
    return table;
  }

  // create a query selector based on a mapping region
  function formQuery(mapping) {
    var qs = [];
    for(var s=mapping.start, e=mapping.end; s<e; s++) {
      qs.push(".p"+s);
    }
    return qs.join(",");
  }

  // set up the parallel color range mapping based on mouseover
  function setupMapping(color) {
    return function(mapping) {
      var query = formQuery(mapping);
      if(query) {
        var target = false;
        if(mapping.name.indexOf("table definition") > -1) {
          target = font.mappings.filter(function(m) {
            return m.name === mapping.name.replace("definition","data");
          })[0];
        }

        var nodelist = document.querySelectorAll(query);
        var highlight = function(e, override) {
          // TODO: make this nicely bordered looking
          e.style.background = typeof override === "string" ? override : color;
          e.title = mapping.name;
        };
        var restore = function(e) {
          e.style.background = e.getAttribute("data-background");
          e.removeAttribute("title");
        };
        var colorize = function(e) {
          e.setAttribute("data-background", e.style.background);
          e.addEventListener("mouseover", function(evt) {
            nodelist.array().forEach(highlight);
            if(target) {
              document.querySelectorAll(formQuery(target)).array().forEach(function(e3) {
                highlight(e3, "rgba(71, 175, 123, 0.2)");
              });
            }
          });
          e.addEventListener("mouseout", function(evt) {
            nodelist.array().forEach(restore);
            if(target) {
              document.querySelectorAll(formQuery(target)).array().forEach(function(e3) {
                restore(e3);
              });
            }
          });
        };
        nodelist.array().forEach(colorize);
      };
    };
  }

  // Build a font!
  var font = buildFont({
    outline: "M 20 20 L 20 1004 1004 1004 1004 20 Z",
    quadSize: 1024
  });

  // convert to legible data
  var binary = font.data;
  var hexmap = binary.map(asHex);
  var charmap = binary.map(asChars);
  document.body.appendChild(makeTable(hexmap));
  document.body.appendChild(makeTable(charmap));
  console.log("--- otf ---\n", hexmap.join(" "));

  // generate OFT and CFF region highlighting in the HTML tables
  var otf = font.mappings.filter(function(e) { return e.type !== "cff"; });
  var cff = font.mappings.filter(function(e) { return e.type === "cff"; });
  otf.forEach(setupMapping("rgba(71, 175, 123, 0.39)"));
  var cff_offset = otf.filter(function(e) { return e.name.indexOf("CFF") === 0; })[0].start;
  cff.forEach(function(mapping) {
    mapping.start += cff_offset;
    mapping.end += cff_offset;
    setupMapping("rgba(200,200,0,0.3)")(mapping);
  });

}());

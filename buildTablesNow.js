function buildTables(context, legible, selector, cssFontFamily, tableCaption) {
  "use strict";

  // top element
  var top = document.querySelector(selector);
  var create = function(v) { return document.createElement(v); };

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
    var tdCount = 0;
    var table = create("table");

    var toprow = create("tr");
    var cornercol = create("th");
    cornercol.style.border =  "none";
    toprow.appendChild(cornercol)
    for(var i=0; i< limit; i++) {
      var hcol = create("th");
      hcol.innerHTML = i.toString(16).toUpperCase();
      toprow.appendChild(hcol);
    }
    table.appendChild(toprow);

    for(var i=0, end = data.length; i*limit<end; i++) {
      var row = create("tr");
      var prefix = create("td");
      prefix.innerHTML = "0x" + ((i*16)|0).toString(16).toUpperCase();
      prefix.style.background = "rgba(100,180,220,0.3)";
      prefix.style.textAlign = "right";
      row.appendChild(prefix)

      var entries = data.slice(limit*i, limit*(i+1));
      var addColumn = function(entry, pos) {
        var column = create("td");
        column.classList.add("b");
        if(entry !== "—") { column.classList.add("p"+pos); }
        column.classList.add("c"+(tdCount++));
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

    var bottomrow = create("tr");
    var cornercol = create("th");
    cornercol.style.border =  "none";
    bottomrow.appendChild(cornercol)
    for(var i=0; i< limit; i++) {
      var hcol = create("th");
      hcol.innerHTML = i.toString(16).toUpperCase();
      bottomrow.appendChild(hcol);
    }
    table.appendChild(bottomrow);

    return table;
  }

  function formTables(font, hexmap, charmap) {
    top.classList.add("tables");
    top.appendChild(makeTable(hexmap));
    top.appendChild(makeTable(charmap));

    var downloads = create("div");
    downloads.classList.add("downloads");

    // plain .otf file
    var a = create("a");
    a.innerHTML = "download opentype font";
    a.download = "customfont.otf";
    a.href = "data:application/octet-stream;base64," + btoa(font.otf.map(asChars).join(''));
    downloads.appendChild(a);

    // browser-specific .wiff version
    a = create("a");
    a.innerHTML = "download as WOFF";
    a.download = "customfont.woff";
    a.href = "data:application/octet-stream;base64," + btoa(font.woff.map(asChars).join(''));
    downloads.appendChild(a);

    // for data enthusiasts, the .cff block without sfnt wrapper
    a = create("a");
    a.innerHTML = "download cff block";
    a.download = "customfont.cff";
    a.href = "data:application/octet-stream;base64," + btoa(font.cff.map(asChars).join(''));
    downloads.appendChild(a);

    top.appendChild(downloads);
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

        var nodelist = top.querySelectorAll(query);
        var highlight = function(e, override) {
          e.style.background = typeof override === "string" ? override : color;
          var name = mapping.name.replace(/\.+/g,'.').replace(/\.\[/g,'[');
          var value = mapping.value;
          if(value && value.replace) { value = value.replace(/\u0000/g,' 0x00 '); }
          var description = mapping.description;
          var dec = mapping.start+"-"+(mapping.end-1);
          var hex = mapping.start.toString(16).toUpperCase()+"-"+(mapping.end-1).toString(16).toUpperCase();
          e.title = name + (description? "\ndesc: " + description : '') + (value !== undefined? "\nvalue: " + value : '') + "\npos (dec): " + dec + "\npos (hex): " + hex;
        };
        var restore = function(e, last) {
          e.style.background = e.getAttribute("data-background");
          e.removeAttribute("title");
        };
        var colorize = function(e) {

          // specific event tracking
          if(!e.eventListeners) {
            e.eventListeners = {
              evtNames: [],
              add: function(evtName, fn) {
                if(!this[evtName]) {
                  this[evtName] = [];
                  this.evtNames.push(evtName);
                }
                e.addEventListener(evtName, fn, false);
                this[evtName].push(fn);
              },
              remove: function(evtName, fn) {
                e.removeEventListener(evtName, fn, false);
                this[evtName].splice(this[evtName].indexOf(fn),1);
                if(this[evtName].length === 0) {
                  this.evtNames.splice(this.evtNames.indexOf(evtName),1);
                }
              },
              cleanup: function() {
                var el = this;
                ["mouseover", "mouseout"].forEach(function(evtName) {
                  var list = el[evtName];
                  list.sort(function(a,b) {
                    a = a.mapping;
                    b = b.mapping;
                    return (b.end-b.start) - (a.end-a.start);
                  });
                  if(list.length > 2) {
                    var first = list.first(),
                       last =  list.last(),
                       i, fn;
                    for(i=list.length - 2; i > 0; i--) {
                      fn = list[i];
                      e.removeEventListener(evtName, fn);
                      list.splice(i,1);
                    }
                  }
                });
              }
            };
          }

          e.setAttribute("data-background", e.style.background);

          // mouse-over handling
          var moverfn = function moverfn(evt) {
            var show = (moverfn === e.eventListeners.mouseover.first() || moverfn === e.eventListeners.mouseover.last());
            nodelist.array().forEach(function(e2) { highlight(e2); });
            if(target) {
              top.querySelectorAll(formQuery(target)).array().forEach(function(e3) {
                highlight(e3, "rgba(71, 120, 175, 0.3)");
              });
            }
          };
          moverfn.mapping = mapping;
          e.eventListeners.add("mouseover", moverfn);

          // mouse-out handling
          var moutfn = function moutfn(evt) {
            nodelist.array().forEach(function(e2) { restore(e2); });
            if(target) {
              top.querySelectorAll(formQuery(target)).array().forEach(function(e3) {
                restore(e3);
              });
            }
          };
          moutfn.mapping = mapping;
          e.eventListeners.add("mouseout", moutfn);

        };
        nodelist.array().forEach(colorize);
      };
    };
  }

  function cleanupMappings() {
    var list = top.querySelectorAll(".tables td");
    list.array().forEach(function(e) {
      if(e.eventListeners) {
        e.eventListeners.cleanup();
      }
    });
  }

  // outline
  var y = -120;
  var outline = "M  20 "+(100 + y) + " L  20 "+(800 + y) + " 700 "+(800 + y) + " 700 "+(100 + y) + " 20 "+(100 + y)
              + "M 170 "+(250 + y) + " L 550 "+(250 + y) + " 550 "+(650 + y) + " 170 "+(650 + y);

  // normal full string, full table, with-GSUB version
  var big = {
      outline: outline
    , label: "custom"
    , glyphName: "custom"
    , fontFamily: "Custom Font"
    , subfamily: "Regular"
    , fontName: "Custom Glyph Font"
    , compactFontName: "customfont"
    , fontVersion: "Version 1.0"
  }

  // near-illegally-short version
  var small = {
      outline: outline
    , glyphName: "c"
    , fontFamily: "c"
    , subfamily: "c"
    , fontName: "c"
    , fontVersion: "1"
    , copyright: -1
    , trademark: -1
    , license: -1
  };

  var options = legible ? big : small;
  var font = buildFont(options);

  // work with resulting font:
  (function render() {
    var binary = font.otf;
    var hexmap = binary.map(asHex);
    var charmap = binary.map(asChars);
    formTables(font, hexmap, charmap);
  }());

  // generate OFT and CFF region highlighting in the HTML tables
  (function setupRegionHighlighting() {
    var otf = font.mappings.filter(function(e) { return e.type.indexOf("sfnt") > -1; });
    var cff = font.mappings.filter(function(e) { return e.type === "cff"; });
    otf.forEach(setupMapping("rgba(71, 175, 123, 0.39)"));

    // the most amazing magic
    var fields = font.mappings.filter(function(e) { return e.type === "field"; });
    fields.forEach(function(mapping) {
      setupMapping("rgba(0,0,200,0.3)")(mapping);
    });
    // remove everything except widest/narrowest mapping handlers
    cleanupMappings();
  }());

  // create stylesheet that uses this font
  (function addStylesheetToPage() {
    cssFontFamily = cssFontFamily || "custom font";
    var mime_otf = "font/opentype";
    var dataurl_otf = "data:" + mime_otf + ";base64," + btoa(font.otf.map(asChars).join(''));
    var mime_woff = "application/font-woff";
    var dataurl_woff = "data:" + mime_woff + ";base64," + btoa(font.woff.map(asChars).join(''));
    var fontface = ["@font-face {\n  font-family: '" + cssFontFamily + "';"
                   , "  font-weight: normal;"
                   , "  font-style: normal;"
                   , "  src: url('" +dataurl_otf+ "') format('opentype'),"
                   , "       url('" +dataurl_woff+ "') format('woff');"
                   , "}"].join("\n");
    var sheet = create("style");
    sheet.innerHTML = fontface;
    document.head.appendChild(sheet);
  }());
}

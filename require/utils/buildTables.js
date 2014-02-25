define(function() {
  "use strict";

  return function buildTables(font, context, legible, selector, cssFontFamily, tableCaption) {

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

    function formTables(hexmap, charmap) {
      top.classList.add("tables");
      top.appendChild(makeTable(hexmap));
      top.appendChild(makeTable(charmap));

      var downloads = create("div");
      downloads.classList.add("downloads");

      // plain .otf file
      var a = create("a");
      a.innerHTML = "download opentype font";
      a.download = "customfont.otf";
      a.href = "data:application/octet-stream;base64," + btoa(charmap.join(''));
      downloads.appendChild(a);

      top.appendChild(downloads);
    }

    var binary = font.toData();
    var hexmap = binary.map(asHex);
    var charmap = binary.map(asChars);
    formTables(hexmap, charmap);
  };

});


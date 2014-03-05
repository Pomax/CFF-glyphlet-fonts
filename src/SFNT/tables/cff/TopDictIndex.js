define(["struct", "CFFDict"], function(struct, CFFDict) {
  "use strict";

  var TopDictIndex = function(input) {
  	if(!this.parse(input)) {
      input = input || {};
      input.count = 1; // no choice: the top dict is simply 1 item
      this.fill(input);
  	}
  };

  var TopDictIndex = new struct([
      ["count",         "Card16", "top dicts store one 'thing' by definition"]
    , ["offSize",       "OffSize", "offsets use 1 bytes in this index"]
    , ["offset",        "LITERAL", ""]
    , ["top dict data", "LITERAL", ""]
  ]);

  return TopDictIndex;
});

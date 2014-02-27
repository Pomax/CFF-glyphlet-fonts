define(["struct", "dataBuilding"], function(Table, dataBuilder){
  "use strict";

  var encoder = dataBuilder.encoder,
      CHARARRAY = encoder.CHARARRAY,
      DICTINSTRUCTION = encoder.DICTINSTRUCTION,
      NUMBER = encoder.NUMBER,
      OPERAND = encoder.OPERAND,
      SID = encoder.SID,
      BYTE = encoder.BYTE,
      Card8 = encoder.Card8,
      Card16 = encoder.Card16,
      OffSize = encoder.OffSize,
      OffsetX = encoder.OffsetX,
      serialize = encoder.serialize;

  /***
   *
   * CFF DATA DESCRIPTION (See Adobe's technical note 5176)
   *
   **/

  // helper function
  var generateOffsets = function(records, size) {
    size = size || 1;
    var tally = 1,
        idx = 0,
        data= [],
        bytes;
    records.forEach(function(record) {
      data.push([""+idx++, OffsetX[size], "Offset "+idx, tally]);
      bytes = record[1](record[3]);
      tally += bytes.length;
    });
    data.push(["last", OffsetX[size], "last offset", tally]);
    return data;
  };


  // record the data mappings for HTML styling, etc.
  var recordMappings = function(cff) {
    var s = 0, e = 0, i=0;
    for(i=0; i<cff.length; i++) {
      s = e;
      e += serialize(cff[i]).length;
      //mapper.addMapping(cff[i][0], s, e, "cff");
    }
  };


  /**
   * This part sets up data that, as it is inserted, may require more
   * bytes to encode than initially guessed, and as such requires updating
   * the values already found in the Top DICT.
   */
  var processDynamicCFFData = function(cff, globals) {

    var cff_end = serialize(cff).length;
    var top_dict_data = cff[2][1][3][1];

    var glyphs = [["0", SID, "single entry array for our glyph, which is custom SID 4", 394]];
    if(globals.letters) {
      glyphs = globals.letters.map(function(letter, idx) {
        return [""+idx, SID, "SID for letter "+letter, 394 + idx];
      });
    }

    var charset = ["charset", [
      ["format", BYTE, "we use the simplest format", 0]
    , ["glyphs", glyphs]
    ]];

    var codes = [];//["0", BYTE, "encoding for glyph 0", 0]];
    if(globals.letters) {
      codes = codes.concat(globals.letters.map(function(letter, idx) {
        return [""+idx, BYTE, "encoding for glyph "+idx+" ("+letter+")", idx+1];
      }));
    } else { codes.push(["1", BYTE, "encoding for glyph 1", 1]); }

    var encoding = ["encoding", [
      ["format", BYTE, "we use the encoding best suited for randomly ordered glyphs", 0]
    , ["nCodes", BYTE, "number of encoded glyphs (not counting .notdef)", codes.length]
    , ["codes", codes]
    ]];

    var charstrings = [[".notdef", DICTINSTRUCTION, "the outline for .notdef", OPERAND(14)]];
    if(globals.letters) {
      globals.letters.forEach(function(letter, idx) {
        if(idx < globals.letters.length-1) {
          charstrings.push([letter, DICTINSTRUCTION, "the outline for "+letter, OPERAND(14)]);
        }
      });
    }
    charstrings.push(["our letter", DICTINSTRUCTION, "the outline for our own glyph", globals.charString]);

    var charstring_raw = serialize(charstrings);
    var charstring_offsize = charstring_raw.length > 255 ? 2 : 1;
    var charstring_index = ["charstring index", [
      // this is the part that actually contains the characters outline data,
      // encoded as Type 2 charstrings (one charstring per glyph).
      ["count", Card16, "how many charstrings? (including .notdef", charstrings.length],
    , ["offSize", OffSize, "how many bytes do we need for offsets?", charstring_offsize]
    , ["offset", generateOffsets(charstrings, charstring_offsize)]
    , ["charstrings", charstrings]
    ]];

    var private_dict = ["private dict", [
      ["BlueValues", DICTINSTRUCTION, "empty array (see Type 1 font format, pp 37)",
        NUMBER(0).concat(NUMBER(0)).concat(OPERAND(6))
      ]
    , ["FamilyBlues", DICTINSTRUCTION, "idem dito",
        NUMBER(0).concat(NUMBER(0)).concat(OPERAND(8))
      ]
    , ["StdHW", DICTINSTRUCTION, "dominant horizontal stem width. We set it to 10",
        NUMBER(10).concat(OPERAND(10))
      ]
    , ["StdVW", DICTINSTRUCTION, "dominant vertical stem width. We set it to 10",
        NUMBER(10).concat(OPERAND(11))
      ]
      // forgetting the following two versions breaks Chrome. This is quite
      // interesting, as Chrome and Firefox both supposedly use OTS for their
      // sanitization. This is, in fact, so interesting that it gives us a
      // good test case for font-compatibility of browsers.
    , ["defaultWidthX", DICTINSTRUCTION, "default glyph width",
        NUMBER(globals.xMax).concat(OPERAND(20))
      ]
    , ["nominalWidthX", DICTINSTRUCTION, "nominal width used in width correction",
        NUMBER(globals.xMax).concat(OPERAND(20))
      ]
    ]];

    var private_dict_length = serialize(private_dict).length;

    // tentatively figure out the offsets for each block
    var charset_offset = cff_end,
        encoding_offset = charset_offset + serialize(charset).length,
        charstring_index_offset = encoding_offset + serialize(encoding).length,
        private_dict_offset = charstring_index_offset + serialize(charstring_index).length;

    // if we need to encode these values, how many bytes would they take up?
    // We assumed 1 + 1 + 2 in the top dict. We need to check if we were, and
    // then by how much. However, because updating the number of bytes
    // necessary to encode the values also increases the values (since they
    // represent offset) we need to recompute until stable.
    var bytediff = 0;
    (function setRecordValues() {
      var byteCount,
          oldCount = 5,
          shift = 0,
          getByteCount = function() {
            byteCount = NUMBER(charset_offset)
                       .concat(NUMBER(encoding_offset))
                       .concat(NUMBER(charstring_index_offset))
                       .concat(NUMBER(private_dict_length))
                       .concat(NUMBER(private_dict_offset))
                       .length;
            return byteCount;
          };

      while(getByteCount() > oldCount) {
        shift = byteCount - oldCount;
        oldCount = byteCount;
        bytediff += shift;
        charset_offset += shift;
        encoding_offset += shift;
        charstring_index_offset += shift;
        private_dict_offset += shift;
      }
    }());

    // With our stable offsets, update the charset, charstrings, and
    // private dict offset values in the top dict data block
    top_dict_data[6][3] = NUMBER(charset_offset).concat(OPERAND(15));
    top_dict_data[7][3] = NUMBER(encoding_offset).concat(OPERAND(16));
    top_dict_data[8][3] = NUMBER(charstring_index_offset).concat(OPERAND(17));
    top_dict_data[9][3] = NUMBER(private_dict_length).concat(NUMBER(private_dict_offset)).concat(OPERAND(18));

    // and of course, also update the top dict index's "last" offset, as that might be invalid now, too.
    cff[2][1][2][1][1][3] += bytediff;

    cff.push(charset);
    cff.push(encoding);
    cff.push(charstring_index);
    cff.push(private_dict);
  };


  var createCFF = function(globals) {
    // be mindful of the fact that there are 390 predefined strings (see appendix A, pp 29)
    var strings = [
        ["version", CHARARRAY, "font version string; string id 391", globals.fontVersion]
      , ["full name", CHARARRAY, "the font's full name (id 392)", globals.fontName]
      , ["family name", CHARARRAY, "the font family name (id 393)", globals.fontFamily]
    ];

    if(globals.letters) {
      globals.letters.forEach(function(letter, idx) {
        if(idx < globals.letters.length) {
          strings.push([letter, CHARARRAY, "the letter "+letter+ " (id "+(394+idx)+")", letter]);
        }
      });
    } else { strings.push(["our glyph", CHARARRAY, "our custom glyph (id 394)", globals.glyphName]); }

    // the top dict contains "global" metadata
    var top_dict_data = [
        ["version", DICTINSTRUCTION, "", NUMBER(391).concat(OPERAND(0))]
      , ["full name", DICTINSTRUCTION, "", NUMBER(392).concat(OPERAND(2))]
      , ["family name", DICTINSTRUCTION, "", NUMBER(393).concat(OPERAND(3))]
      , ["weight", DICTINSTRUCTION, "", NUMBER(389).concat(OPERAND(4))]
      , ["uniqueID", DICTINSTRUCTION, "", NUMBER(1).concat(OPERAND(13))]
      , ["FontBBox", DICTINSTRUCTION, "",
          NUMBER(globals.xMin).concat(NUMBER(globals.yMin)).concat(NUMBER(globals.xMax)).concat(NUMBER(globals.yMax)).concat(OPERAND(5))
        ]
        // these instruction can't be properly asserted until after we pack up the CFF, so we use placeholder values
      , ["charset", DICTINSTRUCTION, "offset to charset (from start of file)", [0x00, 0x00]]
      , ["encoding", DICTINSTRUCTION, "offset to encoding (from start of file)", [0x00, 0x00]]
      , ["charstrings", DICTINSTRUCTION, "offset to charstrings (from start of file)", [0x00, 0x00]]
      , ["private", DICTINSTRUCTION, "'size of', then 'offset to' (from start of file) the private dict", [0x00, 0x00, 0x00]
    ]];

    var top_dict_offsize = serialize(top_dict_data).length < 255 ? 1 : 2;

    // our main CFF block
    var absolute_offset_size = 1; // we set this to the correct value at the end
    var cff = [
      ["header", [
          ["major", Card8, "major version", 1]
        , ["minor", Card8, "minor version", 0]
        , ["length", Card8, "header length in bytes", 4]
        , ["offSize", OffSize, "how many bytes for an offset value?", absolute_offset_size]
      ]],
      ["name index", [
          ["count", Card16, "number of stored names (We only have one)", 1]
        , ["offSize", OffSize, "offsets use 1 byte", 1]
          // there are (count+1) offsets: the first offset is always 1, and the last offset marks the end of the table
        , ["offset", [
            ["0", OffsetX[1], "first offset, relative to the byte preceding the data block", 1]
          , ["1", OffsetX[1], "offset to end of the data block", (1 + "customfont".length)]]]
          // object data
        , ["data", CHARARRAY, "we only include one name, namely the compact font name", globals.postscriptName]
          // fun fact: the postscriptName must be at least 10 characters long before Firefox accepts the font
      ]],
      ["top dict index", [
          ["count", Card16, "top dicts store one 'thing' by definition", 1]
        , ["offSize", OffSize, "offsets use 1 bytes in this index", top_dict_offsize]
        , ["offset", [
            ["0", OffsetX[top_dict_offsize], "first offset", 1]
          , ["1", OffsetX[top_dict_offsize], "end of data black", 1 + serialize(top_dict_data).length]
        ]]
        , ["top dict data", top_dict_data]
      ]],
      ["string index", [
          ["count", Card16, "number of stored strings", strings.length]
        , ["offSize", OffSize, "offsets use 1 byte", 1]
        , ["offset", generateOffsets(strings, 1)]
        , ["strings", strings]
      ]],
      ["global subroutine index", [
          ["count", Card16, "no global subroutines, so count is 0 and there are no further index values", 0]
      ]]
    ];

    processDynamicCFFData(cff, globals);
    recordMappings(cff);

    // fix the "absolute_offset_size" value
    var serialized = serialize(cff);
    cff[0][1][3][3] = (function getBytesNeeded(v) {
      var bits = Math.log(v)/Math.log(2);
      return Math.ceil(bits/8);
    }(serialized.length));

    return cff;
  };


  /***
   *
   * CFF require.js object
   *
   **/


  var CFF = function(globals) {
    var input;
    if(!this.parse(input)) {
      input = input || {};
      this.fill(input);
      var CFFStruct = createCFF(globals)
      this.datablock = serialize(CFFStruct);
    }
  };

  CFF.prototype = new Table([
    ["datablock", "LITERAL", "we're not going to do this as a struct build-up right now."]
  ]);

  CFF.prototype.constructor = CFF;

  return CFF;

});

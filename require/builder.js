define(["SFNT", "formGlobals", "shimie"], function(SFNT, formGlobals) {
  "use strict";

  return {
  	build: function (options) {
	    var sfnt = new SFNT();
	    sfnt.use(["CFF ","OS/2","cmap","head","hhea","hmtx","maxp","name","post"]);
      var font = sfnt.stub;
      var globals = formGlobals(options);


      // Right. Let's start create a font by defining its tables,
      // rather than using a font design tool to do that for us.


      /**
       * Font header
       */
      font.head = new font.head({
        version: 0x00010000,
        fontRevision: 0x00010000,
        checkSumAdjustment: 0,
        magicNumber: 0x5F0F3CF5,
        // see http://www.microsoft.com/typography/otspec/head.htm, "flags" section
        flags: 0,
        unitsPerEM: globals.quadSize,
        created: 0,
        modified: 0,
        xMin: globals.xMin,
        yMin: globals.yMin,
        xMax: globals.xMax,
        yMax: globals.yMax,
        macStyle: 0,
        lowestRecPPEM: 8,
        fontDirectionHint: 2,
        // these two values do not apply to CFF fonts, yet are still necessary
        indexToLocFormat: 0,
        glyphDataFormat: 0
      });


      /**
       * Horizontal metrics header table
       */
      font.hhea = new font.hhea({
        version: 0x00010000,
        Ascender: globals.quadSize + globals.yMin,
        Descender: -(globals.quadSize - globals.yMax),
        LineGap: 0,
        advanceWidthMax: globals.xMax - globals.xMin,
        minLeftSideBearing: 0,
        minRightSideBearing: 0,
        xMaxExtent: globals.xMax - globals.xMin,
        caretSlopeRise: 0,
        caretSlopeRun: 0,
        caretOffset: 0,
        metricDataFormat: 0,
        numberOfHMetrics: globals.letters ? 1 + globals.letters.length : 2
      });

      /**
       * Horizontal metrics table
       */
      font.hmtx = new font.hmtx(globals, font.hhea.numberOfHMetrics);


      /**
       * Max profiles - CFF does not use these, which we indicate by
       * using a table version 0.5
       */
      font.maxp = new font.maxp({
        version: 0x00005000,
        numGlyphs: globals.letters ? 1 + globals.letters.length : 2
      });


      /**
       * The name table
       *
       * - to have a font be windows installable, we need strings 1, 2, 3, and 6.
       * - to have a font be OSX installable, we need strings 1, 2, 3, 4, 5, and 6.
       * - to have a font be webfont-usable, we just need strings 1 and 2.
       *
       * (OTS may be patched at some point to not even check the name table at
       *  all, at which point we don't have to bother generating it for webfonts)
       */
      font.name = new font.name(globals);


      /**
       * The OS/2 table
       */
      font["OS/2"] = new font["OS/2"]({
        // we use version 3, so we can pass Microsoft's "Font Validator"
        version: 0x0003,
        xAvgCharWidth: 0,
        usWeightClass: 400,
        usWidthClass: 1,
        fsType: 0,
          // we don't really care about the sub/super/strikeout values:
        ySubscriptXSize: 0,
        ySubscriptYSize: 0,
        ySubscriptXOffset: 0,
        ySubscriptYOffset: 0,
        ySuperscriptXSize: 0,
        ySuperscriptYSize: 0,
        ySuperscriptXOffset: 0,
        ySuperscriptYOffset: 0,
        yStrikeoutSize: 0,
        yStrikeoutPosition: 0,
        // standard font = font classification 0 ("Regular")
        sFamilyClass: 0,
        // Oh look! A trademarked classification system the bytes
        // for which cannot be legally set unless you pay HP.
        // Why this is part of the OS/2 table instead of its own
        // proprietary table I will likely never truly know.
        bFamilyType: 0,
        bSerifStyle: 0,
        bWeight: 0,
        bProportion: 0,
        bContrast: 0,
        bStrokeVariation: 0,
        bArmStyle: 0,
        bLetterform: 0,
        bMidline: 0,
        bXHeight: 0,
        // we only encode the letter 'A' in the latin block,
        // so we set bit 1 of a 128 bit sequence
        ulUnicodeRange1: 0x00000001,
        ulUnicodeRange2: 0,
        ulUnicodeRange3: 0,
        ulUnicodeRange4: 0,
        achVendID: globals.vendorId,
        // font selection flag: bit 6 (lsb=0) is high, to indicate 'regular font'
        fsSelection: 0x0040,
        usFirstCharIndex: globals.label ? globals.letters[0].charCodeAt(0) : globals.glyphCode,
        usLastCharIndex: globals.glyphCode,
        // vertical metrics: see http://typophile.com/node/13081 for how the hell these work.
        // (short version: they don't, it's an amazing mess)
        sTypoAscender: globals.yMax,
        sTypoDescender: globals.yMin,
        sTypoLineGap: globals.quadSize - globals.yMax + globals.yMin,
        usWinAscent: globals.quadSize + globals.yMin,
        usWinDescent: (globals.quadSize - globals.yMax),
        ulCodePageRange1: 0x00000001,
        ulCodePageRange2: 0,
        // We don't care all too much about the next 5 values, but they're
        // required for an OS/2 version 2, 3, or 4 table.
        sxHeight: 0,
        sCapHeight: 0,
        usDefaultChar: 0,
        // we have no break char, but we must point to a "not .notdef" glyphid to
        // validate as "legal font". Normally this would be the 'space' glyphid.
        usBreakChar: globals.glyphCode,
        // We have plain + ligature use, therefore the max length of
        // all contexts are simply the length of our substitution label,
        // if we have one, or otherwise zero.
        usMaxContext: globals.label !== false ? globals.label.length : 0
      });


      /**
       * The post table -- this table should not be necessary for
       * webfonts, but for now must be included for the font to be legal.
       */
      font.post = new font.post({
        version: 0x00030000,
        italicAngle: 0,
        underlinePosition: 0,
        underlineThickness: 0,
        isFixedPitch: 1,
        minMemType42: 0,
        maxMemType42: 0,
        minMemType1: 0,
        maxMemType1: 0
      });


      /**
       * The character map for this font, using a cmap
       * format 4 subtable for our implemented glyphs.
       */
      font.cmap = new font.cmap({ version: 0 });
      font.cmap.addTable({ format: 4, letters: globals.letters });
      font.cmap.finalise();


      /**
       * The CFF table for this font. This is, ironically,
       * the actual font, rather than a million different
       * bits of metadata *about* the font and its glyphs.
       *
       * It's also the most complex bit (closely followed
       * by the GSUB table for ligature substitution), which
       * is why the CFF table isn't actually a struct, but
       * a somewhat different bytecode generator.
       */
      font["CFF "] = new font["CFF "](globals);


      /**
       * Finally, if there was a "label", we need some GSUB magic
       */
//      if(globals.label) { font.GSUB = new font.GSUB(globals); }

      // we're done.
      return sfnt;
	  }
  };

});

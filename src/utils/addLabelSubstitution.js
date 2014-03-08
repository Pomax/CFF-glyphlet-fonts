define(function() {
	return function addLabelSubstitution(font, globals) {
    if(globals.label) {
      font.GSUB = new font.GSUB(globals);

      // step 1: add a ligature lookup. This takes a bit of work.
      //         Also note this is now just a "loose" lookup.

      var inputs = globals.letters.slice();
      inputs.splice(0,1);
      inputs.splice(inputs.length-1,1);

      // GSUB lookup type 4 is for the "many-to-one substitution" effect
      var lookup = font.GSUB.addLookup({ LookupType: 4 });

      var subtable = lookup.addSubTable();

      // this defines the distinct starting letters for one
      // or more ligatures that are used in the font.
      var converage = subtable.addCoverage({
        format: 2,
        startGlyphs: [
          globals.letters.indexOf(globals.label[0]) + 1 // offset for .notdef
        ]
      });

      var ligatureSet = subtable.addLigatureSet();

      // ultimately, this is the thing we really care about:
      var ligatureTable = ligatureSet.addLigatureTable({
        LigGlyph: globals.letters.length,
        Components: globals.label.split('').slice(1).map(function(v) {
                      return globals.letters.indexOf(v) + 1;
                    })
                    // we don't need letters[0] because the coverage table will imply the first letter in the ligature
      });

      // step 2: wrap this lookup as a ligature feature. This feature
      //         is also just a "loose" feature, but at least we now
      //         know that it's a ligature feature.

      var feature = font.GSUB.addFeature({ FeatureTag: "liga", lookups: [lookup] });

      // step 3: now say for which script(s) this feature should kick in.
      //         This requires first defining a language systam, and then
      //         for that language system, defining one or more scripts
      //         to use our feature. Yeah: this is extremely graphy.

      var singleLangSys = font.GSUB.makeLangSys({ features: [feature] });
      font.GSUB.addScript({ ScriptTag: "DFLT", LangSysTables: [singleLangSys] });
      font.GSUB.addScript({ ScriptTag: "latn", LangSysTables: [singleLangSys] });

      // Now, wasn't that fun? Step last: make all these bindings stick.
      font.GSUB.finalise();
    }
  };
});

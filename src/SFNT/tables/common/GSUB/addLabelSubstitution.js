/**
 * Substitution tables are hilariously complex, due to OpenType's concept
 * of scripts, language systems, features, and lookups.
 *
 * Lookups and Features live on "heaps", with features being instructions
 * to transform one or more letters somehow, and lookups being specific
 * algorithms for performing those transforms.
 *
 * Features generally have a fixed list of lookups they might point to,
 * but (in part because there can be multiple features that do the same
 * thing, roughly) a lookup can be used by more than one feature. As
 * such, the feature:lookup relation is many-to-many.
 *
 * Scripts and language systems are a way to deal with the complexity
 * of the real world. A script models a particular writing system
 * (latin, arabic, japanese, etc, as well as the special "default")
 * and this writing system may or may not apply to more than one
 * language (latin, for instance, can be french, english, turkist,
 * vietnamese, and so on).
 *
 * As each of these language systems have different rules when it comes
 * to combining accents, forming ligatures, applying punctuation, and
 * more such things, different language systems have different feature
 * requirements, although some languages will share certain features.
 * (for instance, how to align basic punctuation like commas and full
 * stops).
 *
 * So, the language:feature relation, too, is manu-to-many.
 *
 * Finally, the script:language relation is one-to-many.
 *
 */
define(function() {
	return function addLabelSubstitution(font, globals) {

    // step 1: add a ligature lookup. This takes a bit of work.
    //         Also note this is now just a "loose" lookup on
    //         the heap of lookups.

    var inputs = globals.letters.slice();
    inputs.splice(0,1);
    inputs.splice(inputs.length-1,1);


    // step 1a: in order to set up a "multiple letters become one letter"
    //          substitution, we need to create a GSUB "type 4" lookup, which
    //          models the "many-to-one substitution" effect.
    var lookup = font.GSUB.addLookup({ LookupType: 4 });
    var subtable = lookup.addSubTable();


    // step 1b: In order to define a substitution lookup, we need to
    //          list all the letters for which substitutions are going
    //          to be necessary. If we're going to substitute "fl" with
    //          something, as well as "etc" with something, this coverage
    //          list would be ['e', 'f'], for instance. We're only
    //          substituting "custom", so our list is just ['c'].
    subtable.addCoverage([
      globals.letters.indexOf(globals.label[0]) + 1 // offset for .notdef
    ]);


    // step 1c: substitutions use ligature sets.
    var ligatureSet = subtable.addLigatureSet();


    // step 1d: because the ligature sets go in the ligature table: the bit
    //          that, ultimately, does the work for us.
    var ligatureTable = ligatureSet.addLigatureTable({
      LigGlyph: globals.letters.length,
      Components: globals.label.split('').slice(1).map(function(v) {
                    return globals.letters.indexOf(v) + 1;
                  })
                  // We don't need letters[0] because the coverage table will
                  // imply the first letter in the ligature
    });


    // step 2: wrap this ligature lookup with a ligature feature. This feature
    //         is also just a "loose" feature on the heap of features.

    var feature = font.GSUB.addFeature({ FeatureTag: "liga", lookups: [lookup] });


    // step 3: Now we need to say which language systems this features
    //         is actually used by. We just go with a single language
    //         system, because we only need one...

    var langSysTable = font.GSUB.makeLangSys({ features: [feature] });


    // step 4: And then we say which scripts our language system applies to.
    //         In this case we use the default (=DFLT) script, as well as
    //         the latin (=latn) script, because our font uses ascii.
    //         And yes: this is extremely graphy.

    font.GSUB.addScript({ ScriptTag: "DFLT", LangSysTables: [langSysTable] });
    font.GSUB.addScript({ ScriptTag: "latn", LangSysTables: [langSysTable] });


    // Now, wasn't that fun? Step last: make all these bindings stick.
    font.GSUB.finalise();
  };
});

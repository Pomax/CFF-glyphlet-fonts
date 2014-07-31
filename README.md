The aim of this repo is to create a small JavaScript thing that
can turn outline data for "a letter" into a tiny OpenType font
using CFF for the glyph model (because CFF does Type2 charstrings,
which model curves with cubic beziers, unlike TFF, which can only
do quadratic beziers. Which are properly nonsense for design work).

The idea is to supply the builder function with a structure similar
to an SVG (compound) path, and get a BASE64-encoded OTF back for
use in an @font-face src property. Define outline, load in, apply
to single letter.

The code can be built with `node r.js -o build` (windows users will
probably need to do something stupid like `node c:\Users\YourNameHere\AppData\Roaming\npm\node_modules\requirejs\bin\r.js -o build.js`
because r.js was not packaged as nicely as npm or browserify)


Why is this useful? What a silly question.

 - Pomax

 live version: http://pomax.github.io/CFF-glyphlet-fonts


PS: this code is public domain, except in jurisdictions that do not
recognise the concept of a public domain. For these jurisdictions,
the license is an "MIT with the overruling stipulation that the
code is still public domain outside your judicial borders".

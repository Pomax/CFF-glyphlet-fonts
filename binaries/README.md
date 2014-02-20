A brief explanation:

  These three files are the most current "working" CFF and OTF
  fonts based on the work on this page. They are unlikely to
  work "as fonts", although they should work as webfonts.
  They should all validate through tx, TTX, and Microsoft's
  "Font Validator" utilities.

  These files are auto-generated through the "compile.js"
  script in the base dir. Run with $> node compile to generate
  a fresh set of font files.

Files provided:

  customfont.cff  - CFF-only data block
  customfont.otf  - OpenType font with embedded CFF data block
  customfont.ttx  - The .otf unpacked to human-readable XML by TTX
  customfont.woff - WOFF-wrapped version of Customfont.otf
  test.html       - a test page that tries to apply the .otf and .woff

  The "with GSUB" dir contains the same files as generated with
  GSUB ligature substitution baked in; the font does not implement
  outlines for the ligature's component glyphs, but implements
  the ligature glyph, and the rules for performing the ligature
  substitution.

Legal nonsense:

  For those burdened by lawyers, these fonts are license-free,
  and supplied as-is. I am not responsibility for what you do
  with these files, or what that leads to. Although I might like
  to know about it if you do something particularly cool with them.

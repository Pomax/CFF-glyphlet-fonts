define(["asChars", "toWOFF"], function(asChars, toWOFF) {

	return function addStyleSheet(font, fontFamily, className) {
    // set up the .otf and .woff rules
    fontFamily = fontFamily || "custom font";
    var mime_otf = "font/opentype";
    var dataurl_otf = "data:" + mime_otf + ";base64," + btoa(font.toData().map(asChars).join(''));
    var mime_woff = "application/font-woff";
    var dataurl_woff = "data:" + mime_woff + ";base64," + btoa(toWOFF(font).map(asChars).join(''));
    var fontface = ["@font-face {\n  font-family: '" + fontFamily + "';"
                   , "  src: url('" +dataurl_otf+ "') format('opentype'),"
                   , "       url('" +dataurl_woff+ "') format('woff');"
                   , "}"].join("\n");

    // without this, Chrome and IE fail to render GSUB ligatures
    var cssClass = [""
      , "." + className + " {"
      , "  font-family: '" + fontFamily + "';"
      , "  -webkit-font-feature-settings: 'liga';"
      , "  -moz-font-feature-settings: 'liga=1';"
      , "  -moz-font-feature-settings: 'liga';"
      , "  -ms-font-feature-settings: 'liga' 1;"
      , "  -o-font-feature-settings: 'liga';"
      , "  font-feature-settings: 'liga';"
      , "}"].join("\n");
    fontface += cssClass;

    // inject stylesheet
    var sheet = document.createElement("style");
    sheet.innerHTML = fontface;
    document.head.appendChild(sheet);
	};
});

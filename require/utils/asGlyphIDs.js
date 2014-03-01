define(["dataBuilding"], function(dataBuilder) {
	var GlyphID = dataBuilder.encoder.GlyphID;
	return function asGlyphIDs(v) {
		return GlyphID(v.charCodeAt(0));
	};
});

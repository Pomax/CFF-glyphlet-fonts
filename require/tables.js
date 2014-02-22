/**
 * just to make life easier
 */
define([
  "tables/cff_",
  "tables/cmap",
  "tables/head",
  "tables/hhea",
  "tables/hmtx",
  "tables/maxp",
  "tables/name",
  "tables/OS_2",
  "tables/post",
  "tables/common/GSUB",
  "tables/common/GPOS",
  "tables/common/GDEF",
  "tables/common/JSTF",
  "tables/common/BASE"
],
function(cff, cmap, head, hhea, hmtx, maxp, name, OS_2, post, GSUB, GPOS, GDEF, JSTF, BASE) {
  return {
    cff: cff,
    cmap: cmap,
    head: head,
    hhea: hhea,
    hmtx: hmtx,
    maxp: maxp,
    name: name,
    OS_2: OS_2,
    post: post,
    GSUB: GSUB,
    GPOS: GPOS,
    GDEF: GDEF,
    JSTF: JSTF,
    BASE: BASE
  };
});

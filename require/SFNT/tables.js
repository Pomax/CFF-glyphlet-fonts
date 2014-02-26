/**
 * just to make life easier
 */
define([
  "tables/CFF_",
  "tables/cmap",
  "tables/head",
  "tables/hhea",
  "tables/hmtx",
  "tables/maxp",
  "tables/name",
  "tables/OS_2",
  "tables/post",
  "tables/GSUB",
  "tables/GPOS",
  "tables/GDEF",
  "tables/JSTF",
  "tables/BASE"
],
function(CFF, cmap, head, hhea, hmtx, maxp, name, OS_2, post, GSUB, GPOS, GDEF, JSTF, BASE) {
  "use strict";

  return {
    CFF: CFF,
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

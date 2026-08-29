/**
 * The one frame treatment every non-full-bleed photograph on the site uses.
 *
 * It lives in a constant rather than being retyped per section because the
 * inconsistency was visible: the portrait sat in a soft-shadowed rounded card
 * while the plate comparison sat in a flat bordered box, and a page whose
 * photographs are framed three different ways reads as unfinished no matter
 * how good the photographs are.
 *
 * Values are the portrait's, which was the established treatment on the
 * approved design — this unifies the others onto it rather than inventing a
 * fourth style.
 *
 * Full-bleed images (the not-medication band, the consult-desk divider) do
 * NOT take this: they run edge to edge by design, and a radius or ring on a
 * bleed is a contradiction.
 */
export const PHOTO_FRAME =
  "overflow-hidden rounded-[1.75rem] ring-1 ring-secondary shadow-[0_30px_70px_-30px_rgba(23,35,59,0.35)]";

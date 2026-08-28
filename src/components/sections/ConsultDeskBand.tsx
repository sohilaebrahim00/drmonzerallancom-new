import { Photo } from "@/components/common/Photo";

/**
 * A full-bleed breathing space between two sections.
 *
 * Rendered at the file's NATIVE 1600x730 proportion. The crop is deliberate —
 * it was made to this shape — so there is no object-cover in a taller box
 * here: that would re-crop it and reintroduce exactly what the framing
 * removed. The aspect-ratio box scales the whole frame instead of cutting it.
 *
 * Not mirrored in RTL: a desk, a notebook and a chair carry no left-to-right
 * argument, unlike the not-medication band.
 */
export function ConsultDeskBand() {
  return (
    <section aria-hidden="true" className="relative w-full overflow-hidden">
      <Photo
        base="/images/consult-desk"
        width={1600}
        height={730}
        alt=""
        decorative
        className="block w-full"
        imgClassName="w-full h-auto aspect-[1600/730] object-contain"
        sizes="100vw"
      />
    </section>
  );
}

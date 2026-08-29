import { Photo } from "@/components/common/Photo";

/**
 * A full-bleed divider between two sections. A divider, not a section — it
 * carries no copy and is never the reason someone stops scrolling.
 *
 * Sized by HEIGHT, not by width: `clamp(180px, 24vw, 320px)`, capped at 320px
 * on every screen. Width-driven sizing was the bug — a 2.19:1 box at
 * `width: 100%` is 657px tall at a 1440px viewport and over 1100px on a wide
 * monitor, which turned a divider into a full screen of photograph and
 * upscaled the 1600px file well past its native width.
 *
 * `object-cover` is right HERE, unlike a framed photo: the band is wider than
 * 2.19:1 on most screens once the height is clamped, so the crop takes a
 * little off the left and right of an already-wide frame rather than
 * re-cropping the deliberate top-and-bottom framing.
 *
 * Not mirrored in RTL: a desk, a notebook and a chair carry no left-to-right
 * argument, unlike the not-medication band.
 */
export function ConsultDeskBand() {
  return (
    <div aria-hidden="true" className="w-full overflow-hidden">
      <Photo
        base="/images/consult-desk"
        width={1600}
        height={730}
        alt=""
        decorative
        className="block h-[clamp(180px,24vw,320px)] w-full"
        imgClassName="h-full w-full object-cover object-center"
        sizes="100vw"
      />
    </div>
  );
}

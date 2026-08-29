/**
 * One way to put a photograph on the page, so every image obeys the same
 * rules (Phase 9.4).
 *
 * - <picture> with a WebP source and a JPEG <img> fallback
 * - width/height ALWAYS set, so the box is reserved before the file lands.
 *   Without them the page reflows image by image, which is the most
 *   noticeable way photographs make a site feel worse rather than better.
 * - lazy + async by default; `priority` flips the first in-viewport image to
 *   eager + fetchpriority=high.
 * - `decorative` renders empty alt + aria-hidden, for images whose meaning is
 *   already carried by adjacent text.
 *
 * TODO(phase-8): `alt` should come from the i18n dictionaries like any other
 * string once bilingual support lands. English only for now.
 */
export interface PhotoProps {
  /** Path without extension, e.g. "/images/plate-before". */
  base: string;
  width: number;
  height: number;
  alt: string;
  className?: string;
  imgClassName?: string;
  /** First image in the viewport: eager + high priority instead of lazy. */
  priority?: boolean;
  /** Meaning carried by neighbouring text — renders alt="" aria-hidden. */
  decorative?: boolean;
  /**
   * Optional narrow-screen crop, given as a path without extension like
   * `base`. Both a WebP and a JPEG source are emitted for it, so a browser
   * without WebP support still gets the phone-sized file rather than falling
   * all the way back to the wide one.
   */
  mobileSource?: { base: string; media: string };
  sizes?: string;
}

export function Photo({
  base,
  width,
  height,
  alt,
  className,
  imgClassName,
  priority = false,
  decorative = false,
  mobileSource,
  sizes,
}: PhotoProps) {
  return (
    <picture className={className}>
      {/* Order is the selection algorithm: the browser takes the FIRST source
          whose media and type it can use, so narrow-screen candidates must
          precede the wide ones, and WebP must precede JPEG within each pair. */}
      {mobileSource && (
        <source media={mobileSource.media} srcSet={`${mobileSource.base}.webp`} type="image/webp" />
      )}
      {mobileSource && (
        <source media={mobileSource.media} srcSet={`${mobileSource.base}.jpg`} type="image/jpeg" />
      )}
      <source srcSet={`${base}.webp`} type="image/webp" />
      <img
        src={`${base}.jpg`}
        width={width}
        height={height}
        alt={decorative ? "" : alt}
        aria-hidden={decorative || undefined}
        loading={priority ? "eager" : "lazy"}
        // React 19 passes fetchPriority through as the fetchpriority attribute.
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
        sizes={sizes}
        className={imgClassName}
      />
    </picture>
  );
}

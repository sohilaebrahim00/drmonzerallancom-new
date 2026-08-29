import type { ReactNode } from "react";

import { Photo } from "@/components/common/Photo";
import { cn } from "@/lib/utils";

interface PhotoBackdropProps {
  /** Path without extension. */
  base: string;
  width: number;
  height: number;
  children: ReactNode;
  className?: string;
  /** Scrim strength over the photograph. */
  overlayClassName?: string;
}

/**
 * A top-anchored full-bleed photograph with content sitting over it in a solid
 * panel — the treatment the home FAQ section uses, shared so /faq gets the
 * same thing rather than a second implementation of it.
 *
 * Sizing rules, both load-bearing:
 *  - `max-w-[<native>px]` so the file is never rendered wider than it is.
 *  - `aspect-[w/h]` holds it to its native ratio, and `max-h-[62vh]` keeps it
 *    inside the site's height ceiling. Capping the height makes the band
 *    SHORTER than its native ratio, never taller, so `object-cover` still
 *    samples the file below 1:1 — stretched over a whole section instead, a
 *    1600x730 file gets scaled UP to cover a much taller box.
 */
export function PhotoBackdrop({
  base,
  width,
  height,
  children,
  className,
  overlayClassName = "bg-navy/45",
}: PhotoBackdropProps) {
  return (
    <div className={cn("relative isolate overflow-hidden", className)}>
      <div className="absolute inset-x-0 top-0 -z-10 bg-navy" aria-hidden="true">
        <div
          className="relative mx-auto max-h-[62vh] w-full"
          style={{ maxWidth: `${width}px`, aspectRatio: `${width} / ${height}` }}
        >
          <Photo
            base={base}
            width={width}
            height={height}
            alt=""
            decorative
            className="block h-full w-full"
            imgClassName="h-full w-full object-cover object-center"
            sizes={`(min-width: ${width}px) ${width}px, 100vw`}
          />
          <div className={cn("absolute inset-0", overlayClassName)} />
          {/* Fades into the page surface so the band has no hard seam where
              the photograph stops. */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-background" />
        </div>
      </div>
      {children}
    </div>
  );
}

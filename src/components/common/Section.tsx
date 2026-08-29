import type { ReactNode } from "react";

import { SectionHeading } from "@/components/common/SectionHeading";
import {
  SECTION_PADDING,
  SECTION_RHYTHM,
  SECTION_WIDTHS,
  type SectionWidth,
} from "@/components/common/sectionWidths";
import { cn } from "@/lib/utils";

interface SectionProps {
  children: ReactNode;
  /** Named width from the scale — see sectionWidths.ts. */
  width?: SectionWidth;
  id?: string;
  /** Extra classes on the <section> itself: backgrounds, borders, isolation. */
  className?: string;
  /** Extra classes on the inner container. */
  containerClassName?: string;
  /** Omit the standard vertical rhythm when a page needs to control it. */
  bare?: boolean;
  /** When given, renders the shared heading block above the children. */
  eyebrow?: string;
  title?: string;
  description?: string;
  headingAlign?: "left" | "center";
  headingId?: string;
  /** Renders the heading as <h1> for the page's primary heading. */
  headingLevel?: "h1" | "h2";
}

/**
 * One section wrapper for every marketing page: width, padding, vertical
 * rhythm and the eyebrow/heading/lede block in a single place.
 *
 * Each page used to hand-roll all four, which is exactly why they drifted
 * apart. Changing the rhythm now means changing it here.
 */
export function Section({
  children,
  width = "standard",
  id,
  className,
  containerClassName,
  bare = false,
  eyebrow,
  title,
  description,
  headingAlign = "center",
  headingId,
  headingLevel = "h2",
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn("relative", !bare && SECTION_RHYTHM, className)}
      aria-labelledby={headingId}
    >
      <div
        className={cn("mx-auto w-full", SECTION_WIDTHS[width], SECTION_PADDING, containerClassName)}
      >
        {title && (
          <SectionHeading
            eyebrow={eyebrow ?? ""}
            title={title}
            description={description}
            align={headingAlign}
            id={headingId}
            level={headingLevel}
            className={headingAlign === "center" ? "mb-12" : "mb-10"}
          />
        )}
        {children}
      </div>
    </section>
  );
}

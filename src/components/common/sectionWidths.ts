/**
 * The site's content-width scale. Three names, no ad-hoc values.
 *
 * Before this existed, six marketing pages between them used max-w-2xl, 3xl,
 * 4xl, 5xl, 6xl, 7xl, lg, md, sm and xl, often several within one page. The
 * content column visibly jumped when navigating, which is a large part of why
 * the site read as unfinished even where each page looked fine alone.
 *
 * The point is NOT that every page becomes the same width — it is that a page
 * picks a named width on purpose:
 *
 *   wide      card grids, galleries, package tables — things scanned in rows
 *   standard  most section content
 *   reading   prose read left to right; articles, legal text, FAQ answers.
 *             Roughly 70 characters per line at the body size, which is where
 *             the eye stops losing the start of the next line.
 */
export const SECTION_WIDTHS = {
  wide: "max-w-7xl",
  standard: "max-w-5xl",
  reading: "max-w-3xl",
} as const;

export type SectionWidth = keyof typeof SECTION_WIDTHS;

/** Horizontal padding and vertical rhythm, so pages stop hand-rolling both. */
export const SECTION_PADDING = "px-6 sm:px-10";
export const SECTION_RHYTHM = "py-16 sm:py-20";

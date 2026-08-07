// Intentionally empty: before/after content requires explicit, documented
// patient consent, which does not exist yet. Nothing fabricated is shown in
// its place — the Before & After section
// (src/components/sections/BeforeAfter.tsx) hides itself automatically
// while this list is empty. Add real, consented entries here to bring the
// section back online; no other file needs to change.
export interface Transformation {
  name: string;
  service: string;
  duration: string;
  quote: string;
  metricLabel: string;
  before: string;
  after: string;
  beforeTone: "processed" | "irregular" | "low-energy";
  afterTone: "balanced" | "structured" | "energized";
}

export const transformations: Transformation[] = [];

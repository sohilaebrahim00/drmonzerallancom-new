// Intentionally empty: no real, consented client testimonials have been
// supplied yet. Fabricated reviews are never shown as if genuine — the
// Testimonials section (src/components/sections/Testimonials.tsx) hides
// itself automatically while this list is empty. Add real, consented
// entries here to bring the section back online; no other file needs to
// change.
export interface Testimonial {
  name: string;
  initials: string;
  rating: number;
  date: string;
  review: string;
  service: string;
}

export const testimonials: Testimonial[] = [];

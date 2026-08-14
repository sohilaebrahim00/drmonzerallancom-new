// Central consultation-booking configuration. Consultation credit counts
// are NOT duplicated here — they live only in src/data/packages.ts and are
// always read from there (or from the real subscription row once a member
// is signed in). This file only holds booking-rule constants that aren't
// tied to a specific package.

/** Matches the default seeded in supabase/schema.sql (doctor_availability.timezone). */
export const DOCTOR_TIMEZONE = "Asia/Dubai";

/** Matches MINIMUM_BOOKING_NOTICE_HOURS enforced server-side in book_consultation_slot(). */
export const MINIMUM_BOOKING_NOTICE_HOURS = 48;

/** Human-readable recurring schedule, for display only — the database (doctor_availability) is the real source of truth an admin can change. */
export const DEFAULT_SCHEDULE_LABEL = "Monday, Wednesday, and Friday, 4:00 PM–9:00 PM (Dubai time)";

/**
 * Central feature flags for the native app. Kept as plain constants (not
 * buried inside components) so a single edit changes both the UI gate and
 * the copy shown to non-members.
 *
 * `foodScannerRequiresMembership` is mirrored in
 * `supabase/functions/food-scan/index.ts` (FOOD_SCANNER_REQUIRES_MEMBERSHIP)
 * — Deno Edge Functions can't import Vite frontend modules directly, so the
 * server-side enforcement copy must be kept in sync by hand, the same
 * pattern already used for DOCTOR_TIMEZONE/MINIMUM_BOOKING_NOTICE_HOURS
 * between src/config/consultations.ts and supabase/functions/_shared/availability.ts.
 */
export const foodScannerRequiresMembership = false;

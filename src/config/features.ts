/**
 * Central, single-source-of-truth feature configuration for the Phase G
 * social/nutrition/tracking platform — no scattered booleans across
 * screens/services. Every flag here defaults to the shipped Phase G
 * scope; flip one place to change what's live without hunting through
 * components.
 */
export const features = {
  freeAccounts: true,
  friendsEnabled: true,
  messagingEnabled: true,
  foodScannerEnabled: true,
  barcodeEnabled: true,
  foodSearchEnabled: true,
  activityTasksEnabled: true,
  stepTrackingEnabled: true,
  doctorProgramsEnabled: true,
  membershipsEnabled: true,
  hydrationEnabled: true,
  dailyCheckInEnabled: true,
  favoritesEnabled: true,
  customMealsEnabled: true,
  progressPhotosEnabled: true,
} as const;

export type FeatureFlag = keyof typeof features;

/**
 * Whether the Arabic/English switch is shown in the Header.
 *
 * OFF because the dictionaries do not yet cover the IN list in PHASE_8_GO.md.
 * A visitor who switches today gets a right-to-left page still written in
 * English, which does not read as "Arabic is coming" — it reads as a broken
 * site, and the first people to try it are the doctor's own patients.
 *
 * This hides the SWITCH ONLY. Everything underneath stays live and keeps being
 * exercised: the provider, `lang`/`dir` on <html>, the Arabic font, the
 * logical properties and every `rtl:` variant.
 *
 * ── HOW IT COMES OFF ───────────────────────────────────────────────────
 * Flip to `true` when the dictionaries cover the IN list — every page in the
 * "IN" section of PHASE_8_GO.md, not merely the home page — and a native
 * Arabic reader has reviewed the strings flagged for confidence.
 * THE OWNER DECIDES THAT, not the developer who adds the last key: the
 * judgement is "is this good enough to put in front of patients", which is
 * his call. A flag with no removal condition becomes permanent, so this one
 * names both the condition and who signs it off.
 *
 * While it is false, locale resolution ignores a stored or browser-derived
 * Arabic preference (see src/i18n/detect.ts) — otherwise a visitor who had
 * already switched, or whose browser is set to Arabic, would keep landing on
 * the broken state without ever touching the control.
 */
export const SHOW_LANGUAGE_SWITCH = false;

/** Minutes between a logged meal and its suggested activity task becoming available. Never hardcode 25 elsewhere. */
export const POST_MEAL_ACTIVITY_DELAY_MINUTES = 25;

/**
 * Daily food-scan ceiling per user, enforced server-side against
 * food_scan_events (see supabase/PHASE_G_SOCIAL_NUTRITION_MIGRATION.sql
 * §16). Mirrored in supabase/functions/food-scan/index.ts — Deno Edge
 * Functions can't import Vite frontend modules, the same pattern already
 * used for FOOD_SCANNER_REQUIRES_MEMBERSHIP/DOCTOR_TIMEZONE.
 */
export const FREE_DAILY_FOOD_SCAN_LIMIT = 15;

/** Days in a doctor-assigned nutrition program. */
export const PROGRAM_LENGTH_DAYS = 30;

/** App-wide default hydration goal (ml), used only when neither the user nor a doctor has set one. */
export const DEFAULT_HYDRATION_GOAL_ML = 2000;

/** Quick-add hydration increments shown on the Water widget/screen. */
export const HYDRATION_QUICK_ADD_ML = [250, 500] as const;

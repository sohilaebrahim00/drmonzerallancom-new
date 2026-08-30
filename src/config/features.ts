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
 * ON. Arabic is a shipped language of this site, not a preview: all 694 keys
 * are translated, the seven articles are translated in full, and
 * `npm run i18n:audit` reports zero reachable English across every in-scope
 * route in Arabic mode.
 *
 * ── WHAT TURNING THIS OFF WOULD NOW MEAN ───────────────────────────────
 * This is no longer a switch that is waiting to be turned on. Setting it back
 * to `false` would REMOVE a language the site already speaks — it does not
 * pause a rollout, it takes Arabic away from readers who are using it.
 *
 * Concretely, `false` would:
 *   - hide the control, so an Arabic reader has no way back to Arabic;
 *   - make locale resolution IGNORE a stored or browser-derived Arabic
 *     preference (src/i18n/detect.ts), so a visitor who had already chosen
 *     Arabic is silently returned to English on their next visit, with no
 *     notice and no way to object;
 *   - leave `?lang=ar` as the only route into Arabic, which is a URL nobody
 *     will guess.
 *
 * So this is a decision to withdraw a language, and it belongs to the owner
 * for the same reason turning it on did. If Arabic ever has to come down —
 * a serious translation error, a regulatory problem — do it deliberately and
 * say so, rather than flipping a flag that once meant "not ready yet".
 *
 * The audit is the thing that keeps this honest: if English ever comes back
 * to an in-scope page, `npm run i18n:audit` fails and the gate catches it
 * before a reader does.
 */
export const SHOW_LANGUAGE_SWITCH = true;

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

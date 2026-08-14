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
  activityTasksEnabled: true,
  stepTrackingEnabled: true,
  doctorProgramsEnabled: true,
  membershipsEnabled: true,
} as const;

export type FeatureFlag = keyof typeof features;

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

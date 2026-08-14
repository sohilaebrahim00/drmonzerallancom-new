/**
 * Deterministic daily-calorie-target engine — Mifflin-St Jeor. Gemini is
 * never asked to invent this number (see supabase/functions/ai-chat and
 * food-scan — neither computes or overrides a calorie target).
 *
 * Safety (Phase G §28): never produces a target below the estimated BMR
 * itself (a deficit should never ask someone to eat under their resting
 * energy need), and refuses to calculate at all for anyone under 18 —
 * that case requires a doctor-set target instead of an automatic estimate.
 */

export type BiologicalSex = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type Goal = "lose_weight" | "maintain_weight" | "gain_weight";

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

// Deliberately moderate, not aggressive — roughly a 0.5kg/week pace for
// the deficit case, a lean surplus for the gain case.
const GOAL_ADJUSTMENT_KCAL: Record<Goal, number> = {
  lose_weight: -500,
  maintain_weight: 0,
  gain_weight: 300,
};

export interface CalorieCalcInput {
  ageYears: number;
  heightCm: number;
  weightKg: number;
  biologicalSex: BiologicalSex;
  activityLevel: ActivityLevel;
  goal: Goal;
}

export interface CalorieCalcResult {
  bmrEstimate: number;
  maintenanceEstimate: number;
  dailyTarget: number;
  formula: "mifflin_st_jeor";
}

export type CalorieCalcOutcome =
  | { ok: true; result: CalorieCalcResult }
  | { ok: false; reason: "REQUIRES_DOCTOR_MINOR" | "INSUFFICIENT_DATA" };

export function calculateDailyCalorieTarget(input: Partial<CalorieCalcInput>): CalorieCalcOutcome {
  const { ageYears, heightCm, weightKg, biologicalSex, activityLevel, goal } = input;

  if (
    ageYears == null ||
    heightCm == null ||
    weightKg == null ||
    !biologicalSex ||
    !activityLevel ||
    !goal ||
    heightCm <= 0 ||
    weightKg <= 0 ||
    ageYears <= 0
  ) {
    return { ok: false, reason: "INSUFFICIENT_DATA" };
  }

  if (ageYears < 18) {
    return { ok: false, reason: "REQUIRES_DOCTOR_MINOR" };
  }

  const sexOffset = biologicalSex === "male" ? 5 : -161;
  const bmrEstimate = 10 * weightKg + 6.25 * heightCm - 5 * ageYears + sexOffset;
  const maintenanceEstimate = bmrEstimate * ACTIVITY_MULTIPLIERS[activityLevel];
  const rawTarget = maintenanceEstimate + GOAL_ADJUSTMENT_KCAL[goal];

  // Safety floor: never suggest eating under the estimated resting rate.
  const dailyTarget = Math.max(Math.round(rawTarget), Math.round(bmrEstimate));

  return {
    ok: true,
    result: {
      bmrEstimate: Math.round(bmrEstimate),
      maintenanceEstimate: Math.round(maintenanceEstimate),
      dailyTarget,
      formula: "mifflin_st_jeor",
    },
  };
}

export function ageFromDateOfBirth(dateOfBirth: string, now = new Date()): number {
  const dob = new Date(dateOfBirth);
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

export function kgToLb(kg: number): number {
  return kg * 2.20462;
}
export function lbToKg(lb: number): number {
  return lb / 2.20462;
}
export function cmToFtIn(cm: number): { feet: number; inches: number } {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches - feet * 12);
  return { feet, inches };
}
export function ftInToCm(feet: number, inches: number): number {
  return (feet * 12 + inches) * 2.54;
}

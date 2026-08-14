import { supabase } from "@/lib/supabase";
import {
  ageFromDateOfBirth,
  calculateDailyCalorieTarget,
  type ActivityLevel,
  type BiologicalSex,
  type Goal,
} from "@/lib/calorieCalculator";

export interface BodyProfile {
  date_of_birth: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  biological_sex: BiologicalSex | null;
  activity_level: ActivityLevel | null;
  goal: Goal | null;
  preferred_weight_unit: "kg" | "lb";
  preferred_height_unit: "cm" | "ft_in";
  health_conditions: string[];
  health_conditions_other: string | null;
  food_allergies: string[];
  food_allergies_other: string | null;
  food_intolerances: string[];
  food_intolerances_other: string | null;
  dietary_preferences: string[];
  medications: string | null;
}

const BODY_PROFILE_COLUMNS =
  "date_of_birth, height_cm, weight_kg, biological_sex, activity_level, goal, preferred_weight_unit, preferred_height_unit, health_conditions, health_conditions_other, food_allergies, food_allergies_other, food_intolerances, food_intolerances_other, dietary_preferences, medications";

export async function getMyBodyProfile(): Promise<BodyProfile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("body_profiles")
    .select(BODY_PROFILE_COLUMNS)
    .maybeSingle();
  if (error) return null;
  return data as BodyProfile | null;
}

export async function getPatientBodyProfile(patientId: string): Promise<BodyProfile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("body_profiles")
    .select(BODY_PROFILE_COLUMNS)
    .eq("user_id", patientId)
    .maybeSingle();
  if (error) return null;
  return data as BodyProfile | null;
}

export async function upsertMyBodyProfile(
  patch: Partial<BodyProfile>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: "Not connected." };
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return { ok: false, error: "Not signed in." };

  const { error } = await supabase
    .from("body_profiles")
    .upsert(
      { user_id: userId, ...patch, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );

  if (error) return { ok: false, error: "Could not save. Please try again." };
  return { ok: true };
}

export interface DailyTarget {
  daily_target: number;
  bmr_estimate: number | null;
  maintenance_estimate: number | null;
  source: "auto" | "doctor";
  calculated_at: string;
}

export async function getMyCurrentTarget(): Promise<DailyTarget | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("daily_targets")
    .select("daily_target, bmr_estimate, maintenance_estimate, source, calculated_at")
    .eq("is_current", true)
    .maybeSingle();
  if (error) return null;
  return data as DailyTarget | null;
}

export async function getPatientCurrentTarget(patientId: string): Promise<DailyTarget | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("daily_targets")
    .select("daily_target, bmr_estimate, maintenance_estimate, source, calculated_at")
    .eq("user_id", patientId)
    .eq("is_current", true)
    .maybeSingle();
  if (error) return null;
  return data as DailyTarget | null;
}

export type RecalculateOutcome =
  | { ok: true; target: DailyTarget }
  | { ok: false; reason: "REQUIRES_DOCTOR_MINOR" | "INSUFFICIENT_DATA" | "NOT_CONNECTED" };

/** Recomputes and stores a new auto daily_targets row from the caller's current body_profiles data. */
export async function recalculateMyDailyTarget(): Promise<RecalculateOutcome> {
  if (!supabase) return { ok: false, reason: "NOT_CONNECTED" };
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return { ok: false, reason: "NOT_CONNECTED" };

  const profile = await getMyBodyProfile();

  const outcome = calculateDailyCalorieTarget({
    ageYears: profile?.date_of_birth ? ageFromDateOfBirth(profile.date_of_birth) : undefined,
    heightCm: profile?.height_cm ?? undefined,
    weightKg: profile?.weight_kg ?? undefined,
    biologicalSex: profile?.biological_sex ?? undefined,
    activityLevel: profile?.activity_level ?? undefined,
    goal: profile?.goal ?? undefined,
  });

  if (!outcome.ok) return { ok: false, reason: outcome.reason };

  const { error } = await supabase.from("daily_targets").insert({
    user_id: userId,
    bmr_estimate: outcome.result.bmrEstimate,
    maintenance_estimate: outcome.result.maintenanceEstimate,
    daily_target: outcome.result.dailyTarget,
    formula: outcome.result.formula,
    source: "auto",
    is_current: true,
  });

  if (error) return { ok: false, reason: "INSUFFICIENT_DATA" };

  return {
    ok: true,
    target: {
      daily_target: outcome.result.dailyTarget,
      bmr_estimate: outcome.result.bmrEstimate,
      maintenance_estimate: outcome.result.maintenanceEstimate,
      source: "auto",
      calculated_at: new Date().toISOString(),
    },
  };
}

/** Doctor-only — requires an active doctor_patient_relationships row, enforced by RLS on insert. */
export async function setDoctorOverrideTarget(
  patientId: string,
  dailyTarget: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: "Not connected." };
  const { data: userData } = await supabase.auth.getUser();
  const doctorId = userData.user?.id;
  if (!doctorId) return { ok: false, error: "Not signed in." };

  const { error } = await supabase.from("daily_targets").insert({
    user_id: patientId,
    daily_target: dailyTarget,
    source: "doctor",
    set_by: doctorId,
    is_current: true,
  });

  if (error)
    return { ok: false, error: "Could not set target. Confirm this patient is connected to you." };
  return { ok: true };
}

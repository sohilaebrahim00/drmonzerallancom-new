import { supabase } from "@/lib/supabase";

export interface StepLog {
  date: string;
  steps: number;
  source: "healthkit" | "health_connect" | "manual";
}

/**
 * Capability layer for step data. `automatic` sources (HealthKit/Health
 * Connect) require a native plugin that is NOT currently installed in this
 * project (see package.json — no @capacitor-community/health-connect or
 * equivalent HealthKit plugin) — wiring one up requires new native
 * permissions/entitlements and can only be verified on a physical device,
 * neither of which is possible from this environment. This function is
 * intentionally honest: it reports automatic tracking as unsupported
 * everywhere today rather than claim a capability that isn't wired to
 * anything. See the implementation report's Steps section.
 */
export function supportsAutomaticSteps(): boolean {
  return false;
}

export async function getMyStepsForDate(date: Date): Promise<StepLog | null> {
  if (!supabase) return null;
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return null;

  const dateStr = date.toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("step_logs")
    .select("date, steps, source")
    .eq("user_id", userId)
    .eq("date", dateStr)
    .maybeSingle();
  if (error) return null;
  return data as StepLog | null;
}

export async function setMyStepsManually(
  date: Date,
  steps: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: "Not connected." };
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return { ok: false, error: "Not signed in." };
  if (steps < 0) return { ok: false, error: "Steps can't be negative." };

  const dateStr = date.toISOString().slice(0, 10);
  const { error } = await supabase.from("step_logs").upsert(
    {
      user_id: userId,
      date: dateStr,
      steps,
      source: "manual",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,date" },
  );

  if (error) return { ok: false, error: "Could not save steps." };
  return { ok: true };
}

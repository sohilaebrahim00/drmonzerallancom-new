import { supabase } from "@/lib/supabase";
import { getDemoMode } from "@/dev/demoMode";
import { DEMO_WEIGHT_HISTORY } from "@/dev/demoFixtures";

export interface WeightLog {
  id: string;
  weight_kg: number;
  logged_at: string;
}

export async function getMyWeightHistory(days = 90): Promise<WeightLog[]> {
  if (getDemoMode()) return DEMO_WEIGHT_HISTORY;
  if (!supabase) return [];
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from("weight_logs")
    .select("id, weight_kg, logged_at")
    .gte("logged_at", since.toISOString())
    .order("logged_at", { ascending: false });

  if (error) return [];
  return data ?? [];
}

export async function logMyWeight(
  weightKg: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (getDemoMode()) return { ok: true };
  if (!supabase) return { ok: false, error: "Not connected." };
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return { ok: false, error: "Not signed in." };
  if (weightKg <= 0 || weightKg >= 500) return { ok: false, error: "Enter a valid weight." };

  const { error } = await supabase
    .from("weight_logs")
    .insert({ user_id: userId, weight_kg: weightKg });
  if (error) return { ok: false, error: "Could not save weight." };

  // Weight is a calorie-target input — a fresh entry should feed the next
  // recalculation (the user/screen decides when to actually recalculate;
  // this file only records the entry).
  return { ok: true };
}

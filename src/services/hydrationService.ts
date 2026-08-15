import { supabase } from "@/lib/supabase";
import { DEFAULT_HYDRATION_GOAL_ML } from "@/config/features";
import { getDemoMode } from "@/dev/demoMode";
import { DEMO_HYDRATION_LOGS, DEMO_HYDRATION_GOAL } from "@/dev/demoFixtures";

export interface HydrationLog {
  id: string;
  amount_ml: number;
  logged_at: string;
}

export interface HydrationGoal {
  goal_ml: number;
  source: "user" | "doctor";
}

async function currentUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

function dayBounds(date: Date): { start: string; end: string } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function getMyHydrationGoal(): Promise<HydrationGoal> {
  if (getDemoMode()) return DEMO_HYDRATION_GOAL;
  if (!supabase) return { goal_ml: DEFAULT_HYDRATION_GOAL_ML, source: "user" };
  const { data, error } = await supabase
    .from("hydration_goals")
    .select("goal_ml, source")
    .maybeSingle();
  if (error || !data) return { goal_ml: DEFAULT_HYDRATION_GOAL_ML, source: "user" };
  return data as HydrationGoal;
}

export async function setMyHydrationGoal(
  goalMl: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (getDemoMode()) return { ok: true };
  if (!supabase) return { ok: false, error: "Not connected." };
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const { data: existing } = await supabase.from("hydration_goals").select("source").maybeSingle();

  // A doctor-set goal takes priority and is not overwritable by the user
  // from this path (§29: "If doctor sets goal: doctor value takes priority").
  if (existing?.source === "doctor") {
    return { ok: false, error: "Your hydration goal was set by your doctor." };
  }

  const { error } = await supabase.from("hydration_goals").upsert(
    {
      user_id: userId,
      goal_ml: goalMl,
      source: "user",
      set_by: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) return { ok: false, error: "Could not save your goal." };
  return { ok: true };
}

export async function getMyHydrationForDay(date: Date): Promise<HydrationLog[]> {
  if (getDemoMode()) return DEMO_HYDRATION_LOGS;
  if (!supabase) return [];
  const userId = await currentUserId();
  if (!userId) return [];
  const { start, end } = dayBounds(date);
  const { data, error } = await supabase
    .from("hydration_logs")
    .select("id, amount_ml, logged_at")
    .eq("user_id", userId)
    .gte("logged_at", start)
    .lt("logged_at", end)
    .order("logged_at", { ascending: false });
  if (error) return [];
  return data ?? [];
}

export async function logHydration(
  amountMl: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (getDemoMode()) return { ok: true };
  if (!supabase) return { ok: false, error: "Not connected." };
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };
  if (amountMl <= 0 || amountMl > 5000) return { ok: false, error: "Enter a realistic amount." };

  const { error } = await supabase.from("hydration_logs").insert({
    user_id: userId,
    amount_ml: amountMl,
  });
  if (error) return { ok: false, error: "Could not log water. Please try again." };
  return { ok: true };
}

export async function deleteHydrationLog(id: string): Promise<void> {
  if (getDemoMode()) return;
  if (!supabase) return;
  await supabase.from("hydration_logs").delete().eq("id", id);
}

import { supabase } from "@/lib/supabase";
import { getDemoMode } from "@/dev/demoMode";
import { DEMO_CHECKIN_TODAY, DEMO_CHECKINS_7D } from "@/dev/demoFixtures";

export type EnergyLevel = "low" | "normal" | "good";
export type HungerLevel = "low" | "normal" | "high";
export type MoodLevel = "low" | "neutral" | "good";

export interface DailyCheckin {
  id: string;
  checkin_date: string;
  energy: EnergyLevel | null;
  hunger: HungerLevel | null;
  mood: MoodLevel | null;
  note: string | null;
}

export interface CheckinInput {
  energy?: EnergyLevel | null;
  hunger?: HungerLevel | null;
  mood?: MoodLevel | null;
  note?: string | null;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getTodaysCheckin(): Promise<DailyCheckin | null> {
  if (getDemoMode()) return DEMO_CHECKIN_TODAY;
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("daily_checkins")
    .select("id, checkin_date, energy, hunger, mood, note")
    .eq("checkin_date", todayStr())
    .maybeSingle();
  if (error) return null;
  return data as DailyCheckin | null;
}

export async function saveTodaysCheckin(
  input: CheckinInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (getDemoMode()) return { ok: true };
  if (!supabase) return { ok: false, error: "Not connected." };
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return { ok: false, error: "Not signed in." };

  const { error } = await supabase.from("daily_checkins").upsert(
    {
      user_id: userId,
      checkin_date: todayStr(),
      energy: input.energy ?? null,
      hunger: input.hunger ?? null,
      mood: input.mood ?? null,
      note: input.note?.trim() ? input.note.trim().slice(0, 500) : null,
    },
    { onConflict: "user_id,checkin_date" },
  );
  if (error) return { ok: false, error: "Could not save your check-in." };
  return { ok: true };
}

export async function getPatientCheckinsInRange(
  patientId: string,
  startDate: Date,
  endDate: Date,
): Promise<DailyCheckin[]> {
  if (getDemoMode()) return DEMO_CHECKINS_7D;
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("daily_checkins")
    .select("id, checkin_date, energy, hunger, mood, note")
    .eq("user_id", patientId)
    .gte("checkin_date", startDate.toISOString().slice(0, 10))
    .lte("checkin_date", endDate.toISOString().slice(0, 10))
    .order("checkin_date", { ascending: false });
  if (error) return [];
  return data ?? [];
}

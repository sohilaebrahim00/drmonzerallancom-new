import { supabase } from "@/lib/supabase";
import { POST_MEAL_ACTIVITY_DELAY_MINUTES } from "@/config/features";

export interface ActivityLibraryEntry {
  id: string;
  name: string;
  category: string | null;
  duration_minutes: number;
  difficulty: "easy" | "moderate";
  instructions: string | null;
  met_value: number;
}

export interface ActivityTask {
  id: string;
  meal_log_id: string | null;
  activity_id: string | null;
  available_at: string;
  status: "pending" | "completed" | "skipped";
  activity: ActivityLibraryEntry | null;
}

async function currentUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function getActivityLibrary(): Promise<ActivityLibraryEntry[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("activity_library")
    .select("id, name, category, duration_minutes, difficulty, instructions, met_value")
    .eq("active", true);
  if (error) return [];
  return data ?? [];
}

/**
 * Very simple, deliberately conservative selection: filters the library by
 * a light/moderate cap based on the user's activity level (never infers
 * capability from anything else — e.g. never from a food photo), then
 * picks pseudo-randomly among the remaining options so the same person
 * doesn't always get the exact same suggestion.
 */
function pickActivity(
  library: ActivityLibraryEntry[],
  activityLevel: string | null,
): ActivityLibraryEntry | null {
  if (library.length === 0) return null;
  const allowModerate =
    activityLevel === "active" || activityLevel === "very_active" || activityLevel === "moderate";
  const pool = allowModerate ? library : library.filter((a) => a.difficulty === "easy");
  const finalPool = pool.length > 0 ? pool : library;
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

/** Called right after a meal is saved — creates a pending task available ~25 minutes later. Never blocks the save flow. */
export async function createPostMealActivityTask(mealLogId: string): Promise<void> {
  if (!supabase) return;
  const userId = await currentUserId();
  if (!userId) return;

  const [{ data: bodyProfile }, library] = await Promise.all([
    supabase.from("body_profiles").select("activity_level").maybeSingle(),
    getActivityLibrary(),
  ]);

  const activity = pickActivity(library, bodyProfile?.activity_level ?? null);
  const availableAt = new Date(Date.now() + POST_MEAL_ACTIVITY_DELAY_MINUTES * 60_000);

  await supabase.from("activity_tasks").insert({
    user_id: userId,
    meal_log_id: mealLogId,
    activity_id: activity?.id ?? null,
    available_at: availableAt.toISOString(),
    status: "pending",
  });
}

export async function getMyPendingActivityTasks(): Promise<ActivityTask[]> {
  if (!supabase) return [];
  const userId = await currentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("activity_tasks")
    .select("id, meal_log_id, activity_id, available_at, status")
    .eq("user_id", userId)
    .eq("status", "pending")
    .order("available_at", { ascending: true });

  if (error || !data || data.length === 0) return [];

  const activityIds = [...new Set(data.map((t) => t.activity_id).filter(Boolean))] as string[];
  const { data: activities } = activityIds.length
    ? await supabase
        .from("activity_library")
        .select("id, name, category, duration_minutes, difficulty, instructions, met_value")
        .in("id", activityIds)
    : { data: [] };

  const byId = new Map((activities ?? []).map((a) => [a.id, a]));
  return data.map((t) => ({
    ...t,
    activity: t.activity_id ? (byId.get(t.activity_id) ?? null) : null,
  }));
}

/** Estimated burn = MET × weight(kg) × duration(hours) × 1.05 (standard MET formula) — never a Gemini guess. */
export function estimateCaloriesBurned(
  metValue: number,
  durationMinutes: number,
  weightKg: number | null,
): number {
  const assumedWeightKg = weightKg ?? 70; // generic reference weight if not provided — shown as a wider range in the UI in that case
  return Math.round(metValue * assumedWeightKg * (durationMinutes / 60));
}

export async function completeActivityTask(
  taskId: string,
  durationMinutes: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: "Not connected." };
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const { data: task } = await supabase
    .from("activity_tasks")
    .select("id, activity_id, meal_log_id")
    .eq("id", taskId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!task) return { ok: false, error: "Task not found." };

  const [{ data: activity }, { data: bodyProfile }] = await Promise.all([
    task.activity_id
      ? supabase
          .from("activity_library")
          .select("met_value")
          .eq("id", task.activity_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("body_profiles").select("weight_kg").maybeSingle(),
  ]);

  const estimatedBurn = activity
    ? estimateCaloriesBurned(activity.met_value, durationMinutes, bodyProfile?.weight_kg ?? null)
    : null;

  const { error: logError } = await supabase.from("activity_logs").insert({
    user_id: userId,
    activity_task_id: taskId,
    activity_id: task.activity_id,
    completed_at: new Date().toISOString(),
    duration_minutes: durationMinutes,
    estimated_calories_burned: estimatedBurn,
    source: "task",
  });
  if (logError) return { ok: false, error: "Could not save your activity." };

  await supabase.from("activity_tasks").update({ status: "completed" }).eq("id", taskId);
  return { ok: true };
}

export async function skipActivityTask(taskId: string): Promise<void> {
  if (!supabase) return;
  await supabase.from("activity_tasks").update({ status: "skipped" }).eq("id", taskId);
}

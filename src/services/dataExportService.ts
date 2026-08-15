import { supabase } from "@/lib/supabase";
import { getDemoMode } from "@/dev/demoMode";

/**
 * "Download My Data" — exports only the caller's own rows (every query
 * below is a plain client-side select, so RLS already guarantees this;
 * there is no service-role bypass here). Never includes another user's
 * data — even shared/friend rows a visitor could otherwise read stay out
 * of their own export, since the queries are always scoped to
 * user_id = auth.uid() explicitly, not "everything visible to me."
 */
export async function exportMyData(): Promise<
  { ok: true; json: string } | { ok: false; error: string }
> {
  if (getDemoMode()) {
    return {
      ok: true,
      json: JSON.stringify(
        { exportedAt: new Date().toISOString(), note: "Demo preview export — fixture data only." },
        null,
        2,
      ),
    };
  }
  if (!supabase) return { ok: false, error: "Not connected." };
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return { ok: false, error: "Not signed in." };

  const [profile, bodyProfile, targets, meals, mealItems, activities, steps, weights, program] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, username, bio, timezone, created_at")
        .eq("id", userId)
        .maybeSingle(),
      supabase.from("body_profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase
        .from("daily_targets")
        .select("daily_target, source, formula, calculated_at")
        .eq("user_id", userId),
      supabase
        .from("meal_logs")
        .select(
          "id, meal_time, meal_type, total_calories, total_protein_g, total_carbs_g, total_fat_g, is_outside_program",
        )
        .eq("user_id", userId),
      supabase
        .from("meal_log_items")
        .select(
          "meal_log_id, name, estimated_portion, estimated_calories, protein_g, carbs_g, fat_g",
        )
        .in(
          "meal_log_id",
          (await supabase.from("meal_logs").select("id").eq("user_id", userId)).data?.map(
            (m) => m.id,
          ) ?? [],
        ),
      supabase
        .from("activity_logs")
        .select("completed_at, duration_minutes, estimated_calories_burned, source")
        .eq("user_id", userId),
      supabase.from("step_logs").select("date, steps, source").eq("user_id", userId),
      supabase.from("weight_logs").select("weight_kg, logged_at").eq("user_id", userId),
      supabase
        .from("nutrition_programs")
        .select("title, start_date, end_date, goal, status")
        .eq("patient_id", userId),
    ]);

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    profile: profile.data ?? null,
    bodyProfile: bodyProfile.data ?? null,
    dailyTargets: targets.data ?? [],
    meals: meals.data ?? [],
    mealItems: mealItems.data ?? [],
    activities: activities.data ?? [],
    steps: steps.data ?? [],
    weights: weights.data ?? [],
    programs: program.data ?? [],
  };

  return { ok: true, json: JSON.stringify(exportPayload, null, 2) };
}

/** Browser-standard download — works in PWA and the Capacitor WebView (no Filesystem plugin required for a plain text/JSON blob). */
export function downloadJson(filename: string, json: string) {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

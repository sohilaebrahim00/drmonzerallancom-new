import { supabase } from "@/lib/supabase";

export interface FeedEvent {
  id: string;
  type: "meal" | "activity";
  userId: string;
  user: { full_name: string | null; username: string | null; avatar_url: string | null } | null;
  summary: string;
  detail: string | null;
  at: string;
}

/**
 * Friends-only activity feed — no global public feed. Reads meal_logs/
 * activity_logs directly; RLS (see PHASE_G_SOCIAL_NUTRITION_MIGRATION.sql)
 * already restricts these to the caller's own rows plus rows an accepted
 * friend has explicitly shared, so this query needs no extra friend-id
 * filtering client-side — the database only ever returns what's actually
 * visible to the caller.
 */
export async function getFriendsActivityFeed(limit = 20): Promise<FeedEvent[]> {
  if (!supabase) return [];

  const [{ data: meals }, { data: activities }] = await Promise.all([
    supabase
      .from("meal_logs")
      .select("id, user_id, meal_type, total_calories, meal_time")
      .eq("shared_with_friends", true)
      .order("meal_time", { ascending: false })
      .limit(limit),
    supabase
      .from("activity_logs")
      .select("id, user_id, completed_at, duration_minutes, activity_id, activity_library(name)")
      .eq("shared_with_friends", true)
      .order("completed_at", { ascending: false })
      .limit(limit),
  ]);

  const userIds = [
    ...new Set([
      ...(meals ?? []).map((m) => m.user_id),
      ...(activities ?? []).map((a) => a.user_id),
    ]),
  ];
  const { data: profiles } = userIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url")
        .in("id", userIds)
    : { data: [] };
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  const mealEvents: FeedEvent[] = (meals ?? []).map((m) => ({
    id: `meal-${m.id}`,
    type: "meal",
    userId: m.user_id,
    user: profileById.get(m.user_id) ?? null,
    summary: `Logged ${m.meal_type ?? "a meal"}`,
    detail: `${Math.round(m.total_calories)} kcal`,
    at: m.meal_time,
  }));

  const activityEvents: FeedEvent[] = (activities ?? []).map((a) => {
    const activityName = (a as { activity_library?: { name?: string } }).activity_library?.name;
    return {
      id: `activity-${a.id}`,
      type: "activity",
      userId: a.user_id,
      user: profileById.get(a.user_id) ?? null,
      summary: activityName ? `Completed ${activityName}` : "Completed an activity",
      detail: a.duration_minutes ? `${a.duration_minutes} min` : null,
      at: a.completed_at,
    };
  });

  return [...mealEvents, ...activityEvents]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, limit);
}

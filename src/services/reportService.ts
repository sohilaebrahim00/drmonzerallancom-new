import { supabase } from "@/lib/supabase";

export type ReportReason = "spam" | "harassment" | "other";

export async function reportUser(
  reportedUserId: string,
  reason: ReportReason,
  details?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: "Not connected." };
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return { ok: false, error: "Not signed in." };
  if (userId === reportedUserId) return { ok: false, error: "You can't report yourself." };

  const { error } = await supabase.from("user_reports").insert({
    reporter_id: userId,
    reported_user_id: reportedUserId,
    reason,
    details: details?.trim() ? details.trim().slice(0, 1000) : null,
  });
  if (error) return { ok: false, error: "Could not submit report. Please try again." };
  return { ok: true };
}

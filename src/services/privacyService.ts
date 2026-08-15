import { supabase } from "@/lib/supabase";
import { getDemoMode } from "@/dev/demoMode";

export interface PrivacySettings {
  share_meals_with_friends: boolean;
  share_meal_photos_with_friends: boolean;
  share_calories_with_friends: boolean;
  share_steps_with_friends: boolean;
  share_activity_with_friends: boolean;
  share_program_progress_with_friends: boolean;
  share_weight_with_friends: boolean;
}

const DEMO_PRIVACY_SETTINGS: PrivacySettings = {
  share_meals_with_friends: true,
  share_meal_photos_with_friends: false,
  share_calories_with_friends: true,
  share_steps_with_friends: true,
  share_activity_with_friends: true,
  share_program_progress_with_friends: true,
  share_weight_with_friends: false,
};

export async function getMyPrivacySettings(): Promise<PrivacySettings | null> {
  if (getDemoMode()) return DEMO_PRIVACY_SETTINGS;
  if (!supabase) return null;
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return null;

  const { data, error } = await supabase.rpc("get_or_create_privacy_settings", {
    p_user_id: userId,
  });
  if (error) return null;
  return data as PrivacySettings | null;
}

export async function updateMyPrivacySettings(
  patch: Partial<PrivacySettings>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (getDemoMode()) return { ok: true };
  if (!supabase) return { ok: false, error: "Not connected." };
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return { ok: false, error: "Not signed in." };

  const { error } = await supabase
    .from("user_privacy_settings")
    .upsert(
      { user_id: userId, ...patch, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );

  if (error) return { ok: false, error: "Could not save privacy settings." };
  return { ok: true };
}

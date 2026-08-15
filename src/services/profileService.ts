import { supabase } from "@/lib/supabase";
import { getDemoMode } from "@/dev/demoMode";
import { DEMO_PROFILE, DEMO_DOCTOR_PROFILE, DEMO_FRIEND_PUBLIC_PROFILE } from "@/dev/demoFixtures";

export type UserRole = "user" | "doctor" | "admin";

export interface FullProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: UserRole;
  is_admin?: boolean;
  timezone: string | null;
  onboarding_current_step: string | null;
  onboarding_completed_at: string | null;
}

const PROFILE_COLUMNS =
  "id, full_name, username, avatar_url, bio, role, is_admin, timezone, onboarding_current_step, onboarding_completed_at";

export async function getFullProfile(userId: string): Promise<FullProfile | null> {
  const demoMode = getDemoMode();
  if (demoMode) return demoMode === "doctor" ? DEMO_DOCTOR_PROFILE : DEMO_PROFILE;
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.warn("[profileService] profiles table unavailable:", error.message);
    return null;
  }
  return data as FullProfile | null;
}

export type UsernameAvailability = "available" | "unavailable" | "unknown";

/**
 * Distinguishes "the backend confirmed this username is taken/invalid"
 * from "the check itself failed" (network error, or — found via live
 * testing against a project the Phase G migration hadn't been applied to
 * yet — the check_username_available() RPC not existing). The two used to
 * be conflated into a single `false`, which showed visitors the misleading
 * "That username is taken or not allowed" message even when the real
 * problem was an unreachable backend. The database's own unique index on
 * profiles.username is still the actual source of truth — this is only a
 * nicer pre-flight UX check, so callers should treat "unknown" as
 * non-blocking (let the visitor submit; a genuine collision still surfaces
 * a real error from the save itself).
 */
export async function checkUsernameAvailable(username: string): Promise<UsernameAvailability> {
  if (!supabase) return "unknown";
  const { data, error } = await supabase.rpc("check_username_available", { p_username: username });
  if (error) return "unknown";
  return data ? "available" : "unavailable";
}

export async function setBasicProfile(input: {
  fullName: string;
  username: string;
  timezone?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: "Not connected." };
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return { ok: false, error: "Not signed in." };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: input.fullName,
      username: input.username.toLowerCase(),
      timezone: input.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    })
    .eq("id", userId);

  if (error) {
    if (error.message.includes("profiles_username_unique_idx") || error.code === "23505") {
      return { ok: false, error: "That username is already taken." };
    }
    if (error.message.includes("profiles_username_format")) {
      return { ok: false, error: "Usernames must be 3-24 characters (letters, numbers, . or _)." };
    }
    return { ok: false, error: "Could not save your profile. Please try again." };
  }
  return { ok: true };
}

export async function setOnboardingStep(step: string): Promise<void> {
  if (!supabase) return;
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return;
  await supabase.from("profiles").update({ onboarding_current_step: step }).eq("id", userId);
}

export async function completeOnboarding(): Promise<void> {
  if (!supabase) return;
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return;
  await supabase
    .from("profiles")
    .update({ onboarding_current_step: "ready", onboarding_completed_at: new Date().toISOString() })
    .eq("id", userId);
}

export interface PublicProfileSummary {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

export async function searchUsers(query: string): Promise<PublicProfileSummary[]> {
  if (getDemoMode()) return Object.values(DEMO_FRIEND_PUBLIC_PROFILE);
  if (!supabase || query.trim().length < 2) return [];
  const { data, error } = await supabase.rpc("search_users", { p_query: query.trim() });
  if (error) {
    console.warn("[profileService] search_users unavailable:", error.message);
    return [];
  }
  return (data as PublicProfileSummary[]) ?? [];
}

export async function getPublicProfile(userId: string): Promise<PublicProfileSummary | null> {
  if (getDemoMode()) return DEMO_FRIEND_PUBLIC_PROFILE[userId] ?? null;
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url")
    .eq("id", userId)
    .maybeSingle();
  if (error) return null;
  return data;
}

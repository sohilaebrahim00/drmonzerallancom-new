import { supabase } from "@/lib/supabase";

export interface Subscription {
  id: string;
  package_id: "basic" | "premium" | "vip-elite";
  status: "active" | "past_due" | "cancelled" | "expired";
  current_period_start: string;
  current_period_end: string | null;
  consultation_credit_limit: number;
  consultation_credits_used: number;
}

export interface ConsultationRequest {
  id: string;
  consultation_type: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  time_zone: string | null;
  reason: string | null;
  status: "pending" | "approved" | "scheduled" | "completed" | "cancelled";
  google_meet_link: string | null;
  scheduled_at: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
}

/**
 * Every function here fails soft: if Supabase isn't configured, or the
 * schema in supabase/schema.sql hasn't been applied to the project yet,
 * these return `null`/`[]` (with a console.warn, no thrown error) rather
 * than crashing the dashboard. The UI is expected to render an honest
 * "not connected yet" / empty state in that case — never fabricated data.
 */

export async function getProfile(userId: string): Promise<Profile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.warn("[membershipService] profiles table unavailable:", error.message);
    return null;
  }
  return data;
}

export async function getMySubscription(): Promise<Subscription | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      "id, package_id, status, current_period_start, current_period_end, consultation_credit_limit, consultation_credits_used",
    )
    .eq("status", "active")
    .order("current_period_start", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.warn("[membershipService] subscriptions table unavailable:", error.message);
    return null;
  }
  return data;
}

export async function getMyConsultationRequests(): Promise<ConsultationRequest[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("consultation_requests")
    .select(
      "id, consultation_type, preferred_date, preferred_time, time_zone, reason, status, google_meet_link, scheduled_at, created_at",
    )
    .order("created_at", { ascending: false });
  if (error) {
    console.warn("[membershipService] consultation_requests table unavailable:", error.message);
    return [];
  }
  return data ?? [];
}

export interface ConsultationRequestInput {
  consultationType: string;
  preferredDate: string;
  preferredTime: string;
  timeZone: string;
  reason: string;
}

export type RequestConsultationResult =
  | { ok: true; request: ConsultationRequest }
  | { ok: false; error: string };

/**
 * Calls the `request_consultation` RPC (see supabase/schema.sql), which
 * checks credit availability inside the database — the frontend never
 * decides on its own whether a credit exists.
 */
export async function requestConsultation(
  input: ConsultationRequestInput,
): Promise<RequestConsultationResult> {
  if (!supabase) return { ok: false, error: "Consultation requests aren't connected yet." };
  const { data, error } = await supabase.rpc("request_consultation", {
    p_consultation_type: input.consultationType,
    p_preferred_date: input.preferredDate,
    p_preferred_time: input.preferredTime,
    p_time_zone: input.timeZone,
    p_reason: input.reason,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, request: data as ConsultationRequest };
}

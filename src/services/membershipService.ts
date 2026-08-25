import { supabase } from "@/lib/supabase";
import { getDemoMode } from "@/dev/demoMode";
import type { UserRole } from "@/services/profileService";
import {
  DEMO_PROFILE,
  DEMO_DOCTOR_PROFILE,
  DEMO_SUBSCRIPTION,
  DEMO_CONSULTATION,
  DEMO_DOCTOR_CONSULTATIONS,
} from "@/dev/demoFixtures";

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
  appointment_start: string;
  appointment_end: string;
  client_timezone: string | null;
  consultation_type: string | null;
  reason: string | null;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "rescheduled";
  credit_status: "reserved" | "confirmed" | "released";
  google_calendar_event_id: string | null;
  google_meet_url: string | null;
  cancelled_at: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  /**
   * Lets a page tell a practitioner viewer from a patient one without a
   * second round trip. `is_admin` is deliberately not here: PHASE_J J.3
   * revoked that column from the `authenticated` role, so the client cannot
   * read it. role covers the same accounts — PHASE_G backfilled role='admin'
   * for every is_admin account, and set_user_role keeps the two in step.
   */
  role?: UserRole;
}

/**
 * Every function here fails soft: if Supabase isn't configured, or the
 * schema in supabase/schema.sql hasn't been applied to the project yet,
 * these return `null`/`[]` (with a console.warn, no thrown error) rather
 * than crashing the dashboard. The UI is expected to render an honest
 * "not connected yet" / empty state in that case — never fabricated data.
 */

export async function getProfile(userId: string): Promise<Profile | null> {
  const demoMode = getDemoMode();
  if (demoMode) return demoMode === "doctor" ? DEMO_DOCTOR_PROFILE : DEMO_PROFILE;
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("profiles")
    // `is_admin` is not selectable by the `authenticated` role any more —
    // see PHASE_J_FIXES_MIGRATION.sql (J.3) and AdminRoute.tsx. `role` is
    // granted, and is what tells a practitioner viewer from a patient.
    .select("id, full_name, role")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.warn("[membershipService] profiles table unavailable:", error.message);
    return null;
  }
  return data;
}

/**
 * The caller's active entitlement, with credits SUMMED across every active
 * subscriptions row.
 *
 * Each one-time program purchase inserts its own row, so `limit 1` here
 * reported only the newest one: a buyer who bought Diet Premium (3 credits)
 * and then Treatment Basic (1) saw "1 of 1" and could never spend the other
 * three. Identity fields (id, package_id, dates) still come from the newest
 * row — that is what the Account page names — but the balance is the real
 * combined one, which is what makes AccountPage's "purchase another program
 * to get more credits" prompt actually true.
 */
export async function getMySubscription(): Promise<Subscription | null> {
  if (getDemoMode()) return DEMO_SUBSCRIPTION;
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      "id, package_id, status, current_period_start, current_period_end, consultation_credit_limit, consultation_credits_used",
    )
    .eq("status", "active")
    .order("current_period_start", { ascending: false });
  if (error) {
    console.warn("[membershipService] subscriptions table unavailable:", error.message);
    return null;
  }
  const rows = (data ?? []) as Subscription[];
  if (rows.length === 0) return null;

  return {
    ...rows[0],
    consultation_credit_limit: rows.reduce((sum, r) => sum + r.consultation_credit_limit, 0),
    consultation_credits_used: rows.reduce((sum, r) => sum + r.consultation_credits_used, 0),
  };
}

const CONSULTATION_COLUMNS =
  "id, appointment_start, appointment_end, client_timezone, consultation_type, reason, status, credit_status, google_calendar_event_id, google_meet_url, cancelled_at, created_at";

/**
 * The signed-in viewer's OWN consultations.
 *
 * The user_id filter is not redundant with RLS. consultation_requests carries
 * an "Admins can view all consultation requests" policy (using is_admin()),
 * so for the doctor's account the unfiltered query returned every patient's
 * bookings — and /account rendered a stranger's appointment as the viewer's
 * own upcoming consultation, Join Meet button and all. Reproduced live on
 * 2026-08-25. RLS is the floor here, not the scoping.
 *
 * The id is passed in, matching getProfile(userId) above; both callers of
 * this function already hold the user object.
 *
 * For the doctor's all-patients view, use getAllConsultationRequests().
 */
export async function getMyConsultationRequests(userId: string): Promise<ConsultationRequest[]> {
  const demoMode = getDemoMode();
  if (demoMode) return demoMode === "doctor" ? DEMO_DOCTOR_CONSULTATIONS : [DEMO_CONSULTATION];
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("consultation_requests")
    .select(CONSULTATION_COLUMNS)
    .eq("user_id", userId)
    .order("appointment_start", { ascending: false });
  if (error) {
    console.warn("[membershipService] consultation_requests table unavailable:", error.message);
    return [];
  }
  return data ?? [];
}

/**
 * EVERY patient's consultations — deliberately unscoped, for the doctor's
 * dashboard. Returns rows only for a viewer the "Admins can view all
 * consultation requests" policy admits; anyone else gets their own rows, so
 * this can never leak. Split out from getMyConsultationRequests so that a
 * screen wanting all patients has to say so at the call site, rather than
 * depending on an RLS side effect that looks identical to a personal query.
 */
export async function getAllConsultationRequests(): Promise<ConsultationRequest[]> {
  const demoMode = getDemoMode();
  if (demoMode) return demoMode === "doctor" ? DEMO_DOCTOR_CONSULTATIONS : [DEMO_CONSULTATION];
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("consultation_requests")
    .select(CONSULTATION_COLUMNS)
    .order("appointment_start", { ascending: false });
  if (error) {
    console.warn("[membershipService] consultation_requests table unavailable:", error.message);
    return [];
  }
  return data ?? [];
}

import { supabase } from "@/lib/supabase";
import { getDemoMode, DEMO_DOCTOR_ID } from "@/dev/demoMode";
import {
  DEMO_PATIENTS,
  DEMO_NEEDS_REVIEW,
  DEMO_DOCTOR_PROFILE,
  DEMO_PATIENT_OVERVIEWS,
  DEMO_DOCTOR_ACTIVITY_FEED,
  DEMO_ACTIVE_PROGRAMS_SUMMARY,
  type DoctorActivityKind,
} from "@/dev/demoFixtures";
import { currentProgramDayNumber } from "@/services/programService";

export type { DoctorActivityKind };

export type RelationshipStatus = "pending" | "active" | "ended";

export interface DoctorPatientRow {
  id: string;
  doctor_id: string;
  patient_id: string;
  status: RelationshipStatus;
  requested_by: string;
  created_at: string;
}

export interface PatientSummary {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  relationshipId: string;
  status: RelationshipStatus;
}

async function currentUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/** Patient-side: request to connect with a doctor. */
export async function requestDoctorConnection(
  doctorId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (getDemoMode()) return { ok: true };
  if (!supabase) return { ok: false, error: "Not connected." };
  const { error } = await supabase.rpc("request_doctor_connection", { p_doctor_id: doctorId });
  if (error) {
    if (error.message.includes("ALREADY_CONNECTED"))
      return { ok: false, error: "Already connected or pending." };
    return { ok: false, error: "Could not send request." };
  }
  return { ok: true };
}

/** Patient-side: their own relationship rows (usually just one). */
export async function getMyDoctorRelationships(): Promise<DoctorPatientRow[]> {
  if (getDemoMode()) return [];
  if (!supabase) return [];
  const userId = await currentUserId();
  if (!userId) return [];
  const { data, error } = await supabase
    .from("doctor_patient_relationships")
    .select("id, doctor_id, patient_id, status, requested_by, created_at")
    .eq("patient_id", userId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return data ?? [];
}

/** Doctor-side: list of patients with an active or pending relationship. */
export async function getMyPatients(): Promise<PatientSummary[]> {
  if (getDemoMode()) return DEMO_PATIENTS;
  if (!supabase) return [];
  const userId = await currentUserId();
  if (!userId) return [];

  const { data: relationships, error } = await supabase
    .from("doctor_patient_relationships")
    .select("id, patient_id, status")
    .eq("doctor_id", userId)
    .in("status", ["pending", "active"])
    .order("created_at", { ascending: false });

  if (error || !relationships || relationships.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url")
    .in(
      "id",
      relationships.map((r) => r.patient_id),
    );

  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
  return relationships.map((r) => {
    const profile = byId.get(r.patient_id);
    return {
      id: r.patient_id,
      username: profile?.username ?? null,
      full_name: profile?.full_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
      relationshipId: r.id,
      status: r.status as RelationshipStatus,
    };
  });
}

export async function respondDoctorConnection(
  relationshipId: string,
  accept: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (getDemoMode()) return { ok: true };
  if (!supabase) return { ok: false, error: "Not connected." };
  const { error } = await supabase.rpc("respond_doctor_connection", {
    p_relationship_id: relationshipId,
    p_accept: accept,
  });
  if (error) return { ok: false, error: "Could not update the connection." };
  return { ok: true };
}

export async function endDoctorConnection(
  relationshipId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (getDemoMode()) return { ok: true };
  if (!supabase) return { ok: false, error: "Not connected." };
  const { error } = await supabase.rpc("end_doctor_connection", {
    p_relationship_id: relationshipId,
  });
  if (error) return { ok: false, error: "Could not end the connection." };
  return { ok: true };
}

export interface PatientNeedsReview {
  patientId: string;
  full_name: string | null;
  username: string | null;
  reason: "no_recent_meals" | "no_weight_logged";
}

/**
 * Operational reminders only (§84) — never framed as medical alerts. Reads
 * from the doctor_patient_activity_summary view added in Phase H. That view
 * is security_invoker (PHASE_J_FIXES_MIGRATION.sql J.1), so the caller's own
 * RLS on the underlying tables scopes the rows; the explicit doctor_id filter
 * below is defence in depth, not the only thing standing between one doctor
 * and another doctor's roster.
 */
export async function getPatientsNeedingReview(): Promise<PatientNeedsReview[]> {
  if (getDemoMode()) return DEMO_NEEDS_REVIEW;
  if (!supabase) return [];
  const userId = await currentUserId();
  if (!userId) return [];
  const { data, error } = await supabase
    .from("doctor_patient_activity_summary")
    .select("patient_id, last_meal_at, last_weight_at")
    .eq("doctor_id", userId);
  if (error || !data || data.length === 0) return [];

  const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
  const flagged = data.filter(
    (row) => !row.last_meal_at || new Date(row.last_meal_at).getTime() < threeDaysAgo,
  );
  if (flagged.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, full_name")
    .in(
      "id",
      flagged.map((f) => f.patient_id),
    );
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

  return flagged.map((f) => ({
    patientId: f.patient_id,
    full_name: byId.get(f.patient_id)?.full_name ?? null,
    username: byId.get(f.patient_id)?.username ?? null,
    reason: "no_recent_meals" as const,
  }));
}

export interface PatientOverview {
  patientId: string;
  full_name: string | null;
  username: string | null;
  programDay: number | null;
  programTotalDays: number | null;
  lastMealAgo: string | null;
  caloriesToday: number | null;
  caloriesTarget: number | null;
  steps: number | null;
  status: "active" | "needs_review" | "no_recent_logs" | "program_pending";
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

/**
 * Richer per-patient row data for the Doctor Command Center's patient list
 * (§43-44) — one parallel fetch per active patient, reusing the same
 * per-table RLS every other doctor query already relies on
 * (has_active_doctor_relationship()). A doctor's patient list is typically
 * small (dozens, not thousands), so N parallel per-patient reads is a
 * reasonable tradeoff against a much larger bespoke aggregate-view/RPC.
 */
export async function getMyPatientOverviews(): Promise<PatientOverview[]> {
  if (getDemoMode()) {
    return DEMO_PATIENT_OVERVIEWS.map((o) => ({ ...o }));
  }
  if (!supabase) return [];

  const patients = await getMyPatients();
  const active = patients.filter((p) => p.status === "active");
  const needsReview = await getPatientsNeedingReview();
  const needsReviewIds = new Set(needsReview.map((r) => r.patientId));

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const dateStr = todayStart.toISOString().slice(0, 10);

  const overviews = await Promise.all(
    active.map(async (p): Promise<PatientOverview> => {
      const [mealsResult, targetResult, programResult, stepsResult] = await Promise.all([
        supabase!
          .from("meal_logs")
          .select("total_calories, meal_time")
          .eq("user_id", p.id)
          .gte("meal_time", todayStart.toISOString())
          .order("meal_time", { ascending: false }),
        supabase!
          .from("daily_targets")
          .select("daily_target")
          .eq("user_id", p.id)
          .eq("is_current", true)
          .maybeSingle(),
        supabase!
          .from("nutrition_programs")
          .select("start_date")
          .eq("patient_id", p.id)
          .eq("status", "active")
          .order("start_date", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase!
          .from("step_logs")
          .select("steps")
          .eq("user_id", p.id)
          .eq("date", dateStr)
          .maybeSingle(),
      ]);

      const meals = mealsResult.data ?? [];
      const caloriesToday = meals.length
        ? meals.reduce((sum, m) => sum + m.total_calories, 0)
        : null;
      const lastMealAgo = meals[0]?.meal_time ? timeAgo(meals[0].meal_time) : null;
      const programDay = programResult.data
        ? currentProgramDayNumber({
            id: "",
            patient_id: p.id,
            doctor_id: "",
            title: "",
            start_date: programResult.data.start_date,
            end_date: "",
            goal: null,
            daily_calorie_target: null,
            general_instructions: null,
            status: "active",
            is_template: false,
          })
        : null;

      const status: PatientOverview["status"] = needsReviewIds.has(p.id)
        ? "needs_review"
        : !programResult.data
          ? "program_pending"
          : "active";

      return {
        patientId: p.id,
        full_name: p.full_name,
        username: p.username,
        programDay,
        programTotalDays: programResult.data ? 30 : null,
        lastMealAgo,
        caloriesToday,
        caloriesTarget: targetResult.data?.daily_target ?? null,
        steps: stepsResult.data?.steps ?? null,
        status,
      };
    }),
  );

  return overviews;
}

export interface PatientActivityEvent {
  id: string;
  patientName: string;
  kind: DoctorActivityKind;
  summary: string;
  at: string;
}

/** "Recent Patient Activity" (§41) — a compact cross-patient timeline, distinct from the friends-only social feed. */
export async function getRecentPatientActivity(limit = 10): Promise<PatientActivityEvent[]> {
  if (getDemoMode()) {
    return DEMO_DOCTOR_ACTIVITY_FEED.map((e) => ({
      id: e.id,
      patientName: e.patientName,
      kind: e.kind,
      summary: e.summary,
      at: e.at,
    })).slice(0, limit);
  }
  if (!supabase) return [];

  const patients = (await getMyPatients()).filter((p) => p.status === "active");
  if (patients.length === 0) return [];
  const patientIds = patients.map((p) => p.id);
  const nameById = new Map(patients.map((p) => [p.id, p.full_name?.split(" ")[0] ?? "Patient"]));

  const [meals, weights, activities] = await Promise.all([
    supabase
      .from("meal_logs")
      .select("id, user_id, meal_type, total_calories, meal_time")
      .in("user_id", patientIds)
      .order("meal_time", { ascending: false })
      .limit(limit),
    supabase
      .from("weight_logs")
      .select("id, user_id, logged_at")
      .in("user_id", patientIds)
      .order("logged_at", { ascending: false })
      .limit(limit),
    supabase
      .from("activity_logs")
      .select("id, user_id, completed_at, duration_minutes, activity_id, activity_library(name)")
      .in("user_id", patientIds)
      .order("completed_at", { ascending: false })
      .limit(limit),
  ]);

  const events: PatientActivityEvent[] = [
    ...(meals.data ?? []).map((m) => ({
      id: `meal-${m.id}`,
      patientName: nameById.get(m.user_id) ?? "Patient",
      kind: "meal" as const,
      summary: `logged ${m.meal_type ?? "a meal"} — ${Math.round(m.total_calories)} kcal`,
      at: m.meal_time,
    })),
    ...(weights.data ?? []).map((w) => ({
      id: `weight-${w.id}`,
      patientName: nameById.get(w.user_id) ?? "Patient",
      kind: "weight" as const,
      summary: "updated weight",
      at: w.logged_at,
    })),
    ...(activities.data ?? []).map((a) => {
      const activityName = (a as unknown as { activity_library?: { name?: string } })
        .activity_library?.name;
      return {
        id: `activity-${a.id}`,
        patientName: nameById.get(a.user_id) ?? "Patient",
        kind: "movement" as const,
        summary: activityName ? `completed ${activityName}` : "completed an activity",
        at: a.completed_at,
      };
    }),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, limit);

  return events;
}

/** "Active Programs" summary metric (§49). */
export async function getActiveProgramsSummary(): Promise<{ active: number; draft: number }> {
  if (getDemoMode()) return { ...DEMO_ACTIVE_PROGRAMS_SUMMARY };
  if (!supabase) return { active: 0, draft: 0 };

  const doctorId = await currentUserId();
  if (!doctorId) return { active: 0, draft: 0 };

  const { data } = await supabase
    .from("nutrition_programs")
    .select("status")
    .eq("doctor_id", doctorId)
    .eq("is_template", false);

  const rows = data ?? [];
  return {
    active: rows.filter((r) => r.status === "active").length,
    draft: rows.filter((r) => r.status === "draft").length,
  };
}

/** The single practice doctor/admin — used by "Connect With Doctor" in onboarding. Returns the first admin/doctor profile found. */
export async function getPracticeDoctor(): Promise<{
  id: string;
  full_name: string | null;
} | null> {
  if (getDemoMode()) return { id: DEMO_DOCTOR_ID, full_name: DEMO_DOCTOR_PROFILE.full_name };
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("role", ["doctor", "admin"])
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return data;
}

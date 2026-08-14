import { supabase } from "@/lib/supabase";

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
  if (!supabase) return { ok: false, error: "Not connected." };
  const { error } = await supabase.rpc("end_doctor_connection", {
    p_relationship_id: relationshipId,
  });
  if (error) return { ok: false, error: "Could not end the connection." };
  return { ok: true };
}

/** The single practice doctor/admin — used by "Connect With Doctor" in onboarding. Returns the first admin/doctor profile found. */
export async function getPracticeDoctor(): Promise<{
  id: string;
  full_name: string | null;
} | null> {
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

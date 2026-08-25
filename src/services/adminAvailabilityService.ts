import { supabase } from "@/lib/supabase";

export interface DoctorAvailabilityRow {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  timezone: string;
  is_active: boolean;
  slot_duration_minutes: number;
}

export interface AvailabilityException {
  id: string;
  date: string;
  type: string;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
  is_available: boolean;
}

export interface AdminAppointment {
  id: string;
  appointmentStart: string;
  appointmentEnd: string;
  status: string;
  consultationType: string | null;
  meetUrl: string | null;
  clientName: string;
  clientEmail: string | null;
  packageName: string | null;
}

async function callAdmin<T>(
  action: string,
  extra: Record<string, unknown> = {},
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: "Not connected yet." };
  try {
    const { data, error } = await supabase.functions.invoke<T & { error?: string }>(
      "admin-availability",
      {
        body: { action, ...extra },
      },
    );
    if (error) {
      const status = (error as { context?: { status?: number } }).context?.status;
      if (status === 403) return { ok: false, error: "You don't have access to this area." };
      return { ok: false, error: "Something went wrong. Please try again." };
    }
    if (!data) return { ok: false, error: "Something went wrong. Please try again." };
    if ("error" in data && data.error) return { ok: false, error: data.error };
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

export function listDoctorAvailability() {
  return callAdmin<{ availability: DoctorAvailabilityRow[] }>("list-availability");
}

export function updateDoctorAvailability(input: {
  id: string;
  isActive?: boolean;
  startTime?: string;
  endTime?: string;
  slotDurationMinutes?: number;
  /** IANA name, e.g. "Asia/Dubai". Validated server-side before it is stored. */
  timezone?: string;
}) {
  return callAdmin<{ availability: DoctorAvailabilityRow }>("update-availability", input);
}

/**
 * Adds a recurring weekly block. The seed migration created only Monday,
 * Wednesday and Friday, and until this existed there was no way to open a
 * fourth day — the page could only ever edit rows that already existed.
 *
 * More than one block per day is allowed on purpose: the table has no unique
 * constraint on day_of_week, and generateAvailableSlots() iterates every
 * matching row, so a split day (morning and evening) works.
 */
export function createDoctorAvailability(input: {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timezone: string;
  slotDurationMinutes?: number;
  isActive?: boolean;
}) {
  return callAdmin<{ availability: DoctorAvailabilityRow }>("create-availability", input);
}

/** Removes a recurring block. Already-booked appointments are unaffected. */
export function deleteDoctorAvailability(id: string) {
  return callAdmin<{ ok: true }>("delete-availability", { id });
}

export function listAvailabilityExceptions() {
  return callAdmin<{ exceptions: AvailabilityException[] }>("list-exceptions");
}

export function createAvailabilityException(input: {
  date: string;
  type: string;
  startTime?: string;
  endTime?: string;
  reason?: string;
  isAvailable: boolean;
}) {
  return callAdmin<{ exception: AvailabilityException }>("create-exception", input);
}

export function deleteAvailabilityException(id: string) {
  return callAdmin<{ ok: true }>("delete-exception", { id });
}

export function listAdminAppointments(range: "today" | "week" | "upcoming") {
  return callAdmin<{ appointments: AdminAppointment[] }>("list-appointments", { range });
}

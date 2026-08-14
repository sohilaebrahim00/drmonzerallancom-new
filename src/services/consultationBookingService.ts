import { supabase } from "@/lib/supabase";

export interface BookConsultationInput {
  startUtc: string;
  clientTimeZone: string;
  consultationType: string;
  reason?: string;
}

export interface ConfirmedAppointment {
  id: string;
  appointmentStart: string;
  appointmentEnd: string;
  clientLocalTime: string;
  dubaiTime: string;
  meetUrl: string;
}

export type BookConsultationFailureReason =
  | "not-authenticated"
  | "not-member"
  | "minimum-notice"
  | "slot-taken"
  | "slot-unavailable"
  | "scheduling-not-connected"
  | "rate-limited"
  | "other";

export type BookConsultationResult =
  | { ok: true; appointment: ConfirmedAppointment; creditsRemaining: number; creditsLimit: number }
  | {
      ok: false;
      error: string;
      reason?: BookConsultationFailureReason;
      actions?: { label: string; route: string }[];
    };

/**
 * Calls create-consultation — the only place a booking is ever confirmed.
 * Never trust the response's own honesty claims client-side beyond what it
 * says: on any non-"ok:true" result, nothing was booked and no credit was
 * spent (the backend rolls back atomically before responding).
 */
export async function bookConsultation(
  input: BookConsultationInput,
): Promise<BookConsultationResult> {
  if (!supabase) {
    return { ok: false, error: "Consultation scheduling isn't connected yet.", reason: "other" };
  }
  try {
    const { data, error } = await supabase.functions.invoke<
      | {
          ok: true;
          appointment: ConfirmedAppointment;
          creditsRemaining: number;
          creditsLimit: number;
        }
      | { ok: false; error: string; reason?: string; actions?: { label: string; route: string }[] }
    >("create-consultation", { body: input });

    if (error) {
      const status = (error as { context?: { status?: number } }).context?.status;
      if (status === 429) {
        return {
          ok: false,
          error: "Please wait a moment before trying again.",
          reason: "rate-limited",
        };
      }
      return { ok: false, error: "Could not book this consultation right now.", reason: "other" };
    }
    if (!data) {
      return { ok: false, error: "Could not book this consultation right now.", reason: "other" };
    }
    if (data.ok) {
      return data;
    }
    return {
      ok: false,
      error: data.error,
      reason: (data.reason as BookConsultationFailureReason) ?? "other",
      actions: data.actions,
    };
  } catch {
    return { ok: false, error: "Could not book this consultation right now.", reason: "other" };
  }
}

/** Cancels a member's own upcoming consultation via the ownership-checked cancel_my_consultation RPC. */
export async function cancelMyConsultation(
  requestId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: "Not connected yet." };
  const { error } = await supabase.rpc("cancel_my_consultation", { p_request_id: requestId });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

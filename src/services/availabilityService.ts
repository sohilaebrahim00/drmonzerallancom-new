import { supabase } from "@/lib/supabase";

export interface SlotInfo {
  /** ISO 8601 UTC instant. */
  startUtc: string;
  endUtc: string;
}

export type GetAvailabilityResult = { ok: true; slots: SlotInfo[] } | { ok: false; error: string };

/**
 * Calls the get-availability Edge Function, which computes real bookable
 * slots server-side from the doctor's actual schedule, exceptions, and
 * existing bookings. This is public — visitors can see available times
 * before joining — but nothing here can be trusted to *confirm* a
 * booking; create-consultation re-validates independently.
 */
export async function getAvailableSlots(daysAhead = 21): Promise<GetAvailabilityResult> {
  if (!supabase) {
    return { ok: false, error: "Consultation scheduling isn't connected yet." };
  }
  try {
    const { data, error } = await supabase.functions.invoke<{ slots?: SlotInfo[]; error?: string }>(
      "get-availability",
      { body: { daysAhead } },
    );
    if (error || !data?.slots) {
      return { ok: false, error: data?.error ?? "Could not load available consultation times." };
    }
    return { ok: true, slots: data.slots };
  } catch {
    return { ok: false, error: "Could not load available consultation times." };
  }
}

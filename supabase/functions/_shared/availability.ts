// Shared, deterministic availability/slot-computation logic used by both
// get-availability (what the client sees) and create-consultation (the
// authoritative re-check before booking) — one implementation, so the two
// can never disagree about what's actually bookable.

export const DOCTOR_TIMEZONE = "Asia/Dubai";
export const MINIMUM_BOOKING_NOTICE_HOURS = 48;
export const DEFAULT_SLOT_DURATION_MINUTES = 30;

// deno-lint-ignore no-explicit-any
type SupabaseLike = any;

export interface SlotInfo {
  /** ISO 8601 UTC instant. */
  startUtc: string;
  endUtc: string;
}

/** Timezone offset, in minutes to ADD to a UTC instant to get local wall-clock time. */
function getTimeZoneOffsetMinutes(instant: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(instant);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  const asUtcMs = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second),
  );
  return (asUtcMs - instant.getTime()) / 60_000;
}

/** Converts a wall-clock date + "HH:MM" time in `timeZone` to the true UTC instant. */
export function zonedTimeToUtc(dateStr: string, timeStr: string, timeZone: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  const naiveGuess = new Date(Date.UTC(y, m - 1, d, hh, mm, 0));
  const offsetMinutes = getTimeZoneOffsetMinutes(naiveGuess, timeZone);
  return new Date(naiveGuess.getTime() - offsetMinutes * 60_000);
}

/** Formats a UTC instant as wall-clock date/time strings in `timeZone`, for display. */
export function formatInZone(instant: Date, timeZone: string) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return dtf.format(instant);
}

interface AvailabilityRow {
  day_of_week: number;
  start_time: string;
  end_time: string;
  timezone: string;
  slot_duration_minutes: number;
}

interface ExceptionRow {
  date: string;
  type: string;
  start_time: string | null;
  end_time: string | null;
  is_available: boolean;
}

/**
 * Generates every truly bookable slot over the next `daysAhead` days: the
 * recurring weekly schedule, minus dates fully blocked by an exception,
 * with exception custom-hours substituted in where present, minus slots
 * that already have a confirmed/pending booking, minus anything inside the
 * 48-hour minimum notice window.
 */
export async function generateAvailableSlots(
  supabaseAdmin: SupabaseLike,
  daysAhead = 21,
): Promise<SlotInfo[]> {
  const now = new Date();
  const minStart = new Date(now.getTime() + MINIMUM_BOOKING_NOTICE_HOURS * 3_600_000);
  const todayStr = now.toISOString().slice(0, 10);

  const [{ data: availabilityRows }, { data: exceptionRows }, { data: bookedRows }] = await Promise.all([
    supabaseAdmin.from("doctor_availability").select("*").eq("is_active", true),
    supabaseAdmin.from("availability_exceptions").select("*").gte("date", todayStr),
    supabaseAdmin
      .from("consultation_requests")
      .select("appointment_start")
      .in("status", ["pending", "confirmed", "rescheduled"])
      .gte("appointment_start", now.toISOString()),
  ]);

  const bookedSet = new Set<number>(
    ((bookedRows as { appointment_start: string }[] | null) ?? []).map((r) =>
      new Date(r.appointment_start).getTime(),
    ),
  );

  const exceptionsByDate = new Map<string, ExceptionRow[]>();
  for (const ex of (exceptionRows as ExceptionRow[] | null) ?? []) {
    const list = exceptionsByDate.get(ex.date) ?? [];
    list.push(ex);
    exceptionsByDate.set(ex.date, list);
  }

  const slots: SlotInfo[] = [];

  // Iterating calendar days in UTC is safe here specifically because the
  // doctor's configured hours (afternoon/evening Gulf Standard Time) never
  // cross a UTC midnight boundary — this would need adjusting for a
  // timezone/schedule where that's not true.
  for (let i = 0; i < daysAhead; i++) {
    const day = new Date(now.getTime() + i * 86_400_000);
    const dateStr = day.toISOString().slice(0, 10);
    const dayOfWeek = day.getUTCDay();
    const dayExceptions = exceptionsByDate.get(dateStr) ?? [];

    const blockingException = dayExceptions.find((e) => !e.is_available);
    if (blockingException) continue;

    const customWindows = dayExceptions.filter((e) => e.is_available && e.start_time && e.end_time);
    const recurringRows = ((availabilityRows as AvailabilityRow[] | null) ?? []).filter(
      (r) => r.day_of_week === dayOfWeek,
    );

    const windows =
      customWindows.length > 0
        ? customWindows.map((e) => ({
            start: e.start_time as string,
            end: e.end_time as string,
            duration: recurringRows[0]?.slot_duration_minutes ?? DEFAULT_SLOT_DURATION_MINUTES,
            timezone: recurringRows[0]?.timezone ?? DOCTOR_TIMEZONE,
          }))
        : recurringRows.map((r) => ({
            start: r.start_time,
            end: r.end_time,
            duration: r.slot_duration_minutes,
            timezone: r.timezone,
          }));

    for (const w of windows) {
      const windowStartUtc = zonedTimeToUtc(dateStr, w.start.slice(0, 5), w.timezone);
      const windowEndUtc = zonedTimeToUtc(dateStr, w.end.slice(0, 5), w.timezone);
      let cursor = windowStartUtc;
      while (cursor.getTime() + w.duration * 60_000 <= windowEndUtc.getTime()) {
        const slotEnd = new Date(cursor.getTime() + w.duration * 60_000);
        if (cursor.getTime() >= minStart.getTime() && !bookedSet.has(cursor.getTime())) {
          slots.push({ startUtc: cursor.toISOString(), endUtc: slotEnd.toISOString() });
        }
        cursor = slotEnd;
      }
    }
  }

  slots.sort((a, b) => a.startUtc.localeCompare(b.startUtc));
  return slots;
}

/** Re-validates a specific proposed slot against real-time availability — never trust the client's claim alone. */
export async function isSlotStillAvailable(supabaseAdmin: SupabaseLike, startUtcIso: string): Promise<boolean> {
  const slots = await generateAvailableSlots(supabaseAdmin);
  return slots.some((s) => s.startUtc === startUtcIso);
}

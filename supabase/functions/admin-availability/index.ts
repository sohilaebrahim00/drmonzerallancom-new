// Supabase Edge Function (Deno) — doctor/admin availability management and
// appointment schedule view. Every request is checked server-side against
// profiles.role in ('doctor','admin'); this is never exposed to ordinary
// members. See resolveStaffUser below, including why widening that check does
// not make the booking system multi-doctor.
//
// NOT DEPLOYED. Deploy with `supabase functions deploy admin-availability`.
// Required secret: SUPABASE_SERVICE_ROLE_KEY (SUPABASE_URL is automatic).

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { corsHeaders } from "../_shared/cors.ts";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

const PACKAGE_NAMES: Record<string, string> = { basic: "Basic", premium: "Premium", "vip-elite": "VIP Elite" };

/**
 * Allows role in ('doctor', 'admin') — the same predicate as the SQL helper
 * public.is_doctor() and as DoctorRoute on the client. Until Phase 6A this
 * accepted only profiles.is_admin, which meant a user with role = 'doctor'
 * passed the UI gate, saw the availability screen, and then had every call
 * rejected with 403. The two gates now agree.
 *
 * `is_admin` is still honoured on its own: CONSULTATION_BOOKING_MIGRATION.sql
 * documents making someone an admin by setting that column by hand, which
 * leaves role = 'user'. public.is_admin() has the same `is_admin or role =
 * 'admin'` shape for the same reason.
 *
 * SINGLE-DOCTOR BY DESIGN — read before adding a second doctor. Widening this
 * check does NOT make the booking system multi-doctor. Verified against the
 * live catalogue on 2026-08-25:
 *   doctor_availability  — id, day_of_week, start_time, end_time, timezone,
 *                          is_active, slot_duration_minutes, created_at, updated_at
 *   consultation_requests — id, user_id (the PATIENT), subscription_id,
 *                          appointment_start, appointment_end, ...
 * Neither table has a doctor_id. There is exactly one weekly schedule and one
 * appointment book for the whole practice, so a second doctor here would edit
 * the first doctor's hours and see the first doctor's appointments. Supporting
 * two doctors needs a schema change — doctor_id on both tables, RLS and slot
 * generation scoped to it, and a doctor picker in the booking flow — not just
 * this widening.
 */
async function resolveStaffUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length);
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("is_admin, role")
    .eq("id", data.user.id)
    .maybeSingle();
  if (!profile) return null;
  const allowed = profile.is_admin === true || profile.role === "doctor" || profile.role === "admin";
  if (!allowed) return null;

  return data.user;
}

// Curried so the per-request CORS headers (which now depend on the caller's
// Origin) can be bound once inside the handler without touching any of the
// 17 json(...) call sites below.
function jsonWith(cors: Record<string, string>) {
  return (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });
}

interface RequestBody {
  action: string;
  [key: string]: unknown;
}

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * An unrecognised timezone would be written straight into
 * doctor_availability.timezone (the column is plain text), and
 * _shared/availability.ts feeds it to Intl.DateTimeFormat when generating
 * slots — where it throws, taking down availability for EVERY day, not just
 * the bad row. Validate on the way in.
 */
function isValidTimeZone(tz: string): boolean {
  if (!tz || tz.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

serve(async (req) => {
  const CORS_HEADERS = corsHeaders(req);
  const json = jsonWith(CORS_HEADERS);
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });

  const staff = await resolveStaffUser(req);
  if (!staff) {
    return json({ error: "Not authorized." }, 403);
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  switch (body.action) {
    case "list-availability": {
      const { data, error } = await supabaseAdmin
        .from("doctor_availability")
        .select("*")
        .order("day_of_week", { ascending: true });
      if (error) return json({ error: error.message }, 500);
      return json({ availability: data });
    }

    case "update-availability": {
      const { id, isActive, startTime, endTime, slotDurationMinutes, timezone } =
        body as unknown as {
          id: string;
          isActive?: boolean;
          startTime?: string;
          endTime?: string;
          slotDurationMinutes?: number;
          timezone?: string;
        };
      if (!id) return json({ error: "id is required." }, 400);
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (typeof isActive === "boolean") patch.is_active = isActive;
      if (typeof startTime === "string") {
        if (!TIME_PATTERN.test(startTime)) return json({ error: "Start time must be HH:MM." }, 400);
        patch.start_time = startTime;
      }
      if (typeof endTime === "string") {
        if (!TIME_PATTERN.test(endTime)) return json({ error: "End time must be HH:MM." }, 400);
        patch.end_time = endTime;
      }
      if (typeof slotDurationMinutes === "number" && slotDurationMinutes > 0) {
        patch.slot_duration_minutes = Math.floor(slotDurationMinutes);
      }
      if (typeof timezone === "string") {
        if (!isValidTimeZone(timezone)) {
          return json({ error: `"${timezone}" is not a recognised timezone.` }, 400);
        }
        patch.timezone = timezone;
      }
      const { data, error } = await supabaseAdmin
        .from("doctor_availability")
        .update(patch)
        .eq("id", id)
        .select()
        .maybeSingle();
      // The table's `check (end_time > start_time)` can reject an otherwise
      // valid-looking patch (e.g. moving start past the existing end), so this
      // surfaces the real reason rather than a generic failure.
      if (error) return json({ error: error.message }, 400);
      if (!data) return json({ error: "That schedule row no longer exists." }, 404);
      return json({ availability: data });
    }

    case "create-availability": {
      const { dayOfWeek, startTime, endTime, timezone, slotDurationMinutes, isActive } =
        body as unknown as {
          dayOfWeek: number;
          startTime: string;
          endTime: string;
          timezone: string;
          slotDurationMinutes?: number;
          isActive?: boolean;
        };

      if (typeof dayOfWeek !== "number" || !Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
        return json({ error: "dayOfWeek must be an integer 0-6 (0 = Sunday)." }, 400);
      }
      if (typeof startTime !== "string" || !TIME_PATTERN.test(startTime)) {
        return json({ error: "Start time must be HH:MM." }, 400);
      }
      if (typeof endTime !== "string" || !TIME_PATTERN.test(endTime)) {
        return json({ error: "End time must be HH:MM." }, 400);
      }
      if (endTime <= startTime) {
        return json({ error: "End time must be after start time." }, 400);
      }
      if (typeof timezone !== "string" || !isValidTimeZone(timezone)) {
        return json({ error: "A recognised timezone is required." }, 400);
      }
      const duration =
        typeof slotDurationMinutes === "number" && slotDurationMinutes > 0
          ? Math.floor(slotDurationMinutes)
          : 30;

      const { data, error } = await supabaseAdmin
        .from("doctor_availability")
        .insert({
          day_of_week: dayOfWeek,
          start_time: startTime,
          end_time: endTime,
          timezone,
          slot_duration_minutes: duration,
          is_active: typeof isActive === "boolean" ? isActive : true,
        })
        .select()
        .maybeSingle();
      if (error) return json({ error: error.message }, 400);
      return json({ availability: data });
    }

    case "delete-availability": {
      const { id } = body as unknown as { id: string };
      if (!id) return json({ error: "id is required." }, 400);
      // Deleting a schedule row only stops FUTURE slots being generated;
      // consultation_requests already booked against those times are separate
      // rows and are deliberately left untouched. The doctor cancels those
      // from the appointments list, which also returns the member's credit.
      const { error } = await supabaseAdmin.from("doctor_availability").delete().eq("id", id);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    case "list-exceptions": {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabaseAdmin
        .from("availability_exceptions")
        .select("*")
        .gte("date", today)
        .order("date", { ascending: true });
      if (error) return json({ error: error.message }, 500);
      return json({ exceptions: data });
    }

    case "create-exception": {
      const { date, type, startTime, endTime, reason, isAvailable } = body as unknown as {
        date: string;
        type: string;
        startTime?: string;
        endTime?: string;
        reason?: string;
        isAvailable: boolean;
      };
      if (!date || !type) return json({ error: "date and type are required." }, 400);
      const { data, error } = await supabaseAdmin
        .from("availability_exceptions")
        .insert({
          date,
          type,
          start_time: startTime || null,
          end_time: endTime || null,
          reason: (reason ?? "").slice(0, 300) || null,
          is_available: Boolean(isAvailable),
        })
        .select()
        .maybeSingle();
      if (error) return json({ error: error.message }, 500);
      return json({ exception: data });
    }

    case "delete-exception": {
      const { id } = body as unknown as { id: string };
      if (!id) return json({ error: "id is required." }, 400);
      const { error } = await supabaseAdmin.from("availability_exceptions").delete().eq("id", id);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    case "list-appointments": {
      const range = (body as { range?: string }).range ?? "upcoming";
      const now = new Date();
      let fromIso = now.toISOString();
      let toIso: string | null = null;
      if (range === "today") {
        const end = new Date(now);
        end.setUTCHours(23, 59, 59, 999);
        toIso = end.toISOString();
      } else if (range === "week") {
        const end = new Date(now.getTime() + 7 * 86_400_000);
        toIso = end.toISOString();
      }

      let query = supabaseAdmin
        .from("consultation_requests")
        .select("id, user_id, appointment_start, appointment_end, status, consultation_type, google_meet_url")
        .in("status", ["pending", "confirmed", "rescheduled"])
        .gte("appointment_start", fromIso)
        .order("appointment_start", { ascending: true });
      if (toIso) query = query.lte("appointment_start", toIso);

      const { data: appointments, error } = await query;
      if (error) return json({ error: error.message }, 500);

      const userIds = Array.from(new Set((appointments ?? []).map((a) => a.user_id)));
      const [profilesRes, subsRes] = await Promise.all([
        supabaseAdmin.from("profiles").select("id, full_name").in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]),
        supabaseAdmin
          .from("subscriptions")
          .select("user_id, package_id")
          .in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"])
          .eq("status", "active"),
      ]);
      const nameById = new Map((profilesRes.data ?? []).map((p) => [p.id, p.full_name as string | null]));
      const packageById = new Map((subsRes.data ?? []).map((s) => [s.user_id, s.package_id as string]));

      const emailById = new Map<string, string>();
      await Promise.all(
        userIds.map(async (id) => {
          const { data } = await supabaseAdmin.auth.admin.getUserById(id);
          if (data.user?.email) emailById.set(id, data.user.email);
        }),
      );

      const enriched = (appointments ?? []).map((a) => ({
        id: a.id,
        appointmentStart: a.appointment_start,
        appointmentEnd: a.appointment_end,
        status: a.status,
        consultationType: a.consultation_type,
        meetUrl: a.google_meet_url,
        clientName: nameById.get(a.user_id) ?? "Member",
        clientEmail: emailById.get(a.user_id) ?? null,
        packageName: PACKAGE_NAMES[packageById.get(a.user_id) ?? ""] ?? packageById.get(a.user_id) ?? null,
      }));

      return json({ appointments: enriched });
    }

    default:
      return json({ error: "Unknown action." }, 400);
  }
});

// Supabase Edge Function (Deno) — the ONLY place a consultation booking is
// ever confirmed. Implements the full server-authoritative flow: verify
// membership + credit + the 48-hour minimum notice + real-time slot
// availability, atomically reserve the slot and the credit together, then
// create a REAL Google Calendar event with a REAL Google Meet link before
// treating anything as booked. If the Google step fails or isn't
// configured, the reservation and credit are rolled back — a visitor is
// never left with a spent credit and no real meeting, and no fake Meet
// link is ever generated.
//
// NOT DEPLOYED. Deploy with `supabase functions deploy create-consultation`.
// Required secrets: SUPABASE_SERVICE_ROLE_KEY, and — for real Google Meet
// links — GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN,
// GOOGLE_CALENDAR_ID. Email secrets (RESEND_API_KEY, EMAIL_FROM,
// ADMIN_NOTIFICATION_EMAIL) are optional — sendEmail() no-ops without them.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { corsHeaders } from "../_shared/cors.ts";
import {
  DOCTOR_TIMEZONE,
  MINIMUM_BOOKING_NOTICE_HOURS,
  formatInZone,
  generateAvailableSlots,
} from "../_shared/availability.ts";
import { cancelConsultationEvent, createConsultationEvent, isGoogleCalendarConfigured } from "../_shared/googleCalendar.ts";
import {
  ADMIN_NOTIFICATION_EMAIL,
  consultationConfirmedAdminEmail,
  consultationConfirmedClientEmail,
  sendEmail,
} from "../_shared/email.ts";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);
const siteUrl = Deno.env.get("SITE_URL") ?? "https://monzerallan.com";

const NOT_CONFIGURED_MESSAGE =
  "Online scheduling is being activated. Your membership and consultation credits are ready, but live meeting scheduling is not yet connected.";
const SLOT_TAKEN_MESSAGE = "This time is no longer available. Please choose another appointment.";
const MEMBERSHIP_REQUIRED_MESSAGE = "Online consultations are available to active members.";

const PACKAGE_NAMES: Record<string, string> = { basic: "Basic", premium: "Premium", "vip-elite": "VIP Elite" };

const requestLog = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 6;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(key) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  timestamps.push(now);
  requestLog.set(key, timestamps);
  return timestamps.length > RATE_LIMIT_MAX_REQUESTS;
}

async function resolveAuthenticatedUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length);
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

interface RequestBody {
  startUtc: string;
  clientTimeZone?: string;
  consultationType?: string;
  reason?: string;
}

serve(async (req) => {
  const CORS_HEADERS = corsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
  }

  const user = await resolveAuthenticatedUser(req);
  if (!user) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: MEMBERSHIP_REQUIRED_MESSAGE,
        reason: "not-authenticated",
        actions: [
          { label: "Sign In", route: "/login" },
          { label: "Create Account", route: "/join" },
          { label: "View Memberships", route: "/packages" },
        ],
      }),
      { status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }

  if (isRateLimited(user.id)) {
    return new Response(
      JSON.stringify({ ok: false, error: "Please wait a moment before trying again.", reason: "rate-limited" }),
      { status: 429, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "Invalid request." }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  if (!body.startUtc || Number.isNaN(new Date(body.startUtc).getTime())) {
    return new Response(JSON.stringify({ ok: false, error: "A valid appointment time is required." }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const clientTimeZone = (body.clientTimeZone ?? DOCTOR_TIMEZONE).slice(0, 100);
  const consultationType = (body.consultationType ?? "Nutrition Consultation").slice(0, 200);
  const reason = (body.reason ?? "").slice(0, 300);

  // Never trust the client's claim that this slot is available — recompute
  // real-time and require an exact match (this is also where we get the
  // authoritative appointment_end for this slot's configured duration).
  const availableSlots = await generateAvailableSlots(supabaseAdmin);
  const matchedSlot = availableSlots.find((s) => s.startUtc === body.startUtc);
  if (!matchedSlot) {
    return new Response(JSON.stringify({ ok: false, error: SLOT_TAKEN_MESSAGE, reason: "slot-unavailable" }), {
      status: 409,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  // ── Atomic reserve: validates membership + credit + 48h notice, and
  // locks the slot via the database unique index, all in one transaction.
  const { data: reserved, error: reserveError } = await supabaseAdmin.rpc("book_consultation_slot", {
    p_user_id: user.id,
    p_appointment_start: matchedSlot.startUtc,
    p_appointment_end: matchedSlot.endUtc,
    p_timezone: clientTimeZone,
    p_consultation_type: consultationType,
    p_reason: reason,
  });

  if (reserveError) {
    const message = reserveError.message ?? "";
    if (message.includes("NO_ACTIVE_MEMBERSHIP") || message.includes("NO_CREDITS_REMAINING")) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: MEMBERSHIP_REQUIRED_MESSAGE,
          reason: "not-member",
          actions: [{ label: "View Memberships", route: "/packages" }],
        }),
        { status: 403, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }
    if (message.includes("MINIMUM_NOTICE_NOT_MET")) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: `Appointments must be booked at least ${MINIMUM_BOOKING_NOTICE_HOURS} hours in advance. Please choose a later time.`,
          reason: "minimum-notice",
        }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }
    if (message.includes("SLOT_TAKEN")) {
      return new Response(JSON.stringify({ ok: false, error: SLOT_TAKEN_MESSAGE, reason: "slot-taken" }), {
        status: 409,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
    console.error("[create-consultation] Reserve failed:", message);
    return new Response(JSON.stringify({ ok: false, error: "Could not book this consultation right now." }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const request = reserved as { id: string; subscription_id: string };

  // ── From here on, the slot + credit are reserved. Anything that goes
  // wrong below MUST roll back, so a visitor never loses a credit for a
  // meeting that doesn't really exist.
  async function rollbackAndRespond(message: string, status: number, reason: string) {
    await supabaseAdmin.rpc("rollback_consultation_hold", { p_request_id: request.id });
    return new Response(JSON.stringify({ ok: false, error: message, reason }), {
      status,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  if (!isGoogleCalendarConfigured()) {
    return rollbackAndRespond(NOT_CONFIGURED_MESSAGE, 200, "scheduling-not-connected");
  }

  const [{ data: profile }, { data: subscription }] = await Promise.all([
    supabaseAdmin.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    supabaseAdmin
      .from("subscriptions")
      .select("package_id, consultation_credit_limit, consultation_credits_used")
      .eq("id", request.subscription_id)
      .maybeSingle(),
  ]);

  const clientName = profile?.full_name ?? user.email ?? "Member";
  const clientEmail = user.email ?? "";

  let eventResult: { eventId: string; meetUrl: string };
  try {
    eventResult = await createConsultationEvent({
      clientName,
      clientEmail,
      startUtcIso: matchedSlot.startUtc,
      endUtcIso: matchedSlot.endUtc,
      consultationType,
    });
  } catch (err) {
    console.error("[create-consultation] Google Calendar creation failed:", err instanceof Error ? err.message : err);
    return rollbackAndRespond(NOT_CONFIGURED_MESSAGE, 200, "scheduling-not-connected");
  }

  const { error: confirmError } = await supabaseAdmin.rpc("confirm_consultation_hold", {
    p_request_id: request.id,
    p_google_calendar_event_id: eventResult.eventId,
    p_google_meet_url: eventResult.meetUrl,
  });

  if (confirmError) {
    // The real meeting was created but we couldn't record it — cancel the
    // real event too rather than leave an orphaned Calendar entry, then roll back.
    await cancelConsultationEvent(eventResult.eventId).catch(() => {});
    console.error("[create-consultation] Failed to persist confirmation:", confirmError.message);
    return rollbackAndRespond("Could not confirm this consultation right now. Please try again.", 500, "confirm-failed");
  }

  const startDate = new Date(matchedSlot.startUtc);
  const clientLocalTime = formatInZone(startDate, clientTimeZone);
  // The doctor's timezone comes from the availability row this slot was
  // generated from, never from a constant: it is editable per day at
  // /doctor/availability, so assuming Dubai here would make the confirmation
  // email contradict the time the patient just picked.
  const doctorTimeZone = matchedSlot.timezone;
  const doctorLocalTime = formatInZone(startDate, doctorTimeZone);
  const packageName = PACKAGE_NAMES[subscription?.package_id ?? ""] ?? subscription?.package_id ?? "Membership";
  const creditsLimit = subscription?.consultation_credit_limit ?? 0;
  const creditsRemaining = Math.max(creditsLimit - (subscription?.consultation_credits_used ?? 0), 0);

  if (clientEmail) {
    const clientMail = consultationConfirmedClientEmail({
      siteUrl,
      clientName,
      clientLocalTime,
      clientTimeZone,
      doctorLocalTime,
      doctorTimeZone,
      meetUrl: eventResult.meetUrl,
      packageName,
      creditsRemaining,
      creditsLimit,
    });
    await sendEmail(clientEmail, clientMail.subject, clientMail.html);
  }
  if (ADMIN_NOTIFICATION_EMAIL) {
    const adminMail = consultationConfirmedAdminEmail({
      clientName,
      clientEmail,
      clientPhone: null,
      packageName,
      doctorLocalTime,
      doctorTimeZone,
      meetUrl: eventResult.meetUrl,
    });
    await sendEmail(ADMIN_NOTIFICATION_EMAIL, adminMail.subject, adminMail.html);
  }

  return new Response(
    JSON.stringify({
      ok: true,
      appointment: {
        id: request.id,
        appointmentStart: matchedSlot.startUtc,
        appointmentEnd: matchedSlot.endUtc,
        clientLocalTime,
        doctorLocalTime,
        doctorTimeZone,
        meetUrl: eventResult.meetUrl,
      },
      creditsRemaining,
      creditsLimit,
    }),
    { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
  );
});

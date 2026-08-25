// Google Calendar + Google Meet client for Supabase Edge Functions (Deno).
// Uses a standard OAuth2 refresh-token flow (a one-time manual
// authorization by the doctor, then a long-lived refresh token stored as a
// server secret) — never a browser-exposed key.
//
// Required secrets (never in a VITE_* variable):
//   GOOGLE_CLIENT_ID
//   GOOGLE_CLIENT_SECRET
//   GOOGLE_REFRESH_TOKEN
//   GOOGLE_CALENDAR_ID   — the doctor's calendar (typically their Google
//                          account email); also used as the "doctor" attendee.

export function isGoogleCalendarConfigured(): boolean {
  return Boolean(
    Deno.env.get("GOOGLE_CLIENT_ID") &&
      Deno.env.get("GOOGLE_CLIENT_SECRET") &&
      Deno.env.get("GOOGLE_REFRESH_TOKEN") &&
      Deno.env.get("GOOGLE_CALENDAR_ID"),
  );
}

async function getAccessToken(): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: Deno.env.get("GOOGLE_CLIENT_ID") ?? "",
      client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET") ?? "",
      refresh_token: Deno.env.get("GOOGLE_REFRESH_TOKEN") ?? "",
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    throw new Error(`Google token refresh failed with status ${res.status}`);
  }
  const data = await res.json();
  if (typeof data.access_token !== "string") {
    throw new Error("Google token refresh did not return an access token.");
  }
  return data.access_token;
}

import { MINIMUM_BOOKING_NOTICE_HOURS } from "./availability.ts";

/** Where the patient manages the booking, and how they reach a human. */
const ACCOUNT_CONSULTATIONS_URL = "https://monzerallan.com/account/consultations";
const CONTACT_EMAIL = "info@monzerallan.com";

export interface CreateConsultationEventInput {
  clientName: string;
  clientEmail: string;
  startUtcIso: string;
  endUtcIso: string;
  consultationType: string;
  /** Passed in, never hardcoded here — see DOCTOR_DISPLAY_NAME in create-consultation. */
  doctorName: string;
  /** Which session this is, 1-based. 0 means unknown; the counter is then omitted. */
  sessionNumber: number;
  /** Total sessions the package includes. 0 means unknown. */
  sessionTotal: number;
  packageName: string;
}

/**
 * "Dr. Monzer Allan · Monthly Check-In (1 of 4) — Sohila Ebrahim"
 *
 * The counter is dropped entirely when either number is 0, so an unknown
 * package never produces "(0 of 0)".
 */
export function buildEventSummary(input: CreateConsultationEventInput): string {
  const sessionType = input.consultationType || "Nutrition Consultation";
  const counter =
    input.sessionNumber > 0 && input.sessionTotal > 0
      ? ` (${input.sessionNumber} of ${input.sessionTotal})`
      : "";
  return `${input.doctorName} · ${sessionType}${counter} — ${input.clientName}`;
}

/**
 * Plain text with newlines — Google Calendar accepts a small HTML subset, but
 * text needs no escaping of the interpolated name/package values and renders
 * identically everywhere.
 *
 * The Meet link is deliberately absent: Google creates the conference as part
 * of the same insert this body is built for, so the URL does not exist yet.
 * Google renders its own Join button on the event, so nothing is lost.
 */
export function buildEventDescription(input: CreateConsultationEventInput): string {
  const sessionType = input.consultationType || "Nutrition Consultation";
  const lines = [
    `Online ${sessionType.toLowerCase()} with ${input.doctorName}.`,
    "",
    `Patient: ${input.clientName}`,
    `Program: ${input.packageName}`,
  ];
  if (input.sessionNumber > 0 && input.sessionTotal > 0) {
    lines.push(`Session: ${input.sessionNumber} of ${input.sessionTotal}`);
  }
  lines.push(
    "",
    "Join using the video link on this event.",
    "",
    `To reschedule or cancel, go to ${ACCOUNT_CONSULTATIONS_URL}`,
    `Changes need at least ${MINIMUM_BOOKING_NOTICE_HOURS} hours' notice.`,
    "",
    `Questions: ${CONTACT_EMAIL}`,
  );
  return lines.join("\n");
}

export interface CreateConsultationEventResult {
  eventId: string;
  meetUrl: string;
}

/** Creates a real Google Calendar event with a real Google Meet conference. Throws on any failure — never returns a fabricated link. */
export async function createConsultationEvent(
  input: CreateConsultationEventInput,
): Promise<CreateConsultationEventResult> {
  const calendarId = Deno.env.get("GOOGLE_CALENDAR_ID") ?? "";
  const accessToken = await getAccessToken();

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1&sendUpdates=all`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: buildEventSummary(input),
        description: buildEventDescription(input),
        start: { dateTime: input.startUtcIso, timeZone: "UTC" },
        end: { dateTime: input.endUtcIso, timeZone: "UTC" },
        attendees: [{ email: calendarId }, { email: input.clientEmail }],
        conferenceData: {
          createRequest: {
            requestId: crypto.randomUUID(),
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      }),
    },
  );

  if (!res.ok) {
    throw new Error(`Google Calendar event creation failed with status ${res.status}`);
  }

  const event = await res.json();
  const meetUrl: string | undefined =
    event.hangoutLink ??
    event.conferenceData?.entryPoints?.find((e: { entryPointType?: string; uri?: string }) => e.entryPointType === "video")
      ?.uri;

  if (typeof event.id !== "string" || !meetUrl) {
    throw new Error("Google Calendar did not return a conference link.");
  }

  return { eventId: event.id, meetUrl };
}

/** Cancels a previously created event (used by the cancellation flow). Never throws on a not-found event — it's already effectively cancelled. */
export async function cancelConsultationEvent(eventId: string): Promise<void> {
  const calendarId = Deno.env.get("GOOGLE_CALENDAR_ID") ?? "";
  const accessToken = await getAccessToken();
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}?sendUpdates=all`,
    { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    throw new Error(`Google Calendar event cancellation failed with status ${res.status}`);
  }
}

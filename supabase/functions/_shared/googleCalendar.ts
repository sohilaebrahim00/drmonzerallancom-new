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

export interface CreateConsultationEventInput {
  clientName: string;
  clientEmail: string;
  startUtcIso: string;
  endUtcIso: string;
  consultationType: string;
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
        summary: `${input.consultationType || "Nutrition Consultation"} — ${input.clientName}`,
        description: "Online nutrition consultation booked through the Dr. Monzer Allan website.",
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

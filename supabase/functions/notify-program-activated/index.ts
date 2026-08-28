// Supabase Edge Function (Deno) — emails a patient that their nutrition
// program has been activated.
//
// NOT DEPLOYED. Deploy with
// `supabase functions deploy notify-program-activated`.
// Required secrets:
//   SUPABASE_SERVICE_ROLE_KEY  (SUPABASE_URL is injected automatically)
//   RESEND_API_KEY, EMAIL_FROM (see _shared/email.ts)
//   APP_URL                    (origin serving /my-program. Defaults to
//                               https://monzerallan.com, which is where that
//                               route lives as of 6D.3. Set this only if the
//                               app gets a host that truly serves the app
//                               build — app.monzerallan.com currently does
//                               not, it serves the marketing site.)
//
// This cannot live in the browser: RESEND_API_KEY is a server secret, and the
// patient's address is in auth.users, which the client cannot read at all.
//
// Reports a fact, it never creates one. The program must already be active
// before this will say so — see the status check below.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { corsHeaders } from "../_shared/cors.ts";
import { isRateLimited } from "../_shared/rateLimit.ts";
import { programActivatedClientEmail, sendEmail } from "../_shared/email.ts";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

/**
 * Origin of the page the "Open My Program" button opens.
 *
 * Defaults to the MARKETING origin, not app.monzerallan.com. Two verified
 * reasons: /my-program now exists in the website router (it was added in 6D.3
 * precisely because it did not), and app.monzerallan.com was found to be
 * serving the marketing site rather than the app build — so the old default
 * was wrong twice over and every patient who clicked the button landed
 * somewhere wrong.
 *
 * Override with the APP_URL secret if the app ever gets its own host that
 * really does serve the app build.
 */
const APP_URL = (Deno.env.get("APP_URL") ?? "https://monzerallan.com").replace(/\/$/, "");

const RATE_LIMIT_WINDOW_MS = 60_000;
/** Per doctor. A doctor jabbing the button repeatedly must not send a burst of mail. */
const MAX_PER_DOCTOR_PER_WINDOW = 10;
/** Per program, so re-activating the same one cannot spam one patient. */
const MAX_PER_PROGRAM_PER_WINDOW = 2;

function jsonWith(cors: Record<string, string>) {
  return (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });
}

/** Same predicate as admin-availability's resolveStaffUser and public.is_doctor(). */
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

/** Formats an ISO date (YYYY-MM-DD) for display. Returns the input unchanged if it is not one. */
function formatDate(value: string | null): string {
  if (!value) return "Not set";
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

serve(async (req) => {
  const CORS_HEADERS = corsHeaders(req);
  const json = jsonWith(CORS_HEADERS);
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
  }

  const staff = await resolveStaffUser(req);
  if (!staff) return json({ error: "Not authorized." }, 403);

  let body: { programId?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }
  const programId = typeof body.programId === "string" ? body.programId : "";
  if (!programId) return json({ error: "programId is required." }, 400);

  if (isRateLimited(`notify:doctor:${staff.id}`, RATE_LIMIT_WINDOW_MS, MAX_PER_DOCTOR_PER_WINDOW)) {
    return json({ error: "Too many notifications just now. Please wait a moment." }, 429);
  }
  if (
    isRateLimited(`notify:program:${programId}`, RATE_LIMIT_WINDOW_MS, MAX_PER_PROGRAM_PER_WINDOW)
  ) {
    return json({ error: "This program was just notified. Please wait a moment." }, 429);
  }

  const { data: program } = await supabaseAdmin
    .from("nutrition_programs")
    .select("id, patient_id, doctor_id, title, start_date, end_date, status")
    .eq("id", programId)
    .maybeSingle();

  // Ownership is the real check, not the role. A doctor passing another
  // doctor's programId must get nothing. The same 403 covers "no such
  // program" and "not yours", so this never confirms a program exists.
  if (!program || program.doctor_id !== staff.id) {
    return json({ error: "Not authorized." }, 403);
  }

  // Never the thing that announces an unpublished program.
  if (program.status !== "active") {
    return json({ error: "This program is not active yet." }, 409);
  }

  const [{ data: patientAuth }, { data: patientProfile }] = await Promise.all([
    supabaseAdmin.auth.admin.getUserById(program.patient_id),
    supabaseAdmin.from("profiles").select("full_name").eq("id", program.patient_id).maybeSingle(),
  ]);

  const patientEmail = patientAuth?.user?.email;
  if (!patientEmail) {
    console.error(`[notify-program-activated] No email for patient ${program.patient_id}`);
    return json({ error: "This patient has no email address on file." }, 422);
  }

  const { subject, html } = programActivatedClientEmail({
    appUrl: APP_URL,
    clientName: patientProfile?.full_name ?? patientEmail.split("@")[0],
    programTitle: program.title ?? "Your nutrition program",
    startDate: formatDate(program.start_date),
    endDate: formatDate(program.end_date),
  });
  await sendEmail(patientEmail, subject, html);

  return json({ ok: true });
});

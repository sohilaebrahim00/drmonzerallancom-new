// Supabase Edge Function (Deno) — receives the public Contact form.
//
// NOT DEPLOYED. Deploy with `supabase functions deploy contact-submit`.
// Required secrets: SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, EMAIL_FROM,
// ADMIN_NOTIFICATION_EMAIL (SUPABASE_URL is provided automatically).
//
// Writes the inquiry to public.contact_inquiries (service_role — the table
// has no client-facing select policy, so this is the only reliable way to
// read submissions back out), then emails the admin and, optionally,
// acknowledges the customer. The frontend only ever learns "submitted" or
// "failed" from this function's response — never a fabricated success.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  adminContactInquiryEmail,
  customerContactAckEmail,
  sendEmail,
  ADMIN_NOTIFICATION_EMAIL,
} from "../_shared/email.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { clientIp, isRateLimited } from "../_shared/rateLimit.ts";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);
const siteUrl = Deno.env.get("SITE_URL") ?? "https://monzerallan.com";

interface RequestBody {
  fullName: string;
  email: string;
  phone?: string;
  preferredContactMethod: "whatsapp" | "email" | "either";
  subject?: string;
  message: string;
  sourcePage?: string;
  /** Honeypot — real visitors never fill this in. */
  companyWebsite?: string;
}

// In-memory rate limits — reset on cold start. A real deployment behind
// Supabase's platform should pair this with platform-level abuse protection
// and a CAPTCHA; these only guard against repeat submissions seen by the
// same function instance.
//
// The limit used to be keyed on the email address in the REQUEST BODY, which
// the sender chooses. Since a successful submission sends a "thanks for
// reaching out" mail to that address from the practice's verified domain, a
// script posting victim+1@…, victim+2@… passed the limit every time and used
// this endpoint as a mail bomb aimed at whoever it liked. The caller's IP is
// now the primary key; the email address stays as an ADDITIONAL limit so one
// person cannot spam one inbox from many addresses of their own.
const RATE_LIMIT_WINDOW_MS = 60_000;
/** Per caller IP. Above 1 because offices and mobile carriers share an IP. */
const MAX_PER_IP_PER_WINDOW = 5;
/** Per email address in the body — preserves the previous 1/minute rule. */
const MAX_PER_EMAIL_PER_WINDOW = 1;
/**
 * Per-isolate ceiling across ALL keys, so a distributed flood cannot turn
 * this function into an untargeted mail relay even when no single IP or
 * address trips its own limit.
 */
const MAX_TOTAL_PER_WINDOW = 60;

// A pragmatic address check: local part, "@", and a dotted domain whose
// labels are alphanumeric/hyphen. Replaces `email.includes("@")`, which
// accepted values like `"><a href=…` and let them reach the admin's inbox.
const EMAIL_PATTERN =
  /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~.-]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

serve(async (req) => {
  const CORS_HEADERS = corsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
  }

  const tooBusy = (): Response =>
    new Response(JSON.stringify({ error: "Please wait a moment before submitting again." }), {
      status: 429,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });

  // Charged before any work is done, so a flood costs this function almost
  // nothing. Both counters are incremented by the call that reads them.
  if (isRateLimited("contact:all", RATE_LIMIT_WINDOW_MS, MAX_TOTAL_PER_WINDOW)) return tooBusy();
  if (
    isRateLimited(`contact:ip:${clientIp(req)}`, RATE_LIMIT_WINDOW_MS, MAX_PER_IP_PER_WINDOW)
  ) {
    return tooBusy();
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  if (body.companyWebsite) {
    // Honeypot tripped — pretend success, do nothing.
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const fullName = (body.fullName ?? "").trim().slice(0, 200);
  const email = (body.email ?? "").trim().slice(0, 320);
  const phone = (body.phone ?? "").trim().slice(0, 40);
  const preferredContactMethod = body.preferredContactMethod ?? "either";
  const subject = (body.subject ?? "").trim().slice(0, 200);
  const message = (body.message ?? "").trim().slice(0, 4000);
  const sourcePage = (body.sourcePage ?? "").trim().slice(0, 200);

  if (!fullName || !EMAIL_PATTERN.test(email) || message.length < 10) {
    return new Response(JSON.stringify({ error: "Please fill in all required fields." }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  // Second, additional limit — the IP ceiling above is the one that actually
  // bounds abuse, since this key is chosen by the sender.
  if (
    isRateLimited(
      `contact:email:${email.toLowerCase()}`,
      RATE_LIMIT_WINDOW_MS,
      MAX_PER_EMAIL_PER_WINDOW,
    )
  ) {
    return tooBusy();
  }

  const { error: insertError } = await supabaseAdmin.from("contact_inquiries").insert({
    full_name: fullName,
    email,
    phone: phone || null,
    preferred_contact_method: preferredContactMethod,
    subject: subject || null,
    message,
    source_page: sourcePage || null,
  });

  if (insertError) {
    console.error("[contact-submit] Insert failed:", insertError.message);
    return new Response(
      JSON.stringify({ error: "Could not submit your message. Please try again." }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      },
    );
  }

  if (ADMIN_NOTIFICATION_EMAIL) {
    const admin = adminContactInquiryEmail({
      fullName,
      email,
      phone: phone || null,
      preferredContactMethod,
      subject,
      message,
      sourcePage,
    });
    await sendEmail(ADMIN_NOTIFICATION_EMAIL, admin.subject, admin.html);
  }

  const ack = customerContactAckEmail({ fullName, siteUrl });
  await sendEmail(email, ack.subject, ack.html);

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
});

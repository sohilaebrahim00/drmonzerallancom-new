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
import { CORS_HEADERS } from "../_shared/cors.ts";

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

// Extremely lightweight in-memory rate limit — resets on cold start. A real
// deployment behind Supabase's platform should pair this with platform-level
// abuse protection; this only guards against rapid repeat submissions from
// the same function instance.
const recentSubmissions = new Map<string, number>();
const RATE_LIMIT_WINDOW_MS = 60_000;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
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

  if (!fullName || !email.includes("@") || message.length < 10) {
    return new Response(JSON.stringify({ error: "Please fill in all required fields." }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const rateKey = email.toLowerCase();
  const last = recentSubmissions.get(rateKey);
  if (last && Date.now() - last < RATE_LIMIT_WINDOW_MS) {
    return new Response(
      JSON.stringify({ error: "Please wait a moment before submitting again." }),
      {
        status: 429,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      },
    );
  }
  recentSubmissions.set(rateKey, Date.now());

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

// Supabase Edge Function (Deno) — starts a real Stripe Checkout session.
//
// NOT DEPLOYED. Deploy with `supabase functions deploy create-checkout-session`
// after setting its secrets (`supabase secrets set ...`):
//   STRIPE_SECRET_KEY
//   STRIPE_PRICE_BASIC
//   STRIPE_PRICE_PREMIUM
//   STRIPE_PRICE_VIP
//   SUPABASE_SERVICE_ROLE_KEY   (SUPABASE_URL is provided automatically)
//
// The browser only ever sends a safe package identifier ("basic" |
// "premium" | "vip-elite") — never a price or amount. This function maps
// that identifier to a trusted, pre-created Stripe recurring Price ID, so a
// tampered client request can never change what a customer is charged.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@16?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20",
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

const PACKAGE_TO_PRICE: Record<string, string | undefined> = {
  basic: Deno.env.get("STRIPE_PRICE_BASIC"),
  premium: Deno.env.get("STRIPE_PRICE_PREMIUM"),
  "vip-elite": Deno.env.get("STRIPE_PRICE_VIP"),
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface RequestBody {
  fullName: string;
  email: string;
  phone?: string;
  preferredContactMethod: "whatsapp" | "email" | "either";
  packageId: string;
  siteUrl: string;
  /** Honeypot — real visitors never fill this in. */
  companyWebsite?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
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

  // Honeypot: silently pretend success without doing anything.
  if (body.companyWebsite) {
    return new Response(JSON.stringify({ error: "Unable to process request." }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const fullName = (body.fullName ?? "").trim().slice(0, 200);
  const email = (body.email ?? "").trim().slice(0, 320);
  const phone = (body.phone ?? "").trim().slice(0, 40);
  const preferredContactMethod = body.preferredContactMethod ?? "either";
  const packageId = body.packageId;
  const siteUrl = (body.siteUrl ?? "").replace(/\/$/, "");

  if (!fullName || !email.includes("@") || !siteUrl) {
    return new Response(JSON.stringify({ error: "Missing required fields." }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const priceId = PACKAGE_TO_PRICE[packageId];
  if (!priceId) {
    return new Response(JSON.stringify({ error: "This membership package isn't available yet." }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  // Record the lead before redirecting to Stripe, so intent is captured
  // even if the visitor abandons checkout.
  const { data: lead, error: leadError } = await supabaseAdmin
    .from("membership_leads")
    .insert({
      full_name: fullName,
      email,
      phone: phone || null,
      preferred_contact_method: preferredContactMethod,
      package_id: packageId,
      status: "started",
    })
    .select("id")
    .single();

  if (leadError || !lead) {
    return new Response(JSON.stringify({ error: "Could not start checkout. Please try again." }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: email,
    phone_number_collection: { enabled: true },
    success_url: `${siteUrl}/membership/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/membership/cancelled`,
    metadata: {
      package_id: packageId,
      internal_lead_id: lead.id,
      preferred_contact_method: preferredContactMethod,
    },
  });

  await supabaseAdmin
    .from("membership_leads")
    .update({ status: "checkout_created", stripe_checkout_session_id: session.id })
    .eq("id", lead.id);

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
});

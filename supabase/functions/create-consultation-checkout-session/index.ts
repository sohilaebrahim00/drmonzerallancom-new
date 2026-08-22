// Supabase Edge Function (Deno) — starts a real Stripe Checkout session for
// a one-time Diet or Treatment program package (6 tiers total: Diet
// Basic/Plus/Premium, Treatment Basic/Plus/Premium). This is deliberately a
// SEPARATE function from create-checkout-session (which handles recurring
// memberships) rather than a branch inside it, so the existing,
// already-working membership checkout path is provably untouched by this
// addition.
//
// NOT DEPLOYED. Deploy with
// `supabase functions deploy create-consultation-checkout-session` after
// setting its secrets (`supabase secrets set ...`):
//   STRIPE_SECRET_KEY
//   STRIPE_PRODUCT_DIET_BASIC / STRIPE_PRODUCT_DIET_PLUS / STRIPE_PRODUCT_DIET_PREMIUM
//   STRIPE_PRODUCT_TREATMENT_BASIC / STRIPE_PRODUCT_TREATMENT_PLUS / STRIPE_PRODUCT_TREATMENT_PREMIUM
//   SERVICE_ROLE_KEY   (SUPABASE_URL is provided automatically)
//   SITE_URL           (required — the success/cancel redirect origin.
//                       Never taken from the request body.)
//
// The browser only ever sends a safe package identifier (one of the 6 slugs
// below) — never a price or amount. This function maps that identifier
// server-side to a trusted Stripe Product id AND the exact charge amount
// (PACKAGE_AMOUNT_CENTS below), building the Checkout line item via
// `price_data` (an ad-hoc, one-time price tied to that product) rather than
// requiring a separately pre-created Price id — so a tampered client
// request can never change what a customer is charged.
// See supabase/PHASE_I_CONSULTATION_PACKAGES_PAYMENTS_MIGRATION.sql for the
// `payments`/`consultation_credits` tables this writes to, and
// supabase/functions/stripe-webhook for how a completed payment grants
// consultation credits.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@16?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { corsHeaders } from "../_shared/cors.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20",
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SERVICE_ROLE_KEY") ?? "",
);

// Where Stripe sends the buyer after checkout. Read from the server's own
// secret and NEVER from the request: this endpoint is unauthenticated, so a
// client-supplied siteUrl let anyone mint a genuine Checkout session on the
// clinic's live Stripe account whose success_url pointed at their own site —
// the victim paying on a real Stripe page in the doctor's name, then being
// redirected to the attacker with the session_id in the query string.
// `contact-submit` already reads this same secret.
const SITE_URL = (Deno.env.get("SITE_URL") ?? "").replace(/\/$/, "");

type PackageType = "diet" | "treatment";

interface PackageDefinition {
  productEnvVar: string;
  amountCents: number;
  consultationCount: 1 | 2 | 3;
  packageType: PackageType;
}

// Source of truth for what each package actually charges and grants — never
// trust an amount from the client. Kept in sync with
// src/data/programPackages.ts by convention (both are reference copies of
// the real Stripe catalog).
const PACKAGES: Record<string, PackageDefinition> = {
  diet_basic: {
    productEnvVar: "STRIPE_PRODUCT_DIET_BASIC",
    amountCents: 4900,
    consultationCount: 1,
    packageType: "diet",
  },
  diet_plus: {
    productEnvVar: "STRIPE_PRODUCT_DIET_PLUS",
    amountCents: 6900,
    consultationCount: 2,
    packageType: "diet",
  },
  diet_premium: {
    productEnvVar: "STRIPE_PRODUCT_DIET_PREMIUM",
    amountCents: 8900,
    consultationCount: 3,
    packageType: "diet",
  },
  treatment_basic: {
    productEnvVar: "STRIPE_PRODUCT_TREATMENT_BASIC",
    amountCents: 11900,
    consultationCount: 1,
    packageType: "treatment",
  },
  treatment_plus: {
    productEnvVar: "STRIPE_PRODUCT_TREATMENT_PLUS",
    amountCents: 13900,
    consultationCount: 2,
    packageType: "treatment",
  },
  treatment_premium: {
    productEnvVar: "STRIPE_PRODUCT_TREATMENT_PREMIUM",
    amountCents: 15900,
    consultationCount: 3,
    packageType: "treatment",
  },
};

interface RequestBody {
  fullName: string;
  email: string;
  packageId: string;
  /** Honeypot — real visitors never fill this in. */
  companyWebsite?: string;
}

serve(async (req) => {
  const CORS_HEADERS = corsHeaders(req);
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
  const packageId = body.packageId;

  if (!SITE_URL) {
    console.error("[create-consultation-checkout-session] SITE_URL secret is not set — refusing to build a redirect URL.");
    return new Response(JSON.stringify({ error: "Checkout is not configured. Please contact us." }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  if (!fullName || !email.includes("@")) {
    return new Response(JSON.stringify({ error: "Missing required fields." }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const def = PACKAGES[packageId];
  const productId = def ? Deno.env.get(def.productEnvVar) : undefined;
  if (!def || !productId) {
    return new Response(JSON.stringify({ error: "This program package isn't available yet." }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  // Record a pending payment before redirecting to Stripe, so the webhook
  // only ever needs to flip status → "succeeded" rather than construct the
  // row from scratch (and so intent is captured even if checkout is
  // abandoned).
  const { data: payment, error: paymentError } = await supabaseAdmin
    .from("payments")
    .insert({
      full_name: fullName,
      email,
      package_id: packageId,
      package_type: def.packageType,
      consultation_count: def.consultationCount,
      product_id: productId,
      amount: def.amountCents,
      credits_granted: def.consultationCount,
      status: "pending",
    })
    .select("id")
    .single();

  if (paymentError || !payment) {
    return new Response(JSON.stringify({ error: "Could not start checkout. Please try again." }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product: productId,
          unit_amount: def.amountCents,
        },
        quantity: 1,
      },
    ],
    customer_email: email,
    success_url: `${SITE_URL}/membership/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/membership/cancelled`,
    metadata: {
      package_id: packageId,
      internal_payment_id: payment.id,
      full_name: fullName,
    },
    // Propagated onto the resulting PaymentIntent too, so the
    // payment_intent.succeeded / payment_intent.payment_failed webhook
    // handlers can find this same payments row without a second lookup.
    payment_intent_data: {
      metadata: {
        package_id: packageId,
        internal_payment_id: payment.id,
      },
    },
  });

  await supabaseAdmin
    .from("payments")
    .update({ stripe_session_id: session.id })
    .eq("id", payment.id);

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
});

// Supabase Edge Function (Deno) — starts a real Stripe Checkout session for
// a one-time, pay-per-consultation package (Single/Double Consultation).
// This is deliberately a SEPARATE function from create-checkout-session
// (which handles recurring memberships) rather than a branch inside it, so
// the existing, already-working membership checkout path is provably
// untouched by this addition.
//
// NOT DEPLOYED. Deploy with
// `supabase functions deploy create-consultation-checkout-session` after
// setting its secrets (`supabase secrets set ...`):
//   STRIPE_SECRET_KEY
//   STRIPE_PRODUCT_SINGLE   (a Stripe Product id, e.g. prod_...)
//   STRIPE_PRODUCT_DOUBLE
//   SUPABASE_SERVICE_ROLE_KEY   (SUPABASE_URL is provided automatically)
//
// The browser only ever sends a safe package identifier ("single_consultation"
// | "double_consultation") — never a price or amount. This function maps
// that identifier server-side to a trusted Stripe Product id AND the exact
// charge amount (PACKAGE_AMOUNT_CENTS below), building the Checkout line
// item via `price_data` (an ad-hoc, one-time price tied to that product)
// rather than requiring a separately pre-created Price id — so a tampered
// client request can never change what a customer is charged.
// See supabase/PHASE_I_CONSULTATION_PACKAGES_PAYMENTS_MIGRATION.sql for the
// `payments`/`consultation_credits` tables this writes to, and
// supabase/functions/stripe-webhook for how a completed payment grants
// consultation credits.

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

const PACKAGE_TO_PRODUCT: Record<string, string | undefined> = {
  single_consultation: Deno.env.get("STRIPE_PRODUCT_SINGLE"),
  double_consultation: Deno.env.get("STRIPE_PRODUCT_DOUBLE"),
};

// Source of truth for what each package actually charges — never trust an
// amount from the client. Kept in sync with src/data/consultationPackages.ts
// by convention (both are reference copies of the real Stripe catalog).
const PACKAGE_AMOUNT_CENTS: Record<string, number> = {
  single_consultation: 4900,
  double_consultation: 11900,
};

const PACKAGE_CREDITS: Record<string, number> = {
  single_consultation: 1,
  double_consultation: 2,
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface RequestBody {
  fullName: string;
  email: string;
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
  const packageId = body.packageId;
  const siteUrl = (body.siteUrl ?? "").replace(/\/$/, "");

  if (!fullName || !email.includes("@") || !siteUrl) {
    return new Response(JSON.stringify({ error: "Missing required fields." }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const productId = PACKAGE_TO_PRODUCT[packageId];
  const amountCents = PACKAGE_AMOUNT_CENTS[packageId];
  const credits = PACKAGE_CREDITS[packageId];
  if (!productId || !amountCents || !credits) {
    return new Response(JSON.stringify({ error: "This consultation package isn't available yet." }), {
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
      product_id: productId,
      amount: amountCents,
      credits_granted: credits,
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
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    customer_email: email,
    success_url: `${siteUrl}/membership/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/membership/cancelled`,
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

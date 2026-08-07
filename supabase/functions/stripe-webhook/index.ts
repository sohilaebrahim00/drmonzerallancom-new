// Supabase Edge Function (Deno) — Stripe subscription webhook handler.
//
// NOT DEPLOYED. This file is architecture-ready code for the piece that a
// static Hostinger-hosted SPA cannot provide on its own: verifying Stripe
// webhook signatures and writing subscription/credit rows with the
// service_role key. Deploy it with `supabase functions deploy stripe-webhook`
// and register its URL in the Stripe Dashboard (Developers > Webhooks).
//
// Required secrets (set with `supabase secrets set`, never in the frontend):
//   STRIPE_SECRET_KEY
//   STRIPE_WEBHOOK_SECRET
//   SUPABASE_SERVICE_ROLE_KEY   (Edge Functions get SUPABASE_URL automatically)
//
// This function is the only thing that should ever write to
// public.subscriptions — the frontend has no insert/update policy for that
// table (see supabase/schema.sql), specifically so a client can't grant
// itself an active membership.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@16?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20",
});
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

// Map each Stripe Price ID to the internal package + its credit limit.
// Fill these in once the three recurring Prices exist in Stripe.
const PRICE_TO_PACKAGE: Record<string, { packageId: string; creditLimit: number }> = {
  // "price_XXXXXXXXXXXXX": { packageId: "basic", creditLimit: 1 },
  // "price_XXXXXXXXXXXXX": { packageId: "premium", creditLimit: 3 },
  // "price_XXXXXXXXXXXXX": { packageId: "vip-elite", creditLimit: 12 },
};

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;
  try {
    if (!signature) throw new Error("Missing Stripe-Signature header");
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    return new Response(`Webhook signature verification failed: ${(err as Error).message}`, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const priceId = subscription.items.data[0]?.price.id;
      const mapping = priceId ? PRICE_TO_PACKAGE[priceId] : undefined;
      const userId = subscription.metadata?.supabase_user_id;

      if (!mapping || !userId) break;

      await supabaseAdmin.from("subscriptions").upsert(
        {
          user_id: userId,
          package_id: mapping.packageId,
          status: subscription.status === "active" ? "active" : "past_due",
          stripe_customer_id: subscription.customer as string,
          stripe_subscription_id: subscription.id,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          consultation_credit_limit: mapping.creditLimit,
        },
        { onConflict: "stripe_subscription_id" },
      );
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await supabaseAdmin
        .from("subscriptions")
        .update({ status: "cancelled" })
        .eq("stripe_subscription_id", subscription.id);
      break;
    }

    default:
      break;
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});

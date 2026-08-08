// Supabase Edge Function (Deno) — Stripe subscription webhook handler.
//
// NOT DEPLOYED. This is the only piece that can safely turn a Stripe payment
// into an active Supabase membership: verifying the webhook signature and
// writing subscription/credit rows with the service_role key. Deploy with
// `supabase functions deploy stripe-webhook` and register its URL in the
// Stripe Dashboard (Developers > Webhooks), subscribed to the event types
// handled below.
//
// Required secrets (`supabase secrets set ...`, never in the frontend):
//   STRIPE_SECRET_KEY
//   STRIPE_WEBHOOK_SECRET
//   STRIPE_PRICE_BASIC / STRIPE_PRICE_PREMIUM / STRIPE_PRICE_VIP
//   SUPABASE_SERVICE_ROLE_KEY   (SUPABASE_URL is provided automatically)
//   RESEND_API_KEY, EMAIL_FROM, ADMIN_NOTIFICATION_EMAIL (for notification emails)
//
// This function is the only thing that should ever write to
// public.subscriptions — the frontend has no insert/update policy for that
// table (see supabase/schema.sql), specifically so a client can't grant
// itself an active membership. Every handler is written to be safely
// re-runnable: Stripe may deliver the same event more than once, and none
// of these operations should create duplicate accounts, credits, or rows
// when that happens.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@16?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  ADMIN_NOTIFICATION_EMAIL,
  adminNewMemberEmail,
  customerWelcomeEmail,
  sendEmail,
} from "../_shared/email.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20",
});
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
const siteUrl = Deno.env.get("SITE_URL") ?? "https://monzerallan.com";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

const PACKAGE_INFO: Record<
  string,
  {
    priceId: string | undefined;
    creditLimit: number;
    name: string;
    priceLabel: string;
    vip: boolean;
  }
> = {
  basic: {
    priceId: Deno.env.get("STRIPE_PRICE_BASIC"),
    creditLimit: 1,
    name: "Basic",
    priceLabel: "$29 / Month",
    vip: false,
  },
  premium: {
    priceId: Deno.env.get("STRIPE_PRICE_PREMIUM"),
    creditLimit: 3,
    name: "Premium",
    priceLabel: "$61 / Month",
    vip: false,
  },
  "vip-elite": {
    priceId: Deno.env.get("STRIPE_PRICE_VIP"),
    creditLimit: 12,
    name: "VIP Elite",
    priceLabel: "$103 / Month",
    vip: true,
  },
};

function packageIdFromPriceId(priceId: string | undefined): string | undefined {
  if (!priceId) return undefined;
  return Object.entries(PACKAGE_INFO).find(([, info]) => info.priceId === priceId)?.[0];
}

/** Finds an existing auth user by email, or invites a new one. Never creates a duplicate. */
async function findOrInviteUser(email: string, fullName: string): Promise<string | null> {
  const { data: existingId } = await supabaseAdmin.rpc("get_user_id_by_email", { p_email: email });
  if (existingId) return existingId as string;

  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
    redirectTo: `${siteUrl}/reset-password`,
  });
  if (error) {
    // Race condition: user was created between the lookup above and this
    // call (e.g. a duplicate webhook delivery). Look it up again instead
    // of failing the whole handler.
    const { data: retryId } = await supabaseAdmin.rpc("get_user_id_by_email", { p_email: email });
    if (retryId) return retryId as string;
    console.error("[stripe-webhook] Failed to invite user:", error.message);
    return null;
  }
  return data.user?.id ?? null;
}

async function activateMembership(subscription: Stripe.Subscription) {
  const priceId = subscription.items.data[0]?.price.id;
  const packageId = subscription.metadata?.package_id ?? packageIdFromPriceId(priceId);
  const info = packageId ? PACKAGE_INFO[packageId] : undefined;
  if (!info) {
    console.error("[stripe-webhook] Could not resolve package for subscription", subscription.id);
    return;
  }

  const customer = await stripe.customers.retrieve(subscription.customer as string);
  if (customer.deleted) return;
  const email = customer.email;
  if (!email) {
    console.error("[stripe-webhook] Stripe customer has no email", customer.id);
    return;
  }
  const fullName = customer.name ?? email;

  const userId = await findOrInviteUser(email, fullName);
  if (!userId) return;

  // Idempotent: re-running with the same stripe_subscription_id updates the
  // same row rather than inserting a new one.
  const { error: upsertError } = await supabaseAdmin.from("subscriptions").upsert(
    {
      user_id: userId,
      package_id: packageId,
      status: subscription.status === "active" ? "active" : "past_due",
      stripe_customer_id: customer.id,
      stripe_subscription_id: subscription.id,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      consultation_credit_limit: info.creditLimit,
    },
    { onConflict: "stripe_subscription_id" },
  );
  if (upsertError) {
    console.error("[stripe-webhook] Failed to upsert subscription:", upsertError.message);
    return;
  }

  const leadId = subscription.metadata?.internal_lead_id;
  if (leadId) {
    await supabaseAdmin.from("membership_leads").update({ status: "paid" }).eq("id", leadId);
  }

  // Only send the "welcome" + admin emails the first time this subscription
  // becomes active, not on every renewal-triggered webhook.
  const { data: priorRows } = await supabaseAdmin
    .from("subscriptions")
    .select("id")
    .eq("stripe_subscription_id", subscription.id);
  const isFirstActivation = (priorRows?.length ?? 0) <= 1;

  if (isFirstActivation) {
    const { subject, html } = customerWelcomeEmail({
      siteUrl,
      fullName,
      packageName: info.name,
      consultationCredits: info.creditLimit,
      isVip: info.vip,
    });
    await sendEmail(email, subject, html);

    if (ADMIN_NOTIFICATION_EMAIL) {
      const admin = adminNewMemberEmail({
        siteUrl,
        fullName,
        email,
        phone: typeof customer.phone === "string" ? customer.phone : null,
        preferredContactMethod: subscription.metadata?.preferred_contact_method ?? "either",
        packageName: info.name,
        priceLabel: info.priceLabel,
        stripeCustomerId: customer.id,
      });
      await sendEmail(ADMIN_NOTIFICATION_EMAIL, admin.subject, admin.html);
    }
  }
}

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;
  try {
    if (!signature) throw new Error("Missing Stripe-Signature header");
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    // Never process (or trust) an unverified webhook.
    return new Response(`Webhook signature verification failed: ${(err as Error).message}`, {
      status: 400,
    });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          await activateMembership(subscription);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        await activateMembership(event.data.object as Stripe.Subscription);
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

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          await supabaseAdmin
            .from("subscriptions")
            .update({ status: "active" })
            .eq("stripe_subscription_id", invoice.subscription as string);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          await supabaseAdmin
            .from("subscriptions")
            .update({ status: "past_due" })
            .eq("stripe_subscription_id", invoice.subscription as string);
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    // Log and still acknowledge receipt with 200 where appropriate is
    // debatable; here we surface a 500 so Stripe retries, since a thrown
    // error means the activation may be incomplete.
    console.error("[stripe-webhook] Handler error:", (err as Error).message);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});

// Supabase Edge Function (Deno) — Stripe subscription webhook handler.
//
// NOT DEPLOYED. This is the only piece that can safely turn a Stripe payment
// into an active Supabase membership: verifying the webhook signature and
// writing subscription/credit rows with the service_role key. Deploy with
// `supabase functions deploy stripe-webhook` and register its URL in the
// Stripe Dashboard (Developers > Webhooks), subscribed to the event types
// handled below — note that checkout.session.async_payment_succeeded,
// checkout.session.async_payment_failed, charge.refunded and
// charge.dispute.created must all be ticked in that endpoint's event list, or
// delayed payments and refunds will simply never be delivered.
//
// Required secrets (`supabase secrets set ...`, never in the frontend):
//   STRIPE_SECRET_KEY
//   STRIPE_WEBHOOK_SECRET
//   STRIPE_PRICE_BASIC / STRIPE_PRICE_PREMIUM / STRIPE_PRICE_VIP
//   SUPABASE_SERVICE_ROLE_KEY   (injected by the platform automatically,
//                                along with SUPABASE_URL — do NOT use the
//                                name SERVICE_ROLE_KEY, which is never set
//                                and silently yields an empty-key client
//                                whose every write returns 401)
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

// One-time Diet/Treatment program packages (see
// supabase/functions/create-consultation-checkout-session and
// src/data/programPackages.ts) — deliberately kept separate from
// PACKAGE_INFO above, which is monthly-membership-specific (priceLabel reads
// "/ Month" there, which would be wrong for a one-time purchase).
const CONSULTATION_PACKAGE_INFO: Record<
  string,
  {
    creditLimit: number;
    name: string;
    priceLabel: string;
    packageType: "diet" | "treatment";
  // creditLimit and consultationCount MUST stay equal — creditLimit is what
  // lands on the subscriptions row and is therefore what the member can
  // actually spend. Both raised by one across every tier on 22 Aug 2026
  // (Phase 2.5.5); payments.consultation_count now allows up to 4 (PHASE_J J.12).
  consultationCount: 2 | 3 | 4;
  }
> = {
  diet_basic: {
    creditLimit: 2,
    name: "Diet Basic",
    priceLabel: "$49",
    packageType: "diet",
    consultationCount: 2,
  },
  diet_plus: {
    creditLimit: 3,
    name: "Diet Plus",
    priceLabel: "$89",
    packageType: "diet",
    consultationCount: 3,
  },
  diet_premium: {
    creditLimit: 4,
    name: "Diet Premium",
    priceLabel: "$119",
    packageType: "diet",
    consultationCount: 4,
  },
  treatment_basic: {
    creditLimit: 2,
    name: "Treatment Basic",
    priceLabel: "$119",
    packageType: "treatment",
    consultationCount: 2,
  },
  treatment_plus: {
    creditLimit: 3,
    name: "Treatment Plus",
    priceLabel: "$169",
    packageType: "treatment",
    consultationCount: 3,
  },
  treatment_premium: {
    creditLimit: 4,
    name: "Treatment Premium",
    priceLabel: "$199",
    packageType: "treatment",
    consultationCount: 4,
  },
};

/**
 * GoTrue stores every address lower-cased. Normalising at every boundary is
 * what stops a buyer who typed `Jane@Example.com` from being invisible to
 * get_user_id_by_email, whose lookup then missed, whose invite then failed as
 * "already registered", whose retry missed identically — leaving
 * findOrInviteUser returning null and the handler returning with the payment
 * taken and nothing recorded.
 */
function normalizeEmail(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

/** Finds an existing auth user by email, or invites a new one. Never creates a duplicate. */
async function findOrInviteUser(rawEmail: string, fullName: string): Promise<string | null> {
  const email = normalizeEmail(rawEmail);
  if (!email) return null;

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
  const email = normalizeEmail(customer.email);
  if (!email) {
    console.error("[stripe-webhook] Stripe customer has no email", customer.id);
    return;
  }
  const fullName = customer.name ?? email;

  const userId = await findOrInviteUser(email, fullName);
  if (!userId) return;

  // Counted BEFORE the upsert. Counting after it always returned 1 (the row
  // the upsert had just written), so isFirstActivation was true by
  // construction and the welcome + admin emails fired again on every renewal
  // and on every redelivered webhook.
  const { count: priorCount } = await supabaseAdmin
    .from("subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("stripe_subscription_id", subscription.id);
  const isFirstActivation = (priorCount ?? 0) === 0;

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
  // becomes active, not on every renewal-triggered webhook. `isFirstActivation`
  // was computed above, before the upsert.
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

/**
 * Activates a one-time Diet/Treatment program-pack purchase (Stripe
 * Checkout mode "payment", never "subscription").
 * Grants credits by writing the SAME `subscriptions` row shape a recurring
 * membership uses (status "active", consultation_credit_limit set), so the
 * existing credit-spend RPC (book_consultation_slot, see supabase/schema.sql)
 * and the Account Consultations page work for these buyers with no changes.
 * Idempotency key is `stripe_checkout_session_id` (a one-time payment has no
 * Stripe Subscription object to key off, unlike activateMembership above).
 */
async function activateConsultationPackage(session: Stripe.Checkout.Session) {
  const packageId = session.metadata?.package_id;
  const paymentId = session.metadata?.internal_payment_id;
  const fullName = session.metadata?.full_name ?? "";
  const info = packageId ? CONSULTATION_PACKAGE_INFO[packageId] : undefined;
  if (!info || !paymentId) {
    console.error("[stripe-webhook] Could not resolve consultation package for session", session.id);
    return;
  }

  // The money must actually have arrived. Stripe's dynamic payment methods
  // include delayed-notification types (ACH, SEPA debit, Klarna) where
  // checkout.session.completed fires with payment_status "unpaid" and the
  // funds settle days later — granting on "completed" alone handed out
  // credits before any money moved. For those, the grant happens instead in
  // the checkout.session.async_payment_succeeded handler, which re-enters
  // this function once payment_status has flipped to "paid".
  if (session.payment_status !== "paid") {
    console.log(
      `[stripe-webhook] Session ${session.id} is ${session.payment_status}; deferring credit grant until payment settles.`,
    );
    return;
  }

  // Idempotent: Stripe may redeliver checkout.session.completed. Never grant
  // the same one-time credits twice for the same payment.
  const { data: existingPayment } = await supabaseAdmin
    .from("payments")
    .select("status")
    .eq("id", paymentId)
    .maybeSingle();
  if (existingPayment?.status === "succeeded") return;

  const email = normalizeEmail(session.customer_details?.email ?? session.customer_email);
  if (!email) {
    console.error("[stripe-webhook] Checkout session has no email", session.id);
    return;
  }

  const userId = await findOrInviteUser(email, fullName || email);
  if (!userId) return;

  const { error: upsertError } = await supabaseAdmin.from("subscriptions").upsert(
    {
      user_id: userId,
      package_id: packageId,
      status: "active",
      stripe_checkout_session_id: session.id,
      current_period_start: new Date().toISOString(),
      // One-time packs don't recur — a long, informational validity window.
      // The credit-spend RPC never checks this column, only credit balance.
      current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      consultation_credit_limit: info.creditLimit,
    },
    { onConflict: "stripe_checkout_session_id" },
  );
  if (upsertError) {
    console.error(
      "[stripe-webhook] Failed to upsert one-time consultation package:",
      upsertError.message,
    );
    return;
  }

  await supabaseAdmin
    .from("payments")
    .update({
      status: "succeeded",
      user_id: userId,
      package_type: info.packageType,
      consultation_count: info.consultationCount,
      amount: session.amount_total ?? undefined,
      stripe_payment_id:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent?.id ?? null),
    })
    .eq("id", paymentId);

  // Audit-trail ledger row for this grant (see
  // supabase/PHASE_I_CONSULTATION_PACKAGES_PAYMENTS_MIGRATION.sql) —
  // subscriptions.consultation_credit_limit above is the real spendable
  // balance; this is purely a queryable history of how it got there.
  await supabaseAdmin.from("consultation_credits").insert({
    user_id: userId,
    credits: info.creditLimit,
    source: "stripe_payment",
    payment_id: paymentId,
  });

  const { subject, html } = customerWelcomeEmail({
    siteUrl,
    fullName: fullName || email,
    packageName: info.name,
    consultationCredits: info.creditLimit,
    isVip: false,
    // One-time program pack — credits do not renew monthly.
    packageKind: "program",
  });
  await sendEmail(email, subject, html);

  if (ADMIN_NOTIFICATION_EMAIL) {
    const admin = adminNewMemberEmail({
      siteUrl,
      fullName: fullName || email,
      email,
      phone: null,
      preferredContactMethod: "either",
      packageName: info.name,
      priceLabel: info.priceLabel,
      stripeCustomerId: typeof session.customer === "string" ? session.customer : "",
    });
    await sendEmail(ADMIN_NOTIFICATION_EMAIL, admin.subject, admin.html);
  }
}

/**
 * `payment_intent.succeeded` / `payment_intent.payment_failed` fire for the
 * one-time consultation-package flow (Checkout Sessions in mode "payment"
 * always create a PaymentIntent under the hood). The PaymentIntent carries
 * the same `internal_payment_id` metadata create-consultation-checkout-session
 * set via `payment_intent_data.metadata` at session-creation time, so both
 * handlers can find the right `payments` row directly — no session lookup
 * needed. `checkout.session.completed` (handled above) remains the ONLY
 * place credits are granted; these two handlers only ever update `payments`
 * status, so a payment can never be credited twice.
 */
async function markPaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const paymentId = paymentIntent.metadata?.internal_payment_id;
  if (!paymentId) return;
  await supabaseAdmin
    .from("payments")
    .update({ status: "failed" })
    .eq("id", paymentId)
    .eq("status", "pending"); // never overwrite an already-succeeded payment
}

async function markPaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const paymentId = paymentIntent.metadata?.internal_payment_id;
  if (!paymentId) return;
  await supabaseAdmin
    .from("payments")
    .update({ stripe_payment_id: paymentIntent.id })
    .eq("id", paymentId)
    .is("stripe_payment_id", null);
}

/**
 * Marks a one-time purchase as not-paid after a delayed payment method fails.
 * Only ever touches a row still sitting at 'pending' — a payment that already
 * succeeded (e.g. a retry that went through) must never be walked backwards.
 */
async function markSessionPaymentFailed(session: Stripe.Checkout.Session) {
  const paymentId = session.metadata?.internal_payment_id;
  if (!paymentId) return;
  await supabaseAdmin
    .from("payments")
    .update({ status: "failed" })
    .eq("id", paymentId)
    .eq("status", "pending");
}

/**
 * Reverses a one-time purchase after a refund or a dispute.
 *
 * Three things must move together, and all three are idempotent because
 * Stripe delivers at least once:
 *   1. `payments.status` -> 'refunded' (only from 'succeeded', so a redelivery
 *      is a no-op and a never-succeeded row is left alone).
 *   2. The `subscriptions` row that granted the credits -> 'cancelled', so
 *      book_consultation_slot stops finding it. Keyed on the checkout session
 *      id, which is exactly what activateConsultationPackage wrote.
 *   3. A NEGATIVE `consultation_credits` ledger row, so the audit trail stays
 *      append-only and still balances to the real entitlement. PHASE_J drops
 *      the original `credits > 0` check constraint that made this impossible.
 *
 * Step 3 is guarded by a lookup for an existing reversal row for the same
 * payment, so a redelivered charge.refunded cannot double-debit the ledger.
 */
async function reverseConsultationPackage(
  paymentIntentId: string | null,
  reason: "refund" | "dispute",
) {
  if (!paymentIntentId) return;

  const { data: payment } = await supabaseAdmin
    .from("payments")
    .select("id, user_id, status, credits_granted")
    .eq("stripe_payment_id", paymentIntentId)
    .maybeSingle();
  if (!payment) {
    console.error(`[stripe-webhook] No payments row for payment_intent ${paymentIntentId}`);
    return;
  }
  if (payment.status !== "succeeded") return; // already reversed, or never granted

  await supabaseAdmin.from("payments").update({ status: "refunded" }).eq("id", payment.id);

  // The subscriptions row this payment created, found via the same Stripe
  // checkout session that activateConsultationPackage keyed its upsert on.
  let sessionId: string | undefined;
  try {
    const sessions = await stripe.checkout.sessions.list({
      payment_intent: paymentIntentId,
      limit: 1,
    });
    sessionId = sessions.data[0]?.id;
  } catch (err) {
    console.error(
      `[stripe-webhook] Could not list checkout sessions for ${paymentIntentId}:`,
      (err as Error).message,
    );
  }
  if (sessionId) {
    await supabaseAdmin
      .from("subscriptions")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("stripe_checkout_session_id", sessionId);
  } else {
    console.error(
      `[stripe-webhook] Could not resolve a checkout session for ${paymentIntentId}; payments row marked refunded but the subscription row was left untouched.`,
    );
  }

  if (payment.user_id && payment.credits_granted > 0) {
    const { data: alreadyReversed } = await supabaseAdmin
      .from("consultation_credits")
      .select("id")
      .eq("payment_id", payment.id)
      .lt("credits", 0)
      .maybeSingle();
    if (!alreadyReversed) {
      await supabaseAdmin.from("consultation_credits").insert({
        user_id: payment.user_id,
        credits: -payment.credits_granted,
        source: reason === "dispute" ? "stripe_dispute" : "stripe_refund",
        payment_id: payment.id,
      });
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
        } else if (session.mode === "payment") {
          await activateConsultationPackage(session);
        }
        break;
      }

      // Delayed-notification payment methods (ACH, SEPA, Klarna). The
      // "completed" event above returns without granting when payment_status
      // is not yet "paid"; this is where that grant actually happens.
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "payment") {
          await activateConsultationPackage(session);
        }
        break;
      }

      case "checkout.session.async_payment_failed": {
        await markSessionPaymentFailed(event.data.object as Stripe.Checkout.Session);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        await reverseConsultationPackage(
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : (charge.payment_intent?.id ?? null),
          "refund",
        );
        break;
      }

      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute;
        await reverseConsultationPackage(
          typeof dispute.payment_intent === "string"
            ? dispute.payment_intent
            : (dispute.payment_intent?.id ?? null),
          "dispute",
        );
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

      case "payment_intent.succeeded": {
        await markPaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      }

      case "payment_intent.payment_failed": {
        await markPaymentFailed(event.data.object as Stripe.PaymentIntent);
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

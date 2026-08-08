# Payments, Email & Membership Activation Report

Architecture: React/Vite SPA → Supabase Auth + Database → Supabase Edge Functions → Stripe
Checkout → Stripe Webhooks → Membership Activation → Consultation Credits → Email Notifications.
The Hostinger-hosted frontend stays a static SPA; all Stripe/email operations that need a secret
happen exclusively in Supabase Edge Functions, never in the browser.

**Note on the credentials shared in chat:** a Stripe Secret Key was pasted directly into this
conversation. It was never written to any file, log, or commit in this repo (verified — see
Security section below), but since it was exposed in the chat transcript, **it should be rotated
in the Stripe Dashboard** before relying on it, even though it's a test-mode key.

## Stripe

- **Checkout integration**: `supabase/functions/create-checkout-session/index.ts` creates a real
  Stripe Checkout Session server-side (`mode: "subscription"`), collecting email and phone
  (`phone_number_collection: { enabled: true }`). The browser sends only a safe package identifier
  (`basic` | `premium` | `vip-elite`) — the function maps that to a trusted Stripe Price ID from its
  own environment secrets. No amount or price ever comes from the client.
- **Packages mapped**: Basic → `STRIPE_PRICE_BASIC` (1 credit), Premium → `STRIPE_PRICE_PREMIUM`
  (3 credits), VIP Elite → `STRIPE_PRICE_VIP` (12 credits, Priority Hotline). Credit limits are
  enforced server-side in the webhook, not trusted from the frontend.
- **Test mode status**: architected for Stripe Test Mode (uses whatever `STRIPE_SECRET_KEY` /
  Price IDs are configured — test or live are never mixed by this code, since it just reads
  whatever's set). **Not yet deployed or tested against a real Stripe account** — no Edge Function
  has been deployed in this session.
- **Webhook status**: `supabase/functions/stripe-webhook/index.ts` verifies the Stripe signature via
  `STRIPE_WEBHOOK_SECRET` and handles `checkout.session.completed`, `customer.subscription.created`,
  `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, and
  `invoice.payment_failed`. Every handler is idempotent: subscription rows are upserted on
  `stripe_subscription_id` (a repeat webhook updates, never duplicates), user lookup/invite is
  retried safely on race conditions, and the "first activation" emails only fire once per
  subscription. **Not deployed.**
- **Customer phone/email collection**: done at Checkout via `customer_email` + Stripe's native phone
  collection — no separate form re-implements this.
- **Customer Portal status**: not implemented. The architecture supports adding it later (a small
  Edge Function creating a Billing Portal session with the stored `stripe_customer_id`), but no
  "Manage Membership" button exists yet.

## Membership

- **Paid-account activation**: on a confirmed webhook, `findOrInviteUser()` looks up an existing
  Supabase Auth user by email (via a `get_user_id_by_email` SQL helper, service-role only) or
  invites a new one (`supabaseAdmin.auth.admin.inviteUserByEmail`) — never creating a duplicate
  account for an email that already exists.
- **Subscription database**: `public.subscriptions` (RLS: users can only `select` their own row; no
  client insert/update policy exists — only the service-role webhook can write it) stores
  `stripe_customer_id`, `stripe_subscription_id`, status, period dates, and credit limit/used.
- **Consultation credits**: `consultation_credit_limit` set from the package (1/3/12) on activation;
  `consultation_credits_used` is never writable by the client. The dashboard shows "X of Y
  Remaining" from this real column, not local React state.
- **Sign-in entitlement check**: `/account` reads the live `subscriptions` row; if none is active it
  shows "Your membership is not currently active" with "View Memberships" — it never fabricates an
  active state.
- **Lead capture**: `public.membership_leads` records Full Name/Email/Phone/Preferred Contact
  Method/Package **before** the visitor reaches Stripe, with status `started` → `checkout_created` →
  `paid` (paid is only ever set by the webhook, never by the client) — so the team can follow up on
  abandoned checkouts.

## Email

- **Contact form notification**: the Contact form (`Contact.tsx`) now calls a real backend
  (`supabase/functions/contact-submit`) instead of a `mailto:`-only handoff. It stores the inquiry in
  `public.contact_inquiries` (write-only from the client — no select policy, so submissions aren't
  publicly readable) and emails `ADMIN_NOTIFICATION_EMAIL` with Reply-by-Email and
  Follow-Up-on-WhatsApp actions. If the backend isn't configured or fails, the form falls back
  honestly to the previous `mailto:`/WhatsApp handoff — it never reports "sent" when it wasn't.
- **Paid-member notification**: `adminNewMemberEmail()` sends the admin a branded email with the
  customer's name, email, phone, preferred contact method, package, price, Stripe customer
  reference, and date — no card details, no medical information.
- **Customer welcome email**: `customerWelcomeEmail()` sends the new member their package,
  consultation-credit allowance, and an "Activate My Account" link to `/reset-password` (their
  Supabase invite email additionally carries the real activation link). VIP members are told
  Priority Hotline details appear inside their dashboard — no fake hotline number is sent.
- **Preferred contact method**: captured on the Join form and the Contact form
  (`whatsapp` | `email` | `either`), stored on `membership_leads` and `contact_inquiries`, and
  included in every admin notification email so the team knows how to follow up.
- All email sending goes through `supabase/functions/_shared/email.ts` using the Resend HTTP API
  from the Edge Function runtime only — `RESEND_API_KEY` is never referenced in any frontend file.
  Sending fails soft (logs a warning, doesn't throw) if `RESEND_API_KEY`/`EMAIL_FROM` aren't set.

## Security

- **No Stripe Secret Key in frontend** — confirmed. `VITE_STRIPE_PUBLISHABLE_KEY` is the only
  Stripe-related frontend variable (`src/config/stripe.ts`); `STRIPE_SECRET_KEY` and
  `STRIPE_WEBHOOK_SECRET` only appear as `Deno.env.get(...)` reads inside `supabase/functions/`.
- **No secret committed to Git** — a repo-wide search for `sk_`, `whsec_`, a `re_` Resend-key
  pattern, `service_role` value assignments, and the specific key prefix pasted in chat found
  **zero matches** outside of comments/documentation referencing the *names* of these secrets.
  `.gitignore` was tightened to explicitly exclude `.env`, `.env.local`, `.env.production`, and
  `.env.*.local` at any depth (covers `supabase/functions/.env` too).
- **No service role exposed** — `SUPABASE_SERVICE_ROLE_KEY` is read only via `Deno.env.get(...)` in
  Edge Functions; the frontend only ever uses `VITE_SUPABASE_PUBLISHABLE_KEY`.
- **Webhook signature verification enabled** — `stripe.webhooks.constructEventAsync(body, signature,
  webhookSecret)` runs before any event is processed; an invalid/missing signature returns `400`
  and nothing is written.
- Public write endpoints (`create-checkout-session`, `contact-submit`) include a honeypot field,
  server-side input length limits, and (for `contact-submit`) a lightweight per-email rate limit.

## Still Required From User

Frontend (`.env.local`, never committed):
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Supabase Edge Function secrets (`supabase secrets set NAME=value` — never in a file, never in chat):
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_BASIC`
- `STRIPE_PRICE_PREMIUM`
- `STRIPE_PRICE_VIP`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `ADMIN_NOTIFICATION_EMAIL`
- `SITE_URL`

Also required before anything above is real:
- Execute `supabase/schema.sql` against the live project (adds `membership_leads`,
  `contact_inquiries`, and the `get_user_id_by_email` helper on top of the existing tables).
- Deploy the three Edge Functions: `create-checkout-session`, `stripe-webhook`, `contact-submit`.
- Register the deployed `stripe-webhook` URL in the Stripe Dashboard (Developers → Webhooks),
  subscribed to the six event types listed above.
- Verify a sending domain in Resend and set `EMAIL_FROM` to an address on it.

**This is not production-ready.** Nothing above has been deployed or tested against live
credentials in this session. Payments must not be treated as live until Live Stripe credentials, a
Live webhook, and a real Supabase project have all been configured and verified end-to-end (test
Basic/Premium/VIP checkout, webhook delivery, duplicate-webhook idempotency, and both emails).

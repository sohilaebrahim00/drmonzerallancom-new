# Stripe Setup — Dr. Monzer Allan Website

This project is **prepared** for Stripe but not yet connected to a live Stripe
account. Nothing here works until you create the products/prices below in
your own Stripe Dashboard and set the environment variables/secrets listed
at the bottom. No key is hardcoded anywhere in this repository.

There are two independent Stripe flows in this codebase:

1. **Membership** (recurring, monthly) — Basic / Premium / VIP Elite. Already
   built in a previous pass: `supabase/functions/create-checkout-session`,
   `supabase/functions/stripe-webhook`, `src/data/packages.ts`.
2. **Pay-Per-Consultation** (one-time, no recurring billing) — Single / Double
   Consultation. Added in this pass: `supabase/functions/create-consultation-checkout-session`,
   the same `stripe-webhook` function (extended, not replaced), `src/data/consultationPackages.ts`.

Both flows write consultation credits into the **same** `public.subscriptions`
table and are spent through the **same** existing booking system
(`book_consultation_slot` in `supabase/schema.sql`, and the Account →
Consultations page). A pay-per-consultation buyer is simply a `subscriptions`
row with `status = 'active'` and no real recurring Stripe subscription behind
it — see `supabase/PHASE_I_CONSULTATION_PACKAGES_PAYMENTS_MIGRATION.sql` for
exactly how.

---

## 1. Publishable Key

**Where to get it:**
Stripe Dashboard → **Developers** → **API Keys** → *Publishable key*

**Used in:** Frontend (safe to ship in the browser bundle — it identifies
your Stripe account, it is not a secret). Currently unused directly (Checkout
redirects to a Stripe-hosted page, so no Stripe.js is loaded client-side yet)
but wired up in `src/config/stripe.ts` for future use (Stripe Elements, a
Customer Portal button, etc.).

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## 2. Secret Key

**Where to get it:**
Stripe Dashboard → **Developers** → **API Keys** → *Secret key*

**Used in:** Backend **only** — a Supabase Edge Function secret, never a
`VITE_*` variable, never committed, never logged.

```
STRIPE_SECRET_KEY=sk_live_...
```

Set it with the Supabase CLI (after `supabase login` and `supabase link`):

```
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
```

---

## 3. Webhook Secret

**Where to get it:**
Stripe Dashboard → **Developers** → **Webhooks** → **Add endpoint** →
point it at your deployed `stripe-webhook` function URL (see below) →
after creating it, open the endpoint → **Signing secret**.

**Endpoint URL to register:**
```
https://<your-project-ref>.supabase.co/functions/v1/stripe-webhook
```

**Events to subscribe the endpoint to:**
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

**Used for:** Verifying that a webhook request genuinely came from Stripe
before ever writing a subscription/payment/credit to the database.

```
STRIPE_WEBHOOK_SECRET=whsec_...
```

```
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 4. Price IDs

**Where to get them:**
Stripe Dashboard → **Products** → **Create product** → **Add price** →
copy the generated **Price ID** (starts with `price_...`).

Create **5 prices total**:

| Product | Type | Price | Env var |
|---|---|---|---|
| Basic Membership | Recurring, monthly | $29/mo | `STRIPE_PRICE_BASIC` |
| Premium Membership | Recurring, monthly | $61/mo | `STRIPE_PRICE_PREMIUM` |
| VIP Elite Membership | Recurring, monthly | $103/mo | `STRIPE_PRICE_VIP` |
| Single Consultation | **One-time** | $49 | `STRIPE_PRICE_SINGLE` |
| Double Consultation | **One-time** | $119 | `STRIPE_PRICE_DOUBLE` |

The two consultation prices **must** be created as **one-time** prices (not
recurring) — the checkout session for them is created with `mode: "payment"`,
which requires a one-time Price ID. Using a recurring price there will cause
Stripe to reject the checkout session.

```
STRIPE_PRICE_BASIC=price_...
STRIPE_PRICE_PREMIUM=price_...
STRIPE_PRICE_VIP=price_...
STRIPE_PRICE_SINGLE=price_...
STRIPE_PRICE_DOUBLE=price_...
```

```
supabase secrets set STRIPE_PRICE_BASIC=price_... STRIPE_PRICE_PREMIUM=price_... STRIPE_PRICE_VIP=price_... STRIPE_PRICE_SINGLE=price_... STRIPE_PRICE_DOUBLE=price_...
```

---

## 5. Other required secrets (already part of the existing membership flow)

```
SUPABASE_SERVICE_ROLE_KEY   # from Supabase Dashboard → Settings → API (SUPABASE_URL is provided automatically to Edge Functions)
SITE_URL=https://monzerallan.com
RESEND_API_KEY              # for the welcome/admin notification emails
EMAIL_FROM
ADMIN_NOTIFICATION_EMAIL
```

---

## 6. Full environment variable reference

**Frontend (`.env.local` / your Netlify site environment) — safe to expose:**
```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_STRIPE_PUBLISHABLE_KEY=
```

**Backend (Supabase Edge Function secrets — `supabase secrets set`, NEVER in a `VITE_*` var or committed to git):**
```
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_BASIC=
STRIPE_PRICE_PREMIUM=
STRIPE_PRICE_VIP=
STRIPE_PRICE_SINGLE=
STRIPE_PRICE_DOUBLE=
SUPABASE_SERVICE_ROLE_KEY=
SITE_URL=
RESEND_API_KEY=
EMAIL_FROM=
ADMIN_NOTIFICATION_EMAIL=
```

---

## 7. Deployment steps (once you have real Stripe keys)

1. Review and run `supabase/PHASE_I_CONSULTATION_PACKAGES_PAYMENTS_MIGRATION.sql`
   in the Supabase SQL Editor (or `supabase db push`). **This has not been
   applied automatically — nothing in this repo has touched your live
   database.**
2. `supabase login` (one-time browser authorization).
3. `supabase link --project-ref <your-project-ref>`
4. Set every secret from section 6 above with `supabase secrets set`.
5. Deploy the functions:
   ```
   supabase functions deploy create-checkout-session
   supabase functions deploy create-consultation-checkout-session
   supabase functions deploy stripe-webhook
   ```
6. Register the webhook endpoint in the Stripe Dashboard (section 3 above)
   and confirm its **Signing secret** matches `STRIPE_WEBHOOK_SECRET`.
7. Set `VITE_STRIPE_PUBLISHABLE_KEY` and confirm `VITE_SUPABASE_URL` /
   `VITE_SUPABASE_PUBLISHABLE_KEY` in your Netlify site's environment
   variables, then redeploy the site.
8. Test with Stripe's test-mode keys and test card `4242 4242 4242 4242`
   before switching to live keys.

---

## 8. What's already built vs. what still needs a Stripe account

**Already built (this repo, code-complete, currently inert without keys):**
- Pricing cards + "Buy Now" dialog with loading/error states for both one-time packages (`src/components/sections/ConsultationPackages.tsx`)
- Checkout session creation for both flows, server-side, price-ID-mapped (never trusts a client-sent amount)
- Webhook handling for both flows: `checkout.session.completed` (subscription **and** one-time payment), subscription lifecycle events
- Credit assignment: $49 → 1 credit, $119 → 2 credits, written to the same `subscriptions` row shape the membership flow already uses
- `payments` ledger table (migration file, not yet applied) for transaction/booking history
- Idempotent webhook handlers (safe against Stripe's at-least-once delivery retries)

**You still need to do, outside this repo:**
- Create a Stripe account (or use an existing one) and the 5 products/prices above
- Set every secret in section 6
- Apply the migration file
- Register and verify the webhook endpoint

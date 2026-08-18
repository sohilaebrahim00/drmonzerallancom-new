# Stripe Setup — Dr. Monzer Allan Website

This project is a **Vite + React SPA with Supabase Edge Functions** as its
backend — **not Next.js**, and there is no Node/Express API server. Two
naming conventions commonly requested for Stripe integrations don't apply
here, and using them literally would silently break things:

- **`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is a Next.js convention.** Vite only
  exposes environment variables to the browser if they're prefixed `VITE_`.
  This project already has that variable — it's called
  `VITE_STRIPE_PUBLISHABLE_KEY` (see `src/config/stripe.ts`). Use that name.
- **`/api/stripe/webhook` is a Next.js/Node API-route convention.** This SPA
  has no server to host such a route — `npm run build:web` produces static
  files only. The real webhook endpoint is a **Supabase Edge Function**,
  already built, reachable at a stable URL as soon as it's deployed (see
  §3 below) — independent of Netlify entirely.

Both are addressed below using the correct equivalents for this stack.

---

## Live keys already wired in

You supplied a **live** Publishable Key and two **live** Product ids. They've
been set as follows:

- `VITE_STRIPE_PUBLISHABLE_KEY` — set in `.env.local` (gitignored, not
  pushed to GitHub) for local dev. **You must also add it to your Netlify
  site's environment variables** — `.env.local` never reaches the deployed
  build.
- The two Product ids (`prod_V65LDqOWTMszsA` / `prod_V65LiK6qbXvnqy`) are
  recorded as reference in `src/data/consultationPackages.ts`, but the
  browser never sends them to Stripe — the *trusted* copy the backend
  actually charges against lives in Supabase Edge Function secrets
  (`STRIPE_PRODUCT_SINGLE` / `STRIPE_PRODUCT_DOUBLE`, §4 below), which is
  what actually determines what a customer is charged.

**Not yet set (you still need to provide these — never share a Secret Key or
Webhook Secret in chat/docs):** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
Nothing in this integration can charge a card or grant a credit until those
two are set as Supabase secrets.

---

## Two independent Stripe flows in this codebase

1. **Membership** (recurring, monthly) — Basic / Premium / VIP Elite.
   `supabase/functions/create-checkout-session`, `src/data/packages.ts`.
2. **Pay-Per-Consultation** (one-time, no recurring billing) — Single $49 /
   Double $119 Consultation. `supabase/functions/create-consultation-checkout-session`,
   `src/data/consultationPackages.ts`.

Both are handled by the **same** `supabase/functions/stripe-webhook`
function (extended, not duplicated) and both ultimately grant credits onto
the **same** `public.subscriptions` table, spent through the **same**
existing booking system (`book_consultation_slot` in `supabase/schema.sql`,
and the Account → Consultations page). A pay-per-consultation buyer is
simply a `subscriptions` row with `status = 'active'` and no real recurring
Stripe subscription behind it. See
`supabase/PHASE_I_CONSULTATION_PACKAGES_PAYMENTS_MIGRATION.sql` for exactly
how, including the new `payments` and `consultation_credits` tables.

---

## 1. Publishable Key

**Where to get it:** Stripe Dashboard → **Developers** → **API Keys** →
*Publishable key*.

**Used in:** Frontend — safe to ship in the browser bundle (it identifies
your Stripe account, it is not a secret). The current checkout flow
redirects to a Stripe-hosted Checkout page rather than loading Stripe.js
client-side, so this key isn't functionally called yet, but it's wired into
`src/config/stripe.ts` (`stripePublishableKey`, `isStripeConfigured`) ready
for that or a Customer Portal button later.

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## 2. Secret Key

**Where to get it:** Stripe Dashboard → **Developers** → **API Keys** →
*Secret key*.

**Used in:** Backend **only** — a Supabase Edge Function secret, never a
`VITE_*` variable, never committed, never logged.

```
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
```

Use a **test-mode** secret key (`sk_test_...`) while developing — see §7.

---

## 3. Webhook Secret

**Where to get it:** Stripe Dashboard → **Developers** → **Webhooks** →
**Add endpoint** → point it at your deployed `stripe-webhook` function URL
below → after creating it, open the endpoint → **Signing secret**.

**Endpoint URL to register** (this is the real equivalent of "the deployment
URL" for this stack — it exists as soon as you deploy the function, whether
or not the frontend is on Netlify yet):
```
https://<your-supabase-project-ref>.supabase.co/functions/v1/stripe-webhook
```

**Events to subscribe the endpoint to:**
- `checkout.session.completed`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

Per your instruction, **this has deliberately not been registered yet** —
do that once the function is deployed and you have a stable endpoint URL.

```
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 4. Products (you gave live Product ids directly — no Price ids needed)

Unlike the membership flow (which needs a pre-created recurring **Price**
id), the two consultation packages are charged via Stripe's `price_data`
API: the Edge Function builds a one-time price on the fly from the **Product
id** + a server-side-trusted amount, at checkout time. That's why you only
needed to give Product ids, not Price ids.

| Package | Product id | Amount | Env var |
|---|---|---|---|
| Single Consultation | `prod_V65LDqOWTMszsA` | $49.00 | `STRIPE_PRODUCT_SINGLE` |
| Double Consultation | `prod_V65LiK6qbXvnqy` | $119.00 | `STRIPE_PRODUCT_DOUBLE` |

```
supabase secrets set STRIPE_PRODUCT_SINGLE=prod_V65LDqOWTMszsA STRIPE_PRODUCT_DOUBLE=prod_V65LiK6qbXvnqy
```

**Test mode note:** the two Product ids above are **live-mode** ids (they
won't exist when your Stripe Secret Key is a `sk_test_...` key — live and
test mode have entirely separate product catalogs). Create matching test
products in the Stripe Dashboard while in **Test mode** (top-right toggle)
before testing locally, and set `STRIPE_PRODUCT_SINGLE`/`_DOUBLE` to those
test-mode ids instead while testing — swap back to the live ids in §4's
table when you set live secrets for production.

The exact charge amount is controlled by `PACKAGE_AMOUNT_CENTS` in
`supabase/functions/create-consultation-checkout-session/index.ts` (4900 /
11900 cents) — the Product's own Dashboard price, if it has one, is **not**
what gets charged; this function always builds its own `price_data` at the
amount defined there. Change that constant (and the mirror copy in
`src/data/consultationPackages.ts`) if the price ever changes.

**Membership Price ids** (unchanged from the previous pass — still needed
for the recurring flow):
```
supabase secrets set STRIPE_PRICE_BASIC=price_... STRIPE_PRICE_PREMIUM=price_... STRIPE_PRICE_VIP=price_...
```

---

## 5. Other required secrets (already part of the existing setup)

```
SUPABASE_SERVICE_ROLE_KEY   # from Supabase Dashboard → Settings → API (SUPABASE_URL is provided automatically to Edge Functions)
SITE_URL=https://monzerallan.com
RESEND_API_KEY              # for the welcome/admin notification emails
EMAIL_FROM
ADMIN_NOTIFICATION_EMAIL
```

---

## 6. Full environment variable reference

**Frontend (`.env.local` for dev; your Netlify site's environment variables for production) — safe to expose:**
```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_STRIPE_PUBLISHABLE_KEY=
```

**Backend (Supabase Edge Function secrets — `supabase secrets set`, NEVER in a `VITE_*` var, NEVER committed):**
```
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_BASIC=
STRIPE_PRICE_PREMIUM=
STRIPE_PRICE_VIP=
STRIPE_PRODUCT_SINGLE=
STRIPE_PRODUCT_DOUBLE=
SUPABASE_SERVICE_ROLE_KEY=
SITE_URL=
RESEND_API_KEY=
EMAIL_FROM=
ADMIN_NOTIFICATION_EMAIL=
```

---

## 7. How to test payments (test mode)

1. In the Stripe Dashboard, switch to **Test mode**.
2. Create test-mode versions of the two consultation products (§4) and the
   three membership prices, and grab their test-mode ids.
3. `supabase secrets set STRIPE_SECRET_KEY=sk_test_...` plus the test-mode
   product/price ids from step 2.
4. Deploy the functions (§8) and register a **test-mode** webhook endpoint
   pointed at the same Supabase function URL, with its own `whsec_...`.
5. Run the site locally (`npm run dev`) or on a Netlify preview deploy, go
   through checkout, and pay with a Stripe test card:
   - Success: `4242 4242 4242 4242`, any future expiry, any CVC/ZIP
   - Decline: `4000 0000 0000 0002`
6. Confirm in Supabase Table Editor: a `payments` row exists with
   `status = 'succeeded'`, a `consultation_credits` row was inserted, and
   `subscriptions.consultation_credit_limit` increased for that user.

## How to switch from test mode to live mode

Live and test mode are entirely separate in Stripe (separate products,
prices, webhook endpoints, and keys). To go live:

1. Re-create the same 2 products (+ 3 membership prices) in **Live mode**
   if you haven't already (you already have: `prod_V65LDqOWTMszsA`,
   `prod_V65LiK6qbXvnqy`).
2. `supabase secrets set STRIPE_SECRET_KEY=sk_live_...` and reset the
   product/price env vars to the live ids.
3. Register a new webhook endpoint in **Live mode** pointed at the same
   function URL, and set `STRIPE_WEBHOOK_SECRET` to *that* endpoint's
   signing secret (test and live webhook secrets are different, even for
   the same URL).
4. Set `VITE_STRIPE_PUBLISHABLE_KEY` in Netlify to the live `pk_live_...`
   key (already given — see top of this file) and redeploy.
5. Do one real, small live purchase yourself before announcing it's live.

---

## 8. Deployment steps

1. Review and run `supabase/PHASE_I_CONSULTATION_PACKAGES_PAYMENTS_MIGRATION.sql`
   in the Supabase SQL Editor (or `supabase db push`). **This has not been
   applied automatically — nothing in this repo has touched your live
   database.**
2. `supabase login` (one-time browser authorization).
3. `supabase link --project-ref <your-project-ref>`
4. Set every secret from §6 above with `supabase secrets set`.
5. Deploy the functions:
   ```
   supabase functions deploy create-checkout-session
   supabase functions deploy create-consultation-checkout-session
   supabase functions deploy stripe-webhook
   ```
6. Register the webhook endpoint in the Stripe Dashboard (§3) — **not yet
   done, per your instruction to wait**.
7. Set `VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL`,
   `VITE_SUPABASE_PUBLISHABLE_KEY` in your Netlify site's environment
   variables, then redeploy the site.
8. Test with test-mode keys (§7) before switching to live.

---

## 9. Database tables this adds (not yet applied)

**`payments`** — one row per Stripe Checkout attempt:
`id, user_id, full_name, email, package_id, product_id, stripe_session_id, stripe_payment_id, amount, currency, status, credits_granted, created_at`

**`consultation_credits`** — append-only grant history (audit ledger):
`id, user_id, credits, source, payment_id, created_at`

The actual **spendable balance** stays on the existing
`subscriptions.consultation_credit_limit` / `consultation_credits_used`
columns, which `book_consultation_slot()` already reads — `consultation_credits`
is a queryable history of how that balance grew, not a second balance to keep
in sync. Both are written in the same webhook operation, so they never drift
apart.

---

## 10. What's already built vs. what still needs your action

**Already built (code-complete, currently inert without the two missing secrets):**
- Premium pricing cards + purchase dialog with loading/error states (`src/components/sections/ConsultationPackages.tsx`)
- Checkout session creation for both flows, server-side, product/price-mapped (never trusts a client-sent amount)
- Webhook handling: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`, plus the existing subscription lifecycle events
- Credit assignment: $49 → 1 credit, $119 → 2 credits, written to `subscriptions` + a `consultation_credits` audit row
- Idempotent handlers (safe against Stripe's at-least-once webhook delivery)
- Success page (`/membership/success`) and cancelled/failed page (`/membership/cancelled`), both package-agnostic

**You still need to do, outside this repo:**
- Get `STRIPE_SECRET_KEY` and (after deploying) `STRIPE_WEBHOOK_SECRET`
- Set every secret in §6
- Apply the migration file
- Deploy the 3 functions, then register the webhook endpoint
- Add `VITE_STRIPE_PUBLISHABLE_KEY` to Netlify's environment variables

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

## Live keys already wired in / what changed in this pass

You supplied a **live** Publishable Key previously — still set in
`.env.local` (gitignored) as `VITE_STRIPE_PUBLISHABLE_KEY`. **You must also
add it to your Netlify site's environment variables** — `.env.local` never
reaches the deployed build.

**The pricing model has been fully replaced.** The old flat Single ($49) /
Double ($119) Consultation packages are gone — the two Stripe Product ids
you gave for them (`prod_V65LDqOWTMszsA`, `prod_V65LiK6qbXvnqy`) are no
longer referenced anywhere in the code and are safe to archive/delete in
your Stripe Dashboard whenever convenient. In their place: **6 one-time
program packages** across two categories (§4).

**Not yet set (still needed — never share a Secret Key or Webhook Secret in
chat/docs):** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and **6 new
Product ids** (§4 — you haven't created these 6 products in Stripe yet).
Nothing in this integration can charge a card or grant a credit until those
are set as Supabase secrets.

---

## Two independent Stripe flows in this codebase

1. **Membership** (recurring, monthly) — Basic / Premium / VIP Elite.
   `supabase/functions/create-checkout-session`, `src/data/packages.ts`.
2. **Program packages** (one-time, no recurring billing) — Diet Basic/Plus/
   Premium and Treatment Basic/Plus/Premium (6 packages, §4).
   `supabase/functions/create-consultation-checkout-session`,
   `src/data/programPackages.ts`.

Both are handled by the **same** `supabase/functions/stripe-webhook`
function (extended, not duplicated) and both ultimately grant credits onto
the **same** `public.subscriptions` table, spent through the **same**
existing booking system (`book_consultation_slot` in `supabase/schema.sql`,
and the Account → Consultations page). A program-package buyer is simply a
`subscriptions` row with `status = 'active'` and no real recurring Stripe
subscription behind it. See
`supabase/PHASE_I_CONSULTATION_PACKAGES_PAYMENTS_MIGRATION.sql` for exactly
how, including the `payments` and `consultation_credits` tables.

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

Register this once you have a stable deployment URL, per your instruction.

```
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 4. Products — the 6 program packages (Product ids, not Price ids)

Unlike the membership flow (which needs a pre-created recurring **Price**
id), each program package is charged via Stripe's `price_data` API: the
Edge Function builds a one-time price on the fly from the **Product id** +
a server-side-trusted amount, at checkout time. That means you only need to
create 6 **Products** in Stripe (Dashboard → Products → Add product) — no
Price needs to be attached to them for this to work, though Stripe requires
at least a placeholder price to save a product; it's ignored either way.

| Package | Includes | Amount | Env var |
|---|---|---|---|
| Diet Basic | Nutrition program, 1 consultation, monthly follow-up | $49.00 | `STRIPE_PRODUCT_DIET_BASIC` |
| Diet Plus | Nutrition program, 2 consultations, monthly follow-up | $69.00 | `STRIPE_PRODUCT_DIET_PLUS` |
| Diet Premium | Nutrition program, 3 consultations, monthly follow-up | $89.00 | `STRIPE_PRODUCT_DIET_PREMIUM` |
| Treatment Basic | Treatment plan, 1 consultation | $119.00 | `STRIPE_PRODUCT_TREATMENT_BASIC` |
| Treatment Plus | Treatment plan, 2 consultations | $139.00 | `STRIPE_PRODUCT_TREATMENT_PLUS` |
| Treatment Premium | Treatment plan, 3 consultations | $159.00 | `STRIPE_PRODUCT_TREATMENT_PREMIUM` |

None of these 6 products exist in your Stripe account yet — create them,
then:

```
supabase secrets set \
  STRIPE_PRODUCT_DIET_BASIC=prod_... \
  STRIPE_PRODUCT_DIET_PLUS=prod_... \
  STRIPE_PRODUCT_DIET_PREMIUM=prod_... \
  STRIPE_PRODUCT_TREATMENT_BASIC=prod_... \
  STRIPE_PRODUCT_TREATMENT_PLUS=prod_... \
  STRIPE_PRODUCT_TREATMENT_PREMIUM=prod_...
```

**Test mode note:** Product ids are per-mode (live and test mode have
entirely separate product catalogs). Create the same 6 products in **Test
mode** (top-right toggle in the Dashboard) first and use those ids while
developing (§7) — switch to live-mode ids only once you set live secrets
for production (§7's "switch to live mode" section).

The exact charge amount is controlled by `PACKAGES` (`amountCents` per
package) in
`supabase/functions/create-consultation-checkout-session/index.ts` — the
Product's own Dashboard price, if it has one, is **not** what gets charged;
this function always builds its own `price_data` at the amount defined
there. Change that constant (and the mirror copy in
`src/data/programPackages.ts`) if a price ever changes.

**Membership Price ids** (unchanged — still needed for the recurring flow):
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
STRIPE_PRODUCT_DIET_BASIC=
STRIPE_PRODUCT_DIET_PLUS=
STRIPE_PRODUCT_DIET_PREMIUM=
STRIPE_PRODUCT_TREATMENT_BASIC=
STRIPE_PRODUCT_TREATMENT_PLUS=
STRIPE_PRODUCT_TREATMENT_PREMIUM=
SUPABASE_SERVICE_ROLE_KEY=
SITE_URL=
RESEND_API_KEY=
EMAIL_FROM=
ADMIN_NOTIFICATION_EMAIL=
```

`STRIPE_PRODUCT_SINGLE` / `STRIPE_PRODUCT_DOUBLE` from the previous pricing
model are gone — remove them from any secrets store where you'd already set
them (harmless to leave, but unused).

---

## 7. How to test payments (test mode)

1. In the Stripe Dashboard, switch to **Test mode**.
2. Create test-mode versions of the 6 program products (§4) and the 3
   membership prices, and grab their test-mode ids.
3. `supabase secrets set STRIPE_SECRET_KEY=sk_test_...` plus the test-mode
   product/price ids from step 2.
4. Deploy the functions (§8) and register a **test-mode** webhook endpoint
   pointed at the same Supabase function URL, with its own `whsec_...`.
5. Run the site locally (`npm run dev`) or on a Netlify preview deploy, go
   through checkout on the Packages page (either the Weight Loss Program or
   Treatment Program tab), and pay with a Stripe test card:
   - Success: `4242 4242 4242 4242`, any future expiry, any CVC/ZIP
   - Decline: `4000 0000 0000 0002`
6. Confirm in Supabase Table Editor: a `payments` row exists with
   `status = 'succeeded'`, the correct `package_type` ('diet' or
   'treatment') and `consultation_count` (1/2/3), a `consultation_credits`
   row was inserted, and `subscriptions.consultation_credit_limit`
   increased for that user by the same count.

### How to switch from test mode to live mode

Live and test mode are entirely separate in Stripe (separate products,
prices, webhook endpoints, and keys). To go live:

1. Create the 6 program products (+ 3 membership prices) in **Live mode**.
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
6. Register the webhook endpoint in the Stripe Dashboard (§3).
7. Set `VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL`,
   `VITE_SUPABASE_PUBLISHABLE_KEY` in your Netlify site's environment
   variables, then redeploy the site.
8. Test with test-mode keys (§7) before switching to live.

---

## 9. Database tables this adds (not yet applied)

**`payments`** — one row per Stripe Checkout attempt:
`id, user_id, full_name, email, package_id, package_type, consultation_count, product_id, stripe_session_id, stripe_payment_id, amount, currency, status, credits_granted, created_at`

- `package_id` — internal slug, one of `diet_basic` / `diet_plus` /
  `diet_premium` / `treatment_basic` / `treatment_plus` / `treatment_premium`
- `package_type` — `diet` or `treatment`
- `consultation_count` — `1`, `2`, or `3`

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

**Already built (code-complete, currently inert without secrets):**
- Premium pricing UI: two tabs ("Weight Loss Program" / "Treatment
  Program"), each showing 3 tier cards with price, consultation count, and
  a "Start Your Program" CTA opening a purchase dialog with loading/error
  states (`src/components/sections/ProgramPackages.tsx`)
- Checkout session creation for all 6 packages, server-side, product-mapped
  (never trusts a client-sent amount)
- Webhook handling: `checkout.session.completed`, `payment_intent.succeeded`,
  `payment_intent.payment_failed`, plus the existing subscription lifecycle
  events
- Credit assignment matched to `consultation_count` (1/2/3), written to
  `subscriptions` + a `consultation_credits` audit row, with `package_type`
  and `consultation_count` also recorded on the `payments` row itself
- Idempotent handlers (safe against Stripe's at-least-once webhook delivery)
- Success page (`/membership/success`) and cancelled/failed page
  (`/membership/cancelled`), both package-agnostic

**You still need to do, outside this repo:**
- Create the 6 program Products in Stripe (§4) — none exist yet
- Get `STRIPE_SECRET_KEY` and (after deploying) `STRIPE_WEBHOOK_SECRET`
- Set every secret in §6
- Apply the migration file
- Deploy the 3 functions, then register the webhook endpoint
- Add `VITE_STRIPE_PUBLISHABLE_KEY` to Netlify's environment variables

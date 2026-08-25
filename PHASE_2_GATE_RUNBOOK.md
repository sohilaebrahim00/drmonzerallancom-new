# Phase 2 gate — runbook
Everything here needs Stripe / Supabase / Netlify access, so it is yours to run.
Work top to bottom. Do not skip the ordering in step 3 — it is the one place a wrong sequence
breaks the live site.

---

## 0. Before you start

- Stripe **Test mode** toggle ON (top right of the dashboard). Test and live are separate worlds:
  live product ids do not exist in test, and live keys will not work here.
- Have the Supabase project open, and know your Netlify site.
- Expect test rows to land in the production database. They are all identifiable later by
  `stripe_checkout_session_id like 'cs_test_%'`.

---

## 1. Create the 6 products in test mode

### 1.0 First — do you already have these products, and in which mode?

Products are **per-mode**: a live product id does not exist in test mode and vice versa. Both look
like `prod_…`, so the id alone tells you nothing.

To check: turn the **Test mode** toggle ON, then open Products.
- The six are listed → they are test products. Copy their ids and go straight to step 2.
- The list is empty or shows different products → yours are live-only. Create six test ones below.

Toggle Test mode OFF and look again to confirm what exists in live.

### 1.1–1.2 Create the six (test mode)

Stripe → Products → Add product, six times. Name them **exactly** as below — this is the text the
customer reads on the Stripe checkout page — and copy each **Product id** (`prod_…`, not the price
id):

| Package | Price |
|---|---|
| Diet Basic | $49 |
| Diet Plus | $89 |
| Diet Premium | $119 |
| Treatment Basic | $119 |
| Treatment Plus | $169 |
| Treatment Premium | $199 |

> **Corrected 22 Aug.** An earlier version of this runbook warned that the Stripe product price and
> the code must match. That is wrong for this codebase. `create-consultation-checkout-session`
> builds an **ad-hoc price** at checkout time:
> ```ts
> price_data: { currency: "usd", product: productId, unit_amount: def.amountCents }
> ```
> The product supplies only the **name and description** shown on the Stripe checkout page. Any Price
> object attached to the product is never read. So the amount the customer sees and pays comes
> entirely from `amountCents` in the Edge Function — item 2.5.1 — and the price you type when creating
> a product is cosmetic.
>
> Set it to the correct figure anyway, so the Stripe dashboard does not mislead you later, but
> **existing products never need their price corrected to fix a charge.**

Keep the six `prod_…` ids in a scratch note — step 2 needs them.

Fastest way to collect all six at once, rather than opening each product: on the Product catalog
page press **Edit columns** and enable the **ID** column, or use **Export products** for a CSV.

---

## 2. Set the Supabase secrets

```
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_PRODUCT_DIET_BASIC=prod_...
supabase secrets set STRIPE_PRODUCT_DIET_PLUS=prod_...
supabase secrets set STRIPE_PRODUCT_DIET_PREMIUM=prod_...
supabase secrets set STRIPE_PRODUCT_TREATMENT_BASIC=prod_...
supabase secrets set STRIPE_PRODUCT_TREATMENT_PLUS=prod_...
supabase secrets set STRIPE_PRODUCT_TREATMENT_PREMIUM=prod_...
supabase secrets set SITE_URL=https://monzerallan.com
```

`SITE_URL` is now required — Phase 1 item 1.5 made the checkout functions fail rather than fall back
to a client-supplied value. If it is unset, checkout returns a 500.

⚠️ The six `STRIPE_PRODUCT_*` secrets must hold the **test** product ids for the duration of the gate,
and be swapped back to the **live** ids in step 7. If a live id is set while Stripe is in test mode,
checkout returns "This program package isn't available yet." Note your live ids somewhere before
overwriting them.

Confirm with `supabase secrets list` (it shows names and digests, never values).

---

## 3. Deploy — in this exact order

This is item 2.11. `PHASE_J` revokes table-wide `select` on `profiles`; the **currently deployed**
bundle still selects `is_admin`. Applying the SQL first breaks the live site until the new bundle
lands.

**3a. Frontend first**
```
npm run build:web
```
Deploy `dist/` to Netlify. Make sure `VITE_STRIPE_PUBLISHABLE_KEY` in Netlify's environment
variables is the **test** publishable key (`pk_test_…`) for the duration of this exercise, then
trigger the deploy so it is baked into the bundle. Load the site and confirm it renders.

**3b. Then the SQL**

Run `supabase/PHASE_J_FIXES_MIGRATION.sql` in the Supabase SQL Editor. It is idempotent, so a second
run is harmless. After it finishes, sign in to the live site once and confirm your account page still
loads — that is the `profiles` grant change proving itself.

**3c. Then the functions**
```
supabase functions deploy stripe-webhook --no-verify-jwt
supabase functions deploy create-consultation-checkout-session
supabase functions deploy create-checkout-session
supabase functions deploy ai-chat
supabase functions deploy food-scan
supabase functions deploy food-search
supabase functions deploy contact-submit
supabase functions deploy create-consultation
supabase functions deploy get-availability
supabase functions deploy admin-availability
supabase functions deploy delete-account
```
`--no-verify-jwt` on the webhook is item 2.4. If `supabase/config.toml` is picked up you can drop the
flag, but passing it explicitly costs nothing and removes the doubt.

---

## 4. Register the webhook — the step people get wrong

Stripe → Developers → Webhooks → **Add endpoint** (still in test mode).

**Endpoint URL:**
```
https://<project-ref>.supabase.co/functions/v1/stripe-webhook
```

**Events to select** — all **twelve**. The webhook has a `case` for each; anything you leave out is
a handler that silently never runs.

One-time program packages (the four Phase 2 added):
- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `charge.refunded`
- `charge.dispute.created`

Monthly memberships and payment lifecycle (pre-existing handlers — easy to forget, and the ones that
matter most in live):
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

The gate purchase itself only exercises the first group — two one-time buys touch none of the second.
But **step 7 tells you to carry this same list to live**, and there the second group is what keeps the
existing monthly members working: without `invoice.paid` a renewed membership never flips back to
`active`, without `invoice.payment_failed` a failed renewal never becomes `past_due`, and without
`payment_intent.payment_failed` a failed one-time payment sits at `pending` forever. Register all
twelve in both modes.

Then reveal the **Signing secret** (`whsec_…`) and:
```
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase functions deploy stripe-webhook --no-verify-jwt
```

> **The redeploy is mandatory.** Edge Functions read secrets at boot, so a running instance keeps the
> old (or empty) value. Skip it and every delivery fails signature verification with a 400, which
> looks exactly like a wrong secret. This is the single most common failure in this whole runbook.

Quick check: press **Send test webhook** in Stripe. You want a 200 (or a clean 400 from signature
verification if you sent an unsigned one) — **not** a 401. A 401 means `--no-verify-jwt` did not take.

---

## 4.5 Connect Google Meet — prerequisite for steps 5.5 and 5.6

Booking does not merely lose its meeting link without Google credentials — it is **refused
outright**. `create-consultation/index.ts:199` checks `isGoogleCalendarConfigured()` before anything
else and, when it fails, rolls the credit hold back and returns "Online scheduling is being
activated… live meeting scheduling is not yet connected." A patient who has paid and holds credits
cannot book at all.

Work through `دليل_ربط_جوجل_ميت.md` before continuing. It needs the doctor's Google account and
about half an hour, and sets four secrets: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
`GOOGLE_REFRESH_TOKEN`, `GOOGLE_CALENDAR_ID`.

Two things in that guide that silently break later if missed: an **External** consent screen left in
Testing mode issues refresh tokens that expire after **7 days**, and `GOOGLE_CALENDAR_ID` must be the
doctor's real email — the code uses it both as the target calendar and as the doctor's attendee
address, so `primary` half-works and then fails.

Steps 5.1–5.4 (the two purchases and the credit total) can run without this. Steps 5.5 and 5.6
cannot, and the gate is not met until booking and cancellation have both been exercised.

---

## 5. Buy two packages on ONE account

Two purchases, not one — that is what proves item 2.8 (credits summing across rows) and the
AccountPage total that Phase 2 marked PARTIAL.

> **Updated after Phase 2.5** — the counts changed from 1/2/3 to 2/3/4, so the numbers below are not
> the ones an earlier version of this runbook gave.

1. On the deployed site, buy **Diet Premium** (**4** credits). Card `4242 4242 4242 4242`, any future
   expiry, any CVC, any postcode. Use one real inbox you can open — the invite email goes there.
   **Use a plus-address** (`you+stripetest@…`), not your normal address. The invite creates a real
   auth user, and step 7 deletes that user to clean up. If you buy with the address your admin
   account uses, the cleanup deletes your admin account.
2. Complete the invite, set a password, sign in.
3. Buy **Treatment Basic** (**2** credits) **while signed in, with the same email**.
4. Open `/account`. It must show **6 credits**. If it shows **2** — only the most recent purchase —
   item 2.8's summing did not take.
5. Open `/account/consultations` and book one slot. Credits must drop to **5**.
6. Cancel that booking. Credits must go back to **6** — that is item 2.9.

Also worth one minute: open the app build and confirm a `diet_premium` account shows a real plan name
instead of "No active membership". That is a Phase 3 item (C1), so failing here is expected — just
note what you see.

---

## 6. Capture the evidence

```
supabase functions logs stripe-webhook
```

Then tell Claude "done, pull the rows" — it can query `payments`, `subscriptions` and
`consultation_credits` for the `cs_test_%` sessions and assemble the gate record.

**What good looks like:**
- `payments` — 2 rows, `status = 'succeeded'`, correct `package_id`, `consultation_count` **4 and 2**
- `subscriptions` — 2 rows, same `user_id`, `status = 'active'`, `consultation_credit_limit` **4 and 2**
- `consultation_credits` — 2 positive rows totalling **6**
- webhook logs — no `42P10`, no "Failed to upsert", no 401
- exactly **one** welcome email in your inbox per purchase, not three (item 2.7)

---

## 7. Afterwards

- **Delete the test rows — order matters, and not for the reason you would expect.**

  `consultation_credits.payment_id` references `payments(id)` **ON DELETE SET NULL**, and that table
  has no `stripe_*` column of its own. So deleting `payments` first does not fail — it silently
  **nulls the only link** those credit rows had, leaving them orphaned in the production ledger with
  nothing to identify them by. No foreign key ever "complains", so waiting for one is not a plan.

  The cascades do the work for you. `subscriptions.user_id` and `consultation_credits.user_id` are
  both **ON DELETE CASCADE** on `auth.users`, so removing the test account clears both tables:

  ```sql
  -- 1. Confirm what you are about to remove.
  select id, email from auth.users where email = '<the test address>';
  ```
  ```
  -- 2. Delete that user: Supabase Dashboard -> Authentication -> Users.
  --    Cascades away its subscriptions and consultation_credits rows.
  ```
  ```sql
  -- 3. Then the payments rows, whose user_id step 2 merely nulled.
  delete from public.payments where stripe_session_id like 'cs_test_%';

  -- 4. Verify nothing is left.
  select (select count(*) from public.payments
            where stripe_session_id like 'cs_test_%')                      as payments_left,
         (select count(*) from public.subscriptions
            where stripe_checkout_session_id like 'cs_test_%')             as subs_left;
  ```
- Put Netlify's `VITE_STRIPE_PUBLISHABLE_KEY` back to the **live** key and redeploy.
- Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` back to live values, register the live webhook
  endpoint with the same event list, and redeploy the webhook once more.
- Only then is the store actually open.

---

## If something fails

| Symptom | Cause |
|---|---|
| 401 on every delivery | `--no-verify-jwt` missing (item 2.4) |
| 400 "signature verification failed" | `STRIPE_WEBHOOK_SECRET` set but the webhook was not redeployed |
| Checkout returns 500 immediately | `SITE_URL` unset (item 1.5) |
| "This package isn't available yet" | A `STRIPE_PRODUCT_*` secret missing or holding a live id in test mode |
| `42P10` in the logs | `PHASE_J` was not applied, or only partly |
| Buyer charged, no rows at all | Look for `findOrInviteUser` returning null — check the email case (item 2.5) |
| Account shows 2 credits after two purchases | The 2.8 summing change did not reach the deployed bundle — 2 is the most recent purchase alone (Treatment Basic), not the sum |

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

Stripe → Products → Add product, six times. Name them so you can tell them apart, and copy each
**Product id** (`prod_…`, not the price id):

Prices below are the Phase 2.5 list (four of the six changed on 22 Aug):

| Package | Price |
|---|---|
| Diet Basic | $49 |
| Diet Plus | $89 |
| Diet Premium | $119 |
| Treatment Basic | $119 |
| Treatment Plus | $169 |
| Treatment Premium | $199 |

> The price you attach to the Stripe product is **cosmetic**. The checkout function builds its line
> item with `price_data` and a server-side `unit_amount`, so the card is charged whatever
> `amountCents` says in `create-consultation-checkout-session` — currently 4900 / 8900 / 11900 /
> 11900 / 16900 / 19900, matching the table. Setting a different figure in Stripe will not change
> what is charged; it will only make the dashboard disagree with reality.

Keep the six `prod_…` ids in a scratch note — step 2 needs them.

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

## 5. Buy two packages on ONE account

Two purchases, not one — that is what proves item 2.8 (credits summing across rows) and the
AccountPage total that Phase 2 marked PARTIAL.

1. On the deployed site, buy **Diet Premium** (3 credits). Card `4242 4242 4242 4242`, any future
   expiry, any CVC, any postcode. Use one real inbox you can open — the invite email goes there.
2. Complete the invite, set a password, sign in.
3. Buy **Treatment Basic** (1 credit) **while signed in, with the same email**.
4. Open `/account`. It must show **4 credits**, not 1. If it shows 1, item 2.8 did not take.
5. Open `/account/consultations` and book one slot. Credits must drop to 3.
6. Cancel that booking. Credits must go back to 4 — that is item 2.9.

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
- `payments` — 2 rows, `status = 'succeeded'`, correct `package_id` and `consultation_count`
- `subscriptions` — 2 rows, same `user_id`, `status = 'active'`, limits 3 and 1
- `consultation_credits` — 2 positive rows totalling 4
- webhook logs — no `42P10`, no "Failed to upsert", no 401
- exactly **one** welcome email in your inbox per purchase, not three (item 2.7)

---

## 7. Afterwards

- Delete the test rows:
  `delete from public.payments where stripe_session_id like 'cs_test_%';` and the subscriptions /
  credits rows that reference them. Do the credits and subscriptions first if FKs complain.
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
| Account shows 1 credit after two purchases | The 2.8 summing change did not reach the deployed bundle |

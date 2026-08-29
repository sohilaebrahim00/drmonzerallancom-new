# FIX PLAN — Dr. Monzer Allan
Companion to `CODE_REVIEW_2026-08-22.md`. Every item below was verified against source.
Execute **one phase per session**. Do not start a phase before the previous one's gate passes.

---

## GROUND RULES (apply to every phase)

1. **Never fake, stub, or silently skip a fix.** If something cannot be done, stop and say exactly
   why, in the report — do not substitute a placeholder and describe it as done.
2. **Do not refactor anything outside the listed items.** No renames, no restyling, no dependency
   changes, no "while I was here" improvements.
3. **SQL discipline — determine applied state FIRST.** The Supabase CLI is linked
   (`supabase/.temp/linked-project.json`). Before touching any `.sql`, run
   `supabase db dump --schema public -f /tmp/live.sql` (or `supabase inspect db table-sizes`) and
   determine which tables/policies already exist on the live project. Then:
   - A migration file whose objects **do not exist live** → edit that file **in place**.
   - A migration file whose objects **already exist live** → leave it, and put the corrective
     statements in a new file `supabase/PHASE_J_FIXES_MIGRATION.sql`.
   - Everything you write in `PHASE_J_FIXES_MIGRATION.sql` must be **idempotent and re-runnable**
     (`if not exists`, `create or replace`, `drop policy if exists` before `create policy`,
     `do $$ begin ... exception when duplicate_object then null; end $$;` around `create type`).
   - State clearly in your report which branch you took and why.
4. **After every phase run all four and paste the real output:**
   ```
   npx tsc --noEmit
   npm run lint
   npm run build:web
   npm run build:app
   ```
   Zero TS errors and zero lint errors is the gate. Warnings that already existed are acceptable;
   new ones are not.
5. **Never print or commit a secret.** Before committing, grep the staged diff and `dist/`,
   `dist-app/` for `sk_live`, `sk_test`, `GOCSPX-`, `SERVICE_ROLE`, `GEMINI_API_KEY`.
6. **One commit per phase**, message `fix(phase-N): <short summary>`. Do not push unless asked.
7. **Report format at the end of each phase:** a table of every item — `DONE` / `NOT DONE (reason)`
   / `NEEDS DECISION` — plus the four command outputs. No claim of success without the output.

---

# PHASE 1 — Security (do this first, nothing else)

### 1.1 `doctor_patient_activity_summary` bypasses RLS
`supabase/PHASE_H_DAILY_NUTRITION_COMPANION_MIGRATION.sql:349-367`

The view has no `security_invoker`, so it reads with the **owner's** rights and the RLS on
`meal_logs` / `weight_logs` / `messages` / `doctor_patient_relationships` never applies. It is
granted to `authenticated`, so any signed-in user can read the whole doctor↔patient roster.

- Recreate it as `create or replace view public.doctor_patient_activity_summary with (security_invoker = true) as ...`
  (keep the query body identical).
- Delete the comment block at lines 361-366 that claims views inherit RLS — it is wrong. Replace it
  with an accurate one-line comment.
- `src/services/doctorService.ts:152-154`: add an explicit `.eq("doctor_id", <current user id>)`.
  Defence in depth — do it even though the view will now be invoker-rights.
- **Verify:** state in your report how you confirmed `security_invoker` is set on the live object.

### 1.2 A blocked user can remove the block placed on them
`supabase/PHASE_G_SOCIAL_NUTRITION_MIGRATION.sql:420-441`

`block_user()` runs `delete from public.friendships where pair_key = v_pair;` with no condition, so
B can wipe A's block and replace it with their own, then `unblock_user()` it away.

Fix inside `block_user`, before the delete:
```sql
select * into v_row from public.friendships
  where pair_key = v_pair and status = 'blocked' and blocked_by <> auth.uid();
if found then
  -- The other party already blocked this pair. Return their row unchanged:
  -- a no-op that looks identical to success, so the caller learns nothing.
  return v_row;
end if;
```
Do **not** raise a distinct error — that would tell B they are blocked. The silent no-op is the point.

### 1.3 `contact-submit` is an open email relay
`supabase/functions/contact-submit/index.ts:86-88` keys the rate limit on `email`, taken from the
request body, and then sends a confirmation email to that address from the verified domain.

- Key the limit on the **caller's IP**, not the body. Use the platform-provided remote address if
  the handler exposes it; otherwise take the **last** comma-separated entry of `x-forwarded-for`
  (proxies append, so the last hop is the only part a client cannot forge) — never the whole header.
- Keep the email key as a *second* limit, in addition to the IP one, not instead of it.
- Add a global per-isolate ceiling (e.g. 60 submissions/minute across all keys) that returns 429.
- `src/services/contactService.ts:71-79` does not forward the `companyWebsite` honeypot rendered at
  `src/components/sections/Contact.tsx:449`, so the server honeypot at `contact-submit:64` is dead
  code. Forward the field.

### 1.4 `ai-chat` / `food-search` rate limit is forgeable
`supabase/functions/ai-chat/index.ts:332`, `supabase/functions/food-search/index.ts:30` — both key
on the raw `x-forwarded-for` header, so a random value per request means no limit at all. Every
bypassed request is a paid Gemini call.

- Same IP-derivation fix as 1.3. Keep `userId` first when present.
- `supabase/functions/_shared/rateLimit.ts:6` — `requestLog` is never pruned. Add eviction: drop
  keys whose newest timestamp is older than the window, on every Nth call or when the map exceeds a
  cap (e.g. 10 000 keys).

### 1.5 Client-supplied `siteUrl` becomes Stripe's redirect URL
`create-checkout-session/index.ts:83,127-128` and
`create-consultation-checkout-session/index.ts:138,196-197`.

Both endpoints are unauthenticated with wildcard CORS, so anyone can mint a real Checkout session on
the live account whose `success_url` points at their own site.

- Read `SITE_URL` from `Deno.env` (the secret already exists — `contact-submit/index.ts:27` uses it)
  and **ignore the client value entirely**. Remove `siteUrl` from both request bodies and from the
  two callers in `src/services/checkoutService.ts`.
- If `SITE_URL` is unset, fail the request with a clear server-side error rather than falling back
  to anything client-derived.

### 1.6 Wildcard CORS on every function
`supabase/functions/_shared/cors.ts:2`

Replace the constant with `corsHeaders(req: Request)` that echoes the origin only when it is in an
allowlist: `https://monzerallan.com`, `https://www.monzerallan.com`,
`https://app.monzerallan.com`, `https://demo.monzerallan.com`, `capacitor://localhost`,
`http://localhost:5173`, `http://localhost:4173`. Add `Vary: Origin`. Update **every** function that
imports `CORS_HEADERS` — there are 11; do not miss the `OPTIONS` branches.

### 1.7 `profiles` is fully readable, including `is_admin`
`supabase/PHASE_G_SOCIAL_NUTRITION_MIGRATION.sql:253-256`

Add column-level grants so the admin flag and anything non-public stop leaving the database:
```sql
revoke select on public.profiles from authenticated;
grant select (id, username, full_name, avatar_url, bio, role, timezone, deleted_at,
              onboarding_current_step, onboarding_completed_at)
  on public.profiles to authenticated;
```
Adjust the column list to exactly what the frontend reads — audit `src/services/profileService.ts`
and every `.from("profiles").select(...)` in `src/` first, list them in your report, and make sure
each selected column is granted. Anything the frontend does not need must not be in the list.

### 1.8 HTML injection into the admin email + prompt injection into the AI
- `supabase/functions/_shared/email.ts:99,151` — `input.email` is interpolated into a `mailto:` href
  without `escapeHtml` while every neighbouring field is escaped. Escape it. Also tighten the
  validation at `contact-submit/index.ts:79` beyond `includes("@")` to a real email regex.
- `supabase/functions/ai-chat/index.ts:364,403` — `currentPath` is appended to the **system
  instruction** as its last line, after the "treat as data" fences. Move it into the user turn
  inside an explicitly-fenced data block, and sanitise it to a path shape
  (`/^\/[A-Za-z0-9\-_/]{0,120}$/`) — reject anything else rather than truncating.

**GATE:** four commands green. Then commit `fix(phase-1): close RLS, CORS, rate-limit and injection holes`.

---

# PHASE 2 — Payments (nothing here is optional before going live)

> **UPDATED after Phase 1.** Phase 1 established by direct query that `PHASE_G`, `PHASE_H` **and
> `PHASE_I` are all already applied** to the live project. Ground rule 3 therefore resolves to
> branch (b) for **every SQL item in this phase**: corrective statements go into
> `supabase/PHASE_J_FIXES_MIGRATION.sql` (idempotent), and the applied files keep their DDL. Where a
> fix is also needed so a *fresh* setup is correct from the start, update the source file too and say
> so — do not silently edit an applied file.
>
> **Carried over from Phase 1:** `supabase/functions/food-scan/index.ts:182` has the identical
> forgeable rate-limit key that item 1.4 fixed in `ai-chat` and `food-search`, and it is the most
> expensive Gemini path of the three (image input). Apply the same `clientIp()` fix.
>
> **Extra gate for this phase:** `tsc` and `eslint` only cover `src/`, so none of the Deno function
> changes are checked by the standard four commands. Add `deno check` over
> `supabase/functions/**/*.ts` and paste its output too.

### 2.1 `onConflict` cannot match a partial index
`supabase/functions/stripe-webhook/index.ts:294` + `supabase/PHASE_I_CONSULTATION_PACKAGES_PAYMENTS_MIGRATION.sql:64-66`

PostgREST emits `ON CONFLICT (col)` with no predicate; Postgres cannot match that to a partial
index, so every one-time purchase upsert fails with `42P10`, the handler `return`s at line 296, and
the webhook still answers 200 — the buyer is charged and receives nothing.

The index is already live, so this is a PHASE_J replacement, not an edit to `PHASE_I`:
```sql
drop index if exists public.subscriptions_stripe_checkout_session_id_idx;
create unique index if not exists subscriptions_stripe_checkout_session_id_idx
  on public.subscriptions (stripe_checkout_session_id);
```
A plain unique index is correct: Postgres treats NULLs as distinct by default, so membership rows
(which leave the column null) do not collide. Confirm afterwards that `pg_index.indpred` is null for
that index.

### 2.2 No unique index on `stripe_subscription_id` at all
`supabase/functions/stripe-webhook/index.ts:198` + `supabase/schema.sql:65`

Same `42P10`, on the recurring path — including every monthly renewal of the existing members.
Add `create unique index if not exists subscriptions_stripe_subscription_id_idx on public.subscriptions (stripe_subscription_id);`

### 2.3 Wrong env var name in exactly the two functions that handle money
`stripe-webhook/index.ts:43` and `create-consultation-checkout-session/index.ts:39` read
`SERVICE_ROLE_KEY`. The platform injects `SUPABASE_SERVICE_ROLE_KEY`, which the other nine functions
and `supabase/functions/.env.example:29` both use. These two therefore build a Supabase client with
an empty key and every write returns 401.

Rename in both files, and fix the comment headers at `stripe-webhook:14` and
`create-consultation-checkout-session:15`.

### 2.4 The webhook will be rejected with 401 before it runs
There is no `supabase/config.toml`, and `STRIPE_SETUP.md:281` documents the deploy without
`--no-verify-jwt`. Supabase requires a JWT by default; Stripe does not send one.

Create `supabase/config.toml`:
```toml
[functions.stripe-webhook]
verify_jwt = false
```
Update the deploy instructions in `STRIPE_SETUP.md` §8 to match.

### 2.5 Email lookup is case-sensitive
`supabase/schema.sql:385` — `where email = p_email`. GoTrue stores emails lower-cased, so a buyer
who types `Jane@Example.com` is never found; the invite then fails as "already registered"; the
retry uses the same mixed-case string and fails identically; `findOrInviteUser` returns null and the
handler returns. Payment taken, nothing recorded.

- `where lower(email) = lower(p_email)`, as a `create or replace function` inside PHASE_J
  (`schema.sql` is applied — also update `schema.sql` so a fresh setup is correct).
- Also normalise with `.trim().toLowerCase()` at every point the email enters:
  `stripe-webhook/index.ts` (`findOrInviteUser` and the caller), both checkout functions.

### 2.6 Credits granted before the money arrives, and never revoked
`supabase/functions/stripe-webhook/index.ts:407`

- Gate the one-time grant on `session.payment_status === "paid"`.
- Add handlers: `checkout.session.async_payment_succeeded` (grant then),
  `checkout.session.async_payment_failed` (mark `payments.status = 'failed'`),
  `charge.refunded` and `charge.dispute.created` (set `payments.status = 'refunded'`, set the
  matching `subscriptions` row to `cancelled`, and write a **negative** `consultation_credits`
  ledger row so the audit trail stays additive and balances).
- Keep every handler idempotent — Stripe delivers at least once.

### 2.7 Welcome emails fire on every renewal
`supabase/functions/stripe-webhook/index.ts:212-216` counts rows **after** the upsert, so the count
is 1 by construction and `isFirstActivation` is always true. Capture the count **before** the upsert
and compare against that.

### 2.8 A second purchase strands the first purchase's credits
`supabase/schema.sql:166-172` — `book_consultation_slot` locks a single row
(`order by current_period_start desc limit 1`), but each one-time purchase inserts a **new** row.

- All three objects below live in the applied `schema.sql`, so every change goes into PHASE_J as
  `create or replace` (and into `schema.sql` too, for fresh setups).
- Change the RPC to select, `for update`, the **oldest** `status = 'active'` row that still has
  `consultation_credits_used < consultation_credit_limit`, and spend from that one. Keep the whole
  thing inside the existing transaction and keep the existing failure modes.
- `src/services/membershipService.ts:74-77` and the `my_active_subscription` view
  (`supabase/schema.sql:91-92`) both `limit 1` too — change them to **sum** the credits across all
  active rows so the UI shows the true balance.
- `src/pages/AccountPage.tsx:218` tells users to "purchase another program to get more credits" —
  once summing works this becomes true; verify it displays the combined total.

### 2.9 Cancellation does not return the credit
`supabase/schema.sql:300` — `cancel_my_consultation` cancels without decrementing
`consultation_credits_used` or setting `credit_status = 'released'`, contradicting the enum comment
at `schema.sql:100`. Fix both, inside the same transaction.

### 2.10 Wording and re-runnability
- `supabase/functions/_shared/email.ts` — the welcome email says "N consultation credits **per
  month**", which is false for one-time program packages. Branch the wording on package type.
- `supabase/PHASE_I_...sql:80,124` — unguarded `create type` and `create policy` abort the file on a
  second run. Wrap them per ground rule 3. Reproducibility only — those objects already exist live,
  so it changes nothing on the current database.

**GATE:** four commands green, plus `deno check` over `supabase/functions/**/*.ts`, plus a **full
Stripe test-mode purchase** end to end, with the resulting `payments`, `subscriptions` and
`consultation_credits` rows pasted into the report. Do not mark Phase 2 done without that.

### How to run the gate purchase — deployed, not local
The original wording assumed `stripe listen` + `supabase functions serve`, which needs the Stripe CLI
and Docker. **Skip local emulation entirely** — the functions have to be deployed anyway, and testing
the deployed stack is closer to production:

1. Switch Stripe to **Test mode** and create the 6 program products there (live-mode product ids do
   not exist in test mode).
2. Set `STRIPE_SECRET_KEY` (`sk_test_…`) as a Supabase secret.
3. Deploy the updated frontend → apply `PHASE_J` → `supabase functions deploy` (webhook with
   `--no-verify-jwt` or via `config.toml`). This is the 2.11 order.
4. Register the webhook endpoint in Stripe test mode, take `STRIPE_WEBHOOK_SECRET`, set it as a
   secret, redeploy the webhook.
5. Buy **two** packages on one account with card `4242 4242 4242 4242` — two purchases are what
   proves item 2.8 (credit summing) and the AccountPage total in 2.8's PARTIAL row.
6. Capture `supabase functions logs stripe-webhook` plus the three tables.

**Known trade-off:** test rows land in the production database. They are identifiable by
`stripe_checkout_session_id` beginning `cs_test_` and can be deleted afterwards. The alternative — a
second Supabase project for staging — is a day of work on its own and is not required for this gate.

Commit `fix(phase-2): correct Stripe webhook, credit ledger and checkout wiring`.

### Housekeeping (separate commit, approved out-of-band)
- `supabase/functions/admin-availability/index.ts:82,119,145` — three pre-existing `body as {...}`
  casts fail `deno check` (TS2352). Fix with `as unknown as {...}`. Not a behaviour change; without it
  the new Deno gate is unusable for later phases.
- Add `.gitattributes` containing `* text=auto eol=lf`. The repo has `core.autocrlf=true` and no
  attributes file, so any `git stash` round-trip rewrites working-tree files to CRLF and produces
  hundreds of phantom lint errors.
- **Pin the floating remote imports** (do this *after* the Phase 2 gate purchase, not before —
  changing them now would invalidate the deploy you are about to test). Two of the three remote
  specifiers across `supabase/functions/` float:
  `https://esm.sh/@supabase/supabase-js@2` and `https://esm.sh/stripe@16?target=deno`. They resolve
  to whatever the newest 2.x / 16.x is *at fetch time*, so a local `deno check` and a Supabase deploy
  a week apart can compile different code — in the Stripe SDK, which is the money path. Committing
  `deno.lock` is the weaker half of the fix, since it is unclear whether the Supabase deploy bundler
  honours it. Pin the URLs themselves to the versions that resolve today (`deno info` on each entry
  point prints them), then commit `deno.lock` as well. `deno.land/std@0.224.0` is already pinned.

---

### 2.11 Apply PHASE_J in the right order
J.3 revokes table-wide `select` on `profiles` and re-grants named columns. The **deployed** frontend
still selects `is_admin`, so applying J.3 before the new bundle ships breaks the live app.

Order: deploy the updated frontend → apply `PHASE_J` → deploy the Edge Functions. State in your
report that you followed this order, or that the owner is doing it manually.

### 2.12 Verify the `profiles` UPDATE-privilege claim before acting on it
Phase 1 reported that `authenticated` holds no `UPDATE` on `public.profiles`, which would mean
`profileService.ts:72,97,106` (save profile, advance onboarding step, finish onboarding) all fail
today. `information_schema.role_table_grants` can under-report, so confirm from the catalog directly:
```sql
select (aclexplode(relacl)).grantee::regrole::text as grantee,
       (aclexplode(relacl)).privilege_type
from pg_class where oid = 'public.profiles'::regclass;
```
If `authenticated` really is absent, grant `update (full_name, username, bio, avatar_url, timezone,
onboarding_current_step, onboarding_completed_at)` in PHASE_J — never a table-wide update grant, or
self-promotion to admin (review item A-note on `schema.sql:34-36`) becomes possible again.

# PHASE 2.5 — Client requests: pricing and catalogue
**Source:** the doctor's WhatsApp messages, 22 Aug. **Run this BEFORE the Phase 2 gate purchase** —
item 2.5.1 changes what the checkout charges, so creating the Stripe products first would mean
redoing them.

### 2.5.1 New price list
Four of the six prices changed. The price lives in **four** places and all four must agree, or Stripe
shows one number and charges another:

| Slug | Old | **New** | `amountCents` |
|---|---|---|---|
| `diet_basic` | $49 | **$49** | 4900 (unchanged) |
| `diet_plus` | $69 | **$89** | 8900 |
| `diet_premium` | $89 | **$119** | 11900 |
| `treatment_basic` | $119 | **$119** | 11900 (unchanged) |
| `treatment_plus` | $139 | **$169** | 16900 |
| `treatment_premium` | $159 | **$199** | 19900 |

Update all four:
1. `src/data/programPackages.ts` — `price` and `priceLabel` on each of the six
2. `supabase/functions/create-consultation-checkout-session/index.ts` — `amountCents` in `PACKAGES`
   (**this is the one that actually charges the card**)
3. `supabase/functions/stripe-webhook/index.ts` — `priceLabel` in `PACKAGE_INFO` (goes into the
   welcome email)
4. The Stripe products themselves — that is step 1 of `PHASE_2_GATE_RUNBOOK.md`, already updated

Then grep the repo for the old figures (`69`, `89`, `139`, `159`, `$69`, `6900`, `13900`, `15900`) and
report every remaining hit with a verdict — some will be unrelated numbers, but any that is a package
price must be fixed. Check `src/data/faqs.ts` and `src/ai/knowledge/generated-knowledge.json`
specifically. Consultation counts (1/2/3) do **not** change.

### 2.5.2 Remove the child-nutrition service
The doctor does not treat children. Remove, do not merely hide:
- `src/data/services.ts:111-117` — the `child-nutrition` service entry
- `src/data/faqs.ts:108-111` — "Do you provide guidance for children or seniors?" currently answers
  **yes** to both. Rewrite it to cover seniors only; do not leave a dangling "no children" note that
  reads defensively.
- `src/data/articles.ts` — the picky-eater / child-feeding article (around :160-190). Owner's
  decision: **remove it entirely**, along with any cross-links to its slug. Grep the slug afterwards.
- Anything in the AI knowledge base that offers child nutrition.

Leave alone: the `children` mentions in `PrivacyPolicyPage.tsx`, `ProductDetailPage.tsx` and
`ProductsIndexPage.tsx` — those are a privacy notice and product-safety warnings, unrelated to
services.

### 2.5.3 Add oncology nutrition support
**Scope confirmed with the owner: nutritional support for cancer patients — during and after
treatment. Not cancer treatment.** The copy must never imply otherwise, and this constrains how it is
written:

- `src/data/services.ts` — new service. Suggested `slug: "oncology-nutrition"`,
  `title: "Nutrition Support for Cancer Patients"`. Body should cover what a nutritionist actually
  does here: weight and muscle maintenance during treatment, appetite loss, nausea and taste changes,
  and eating through side effects. Frame it throughout as **working alongside** the patient's
  oncology team.
- Never write, or let the AI generate, anything that positions nutrition as treating, curing,
  shrinking or slowing cancer. No survival or outcome claims.
- Add a line to the service and to `MedicalDisclaimerPage.tsx` stating this is supportive care that
  complements — and never replaces — the treatment plan from the patient's oncologist.
- **AI concierge — this is the part that matters most.** `supabase/functions/ai-chat/index.ts`
  already has a `medical-escalation` intent. Extend its rules so that any cancer-related question
  beyond the plainly general is escalated to a human rather than answered: treatment choices,
  prognosis, drug or supplement interactions, whether to eat something during chemotherapy. Adding
  the service will bring these questions in; the escalation path has to exist before it does.
- Add an FAQ entry, and one blog article only if the owner supplies or approves the content — do not
  invent clinical guidance.

### 2.5.5 Consultation counts: 1/2/3 → 2/3/4 (both programs)
**Owner decision, 22 Aug.** Every tier gains one consultation. This applies to **Diet and Treatment
alike**; prices from 2.5.1 do not change again.

| Slug | Old count | **New count** |
|---|---|---|
| `diet_basic` | 1 | **2** |
| `diet_plus` | 2 | **3** |
| `diet_premium` | 3 | **4** |
| `treatment_basic` | 1 | **2** |
| `treatment_plus` | 2 | **3** |
| `treatment_premium` | 3 | **4** |

The count is the number of credits granted on purchase, so it has to change in every place the price
did **plus the database**:

1. `src/data/programPackages.ts` — `consultationCount`, and widen the type `1 | 2 | 3` → `2 | 3 | 4`.
   Also the `features` strings on all six ("1 doctor consultation" → "2 doctor consultations", and so
   on — mind the singular/plural), and `programPackageDisclaimer`, which currently ends "Treatment
   programs include a maximum of 3 consultations."
2. `supabase/functions/create-consultation-checkout-session/index.ts` — `consultationCount` in
   `PACKAGES` and its `1 | 2 | 3` type.
3. `supabase/functions/stripe-webhook/index.ts` — **both** `creditLimit` and `consultationCount` in
   `PACKAGE_INFO`. These two must stay equal; `creditLimit` is what actually lands on the
   `subscriptions` row.
4. **Database — PHASE_J.** `supabase/PHASE_I_...sql:100` declares
   `consultation_count integer not null check (consultation_count between 1 and 3)`. A 4-consultation
   purchase violates it, the `payments` insert fails, and `create-consultation-checkout-session`
   returns "Could not start checkout" before Stripe is ever reached. Widen it:
   ```sql
   alter table public.payments drop constraint if exists payments_consultation_count_check;
   alter table public.payments add constraint payments_consultation_count_check
     check (consultation_count between 1 and 4);
   ```
   Confirm the real constraint name from the catalog first — Postgres auto-names it and the guess
   above may not match. Keep the lower bound at 1 so existing rows stay valid.
5. Grep for stray counts in `src/data/faqs.ts`, `src/data/packages.ts` and anywhere copy says "one
   consultation" / "three consultations", and report each hit with a verdict.

Then re-run 2.5.4 — the knowledge base embeds these numbers.

### 2.5.4 Rebuild the AI knowledge base
`src/ai/knowledge/generated-knowledge.json` is generated from the data files by
`npm run build:knowledge`. Run it after 2.5.1–2.5.3, and confirm in the diff that the old prices and
every child-nutrition reference are gone and the new service is present. Committing stale knowledge
means the assistant quotes retired prices and offers a service the doctor does not provide.

**GATE:** the four commands, plus `deno check`, plus paste the grep output from 2.5.1 with a verdict
per hit. Commit `feat(phase-2.5): new price list, remove child nutrition, add oncology support`.

---

# PHASE 3 — App correctness

### 3.1 Unify the package catalog (do this one first — several others depend on it)
The app resolves plans against `src/data/packages.ts` (three legacy membership slugs) while the
website resolves against `src/data/programPackages.ts` (six new slugs). Each half is blind to the
other's customers.

- Create `src/data/planCatalog.ts` as the single source of truth for all **nine** slugs
  (`basic`, `premium`, `vip-elite`, `diet_basic`, `diet_plus`, `diet_premium`, `treatment_basic`,
  `treatment_plus`, `treatment_premium`), exposing at minimum `getPlanBySlug(slug)` returning
  `{ slug, name, kind: "membership" | "program", consultationCount, hotline }`.
- Keep the two existing data files as the source of their own rows — `planCatalog` composes them, it
  does not duplicate them.
- Widen `src/services/membershipService.ts:13` `package_id` to the full union.
- Replace every lookup: `NativeConsultations.tsx:103`, `NativeAccount.tsx:113`,
  `NativeBookConsultation.tsx:94`, `AccountPage.tsx:82`, `AccountConsultationsPage.tsx:92`.
- Grep for `packages.find(` and `getProgramPackageBySlug(` afterwards — there must be zero direct
  callers left outside `planCatalog.ts`.

### 3.2 Restore the bottom navigation on the tab screens
`NativeMyProgram.tsx` (112, 120, 128, 143) and `NativeFoodScanner.tsx` (110, 122, 139) pass `back`
without `tabBar` although both are bottom-nav tabs, so the tab bar disappears. Conversely
`NativeProgress`, `NativeProducts`, `NativeHealth` and `NativeConsultations` pass `tabBar` although
they are not tabs, so they lose the back button.

Rule to apply: a screen listed in `src/app-native/navTabs.ts` gets `tabBar` and no `back`; every
other screen gets `back` and no `tabBar`. Apply it to all `<AppScreen>` call sites, including the
loading and empty-state branches.

### 3.3 Doctor connection is reachable only during onboarding
`requestDoctorConnection` has exactly one call site: `onboarding/ConnectDoctorStep.tsx:19`. Three
screens tell the user to do it later — `NativeHome.tsx:264`, `NativeMyProgram.tsx:132`,
`NativeAccount.tsx:183` (which opens `/account/help`) — and `NativePrivacyCenter.tsx:62` points at a
control that does not exist.

Add a real doctor-connection screen or sheet reachable from Account, wire all four references to it,
and support both requesting and ending the connection.

### 3.4 Three screens are unreachable
Nothing navigates to `/health` (`AppExperience.tsx:141`), and `NativeHealth` is the only entry to
`/videos`, `/products` and the `/blog` index. Add navigation — Account rows or Program-tab links —
and verify each of the four screens is reachable in at most two taps from a tab.

### 3.5 Doctors are pushed through the patient onboarding
`AppExperience.tsx:125` gates on `onboardingComplete` only, ignoring `role`; and
`doctorService.ts:411` `getPracticeDoctor()` returns the first doctor/admin profile — the doctor
himself — so the Connect step fires a request from his account to his own account.

Skip the patient wizard for `role in ('doctor','admin')` and send them to the dashboard. Also make
`request_doctor_connection` reject `doctor_id = patient_id` at the SQL level.

### 3.6 "My own data" queries have no `user_id` filter
`bodyProfileService.ts:37,95` · `weightService.ts:17` · `hydrationService.ts:34` ·
`checkinService.ts:32` · `activityService.ts:69,151` · `progressPhotoService.ts:32` ·
`NativeProgress.tsx:96` — all rely on RLS that is deliberately wider than "own rows" (doctors see
patients; friends see shared steps).

Add an explicit `.eq("user_id", <current user id>)` to every one. For a doctor with a patient, the
current code shows the patient's height, weight and **medications** as the doctor's own, and with
two patients `.maybeSingle()` throws PGRST116 and the screen stays blank forever.

### 3.7 Chat messages never appear
No migration adds `public.messages` to the realtime publication, and
`NativeMessageThread.tsx:34-38` appends **only** from the realtime event.

- Add `alter publication supabase_realtime add table public.messages;` (idempotent — check
  `pg_publication_tables` first).
- Add an optimistic append in `onSubmit` keyed on the returned row id, de-duplicated against the
  realtime event, so the thread works even if realtime drops.

### 3.8 Remaining app defects
- `NativeActivityTask.tsx:231-236` — "Change" swaps the activity in local state only, while
  `activityService.ts:134-161` re-reads `activity_id` from the row. Persist the change before
  completion, or remove the control.
- `NativeFoodResult.tsx:320,375` — every save control is gated on `user` with no signed-out branch,
  so a guest scans a meal and silently loses the result. Add a sign-in prompt that preserves the
  scan.
- `NativeSocial.tsx:87-97` and `NativeFoodSearch.tsx:40-56` — `setSearching(true)` runs before the
  debounce and the short-query early return never resets it, so the spinner never stops. Reset it in
  the early return.
- `NativeBackHandler.tsx:7` — `ROOT_TAB_PATHS` still lists the pre-Phase-G tabs. Derive it from
  `navTabs.ts` instead of hardcoding.
- `AppBootContext.tsx:101-109` — `setProfile(prev => prev ? … : prev)` cannot update when the
  profile fetch returned null, producing an onboarding redirect loop. Track the onboarding flags in
  state independent of the profile object.

### 3.9 DECISION NEEDED — in-app purchasing
There is no purchase path in the installed app at all: `ProgramPackages` is never imported under
`src/app-native/`, every "Upgrade" CTA points at `/join`, and `NativeFreeSignUp.tsx:88` bounces
signed-in users to Home with no message. `DeepLinkHandler.tsx:68` also rewrites `/packages` to
`/consultations`.

Do **not** guess. Apple requires in-app purchase for digital content, with a possible exemption for
real-world services — that is a business call, not a code one. Implement the part that is
unambiguous: stop the silent bounce and show a real message with a working destination. Then stop
and put the options in your report for the owner to choose.

**GATE:** four commands green, plus a manual pass through the app in the browser
(`npm run dev:app`): sign in, walk every bottom-nav tab, confirm the tab bar persists, open a chat
thread and send a message, and confirm a `diet_*` subscription renders a plan name. Commit
`fix(phase-3): unify plan catalog and repair app navigation and data scoping`.

---

# PHASE 4 — Infrastructure, SEO, hygiene

- **`scripts/write-app-htaccess.cjs:44-56` vs `:74-76`** — the trailing
  `<FilesMatch "\.(css|js|…)$">` sets `max-age=31536000, immutable`, overriding the deliberate
  `no-cache` on `sw.js` (later `Header set` wins). Exclude `sw.js` and `manifest.webmanifest` from
  the final block, or move the no-cache block after it. Same for the `mod_expires` rule at line 65.
- **`schema.sql:346-348` and `:370-372`** — `membership_leads` and `contact_inquiries` allow
  unauthenticated `insert` with `with check (true)`. The frontend uses Edge Functions, so this path
  exists only for abuse. Drop both policies.
- **`src/services/privacyService.ts:14`** — `DEMO_PRIVACY_SETTINGS` lives outside `src/dev/`, so the
  prod-stub alias list at `vite.config.ts:108-131` never replaces it, and `DemoModeBanner.tsx` is
  imported unconditionally at `AppExperience.tsx:14`. Move the fixture under `src/dev/` and lazy-load
  the banner so the documented "grep dist for fixture strings" check is actually true.
- **`src/components/landing/Hero.tsx:68`** — the primary CTA targets `/booking`, which survives only
  as a legacy redirect. Point it at `/packages` like every other CTA.
- **`src/components/common/Footer.tsx:82`** — six differently-labelled "Popular Services" links all
  resolve to `/#services`. Give each a real destination or collapse them to one link.
- **`supabase/functions/ai-chat/index.ts:252,256`** — program length is hardcoded to 30 days and
  `programDay` is clamped to 30, though `nutrition_programs` carries a real `end_date`
  (`PHASE_G_...sql:1173`). Use the real dates, and skip programs whose `end_date` has passed.
- **`src/app-native/screens/NativeBilling.tsx`** — an honest placeholder wired into navigation.
  Either implement the Stripe billing portal (`billingPortal.sessions.create`) or remove the row.
  Say which you chose.

### SEO — scope this separately
`index.html:17` hardcodes the homepage canonical, title, description and `og:image`, and every
per-page value is written by a `useEffect` (`Seo.tsx:55`). No crawler or link unfurler runs JS, so
every shared URL previews as the homepage and every page self-declares canonical to `/`.

This needs a prerender or SSG step in `netlify.toml` and is a change of build architecture — do not
attempt it inside Phase 4. Write a short options memo (prerender plugin vs. migrating to a framework
with SSG) and stop.

### Bundle size
`index-*.js` ≈ 550 kB, `NativeProgress-*.js` ≈ 377 kB. Route-level code-splitting is the fix; it is
a performance improvement, not a defect. Last priority.

**GATE:** four commands green. Commit `fix(phase-4): caching, RLS cleanup, links and AI program dates`.


---

# PHASE 5 — Arabic (client request)
**Scope confirmed with the owner: Arabic, across both the marketing website and the app.**

**Sequencing: this comes after Phase 3, not before.** Phase 3 rewrites navigation, screen structure
and several whole screens. Translating strings first and then rewriting the screens that hold them is
work done twice.

Be honest about size when planning this: it is larger than Phases 3 and 4 combined. It is not a
find-and-replace.

### 5.1 Decide the architecture first — stop and report before writing code
- Library: `react-i18next` is the usual answer for this stack; confirm before committing to it.
- Where translations live: JSON resource files per language, versus translated fields inside the
  existing `src/data/*` files. The data files hold long-form prose (articles, service descriptions,
  FAQs), which argues for a different treatment from UI microcopy.
- URL strategy: `/ar/...` path prefix, subdomain, or a cookie with no URL change. This decision
  interacts directly with the SEO gap in Phase 4 — `hreflang` needs distinct URLs per language, so a
  cookie-only approach makes the site untranslatable to search engines.
- Language detection and persistence, and where the switcher lives in both the website header and the
  app.

### 5.2 The actual surface
- ~280 `.tsx` files with hardcoded English strings.
- Content data: `articles.ts`, `services.ts`, `faqs.ts`, `products.ts`, `packages.ts`,
  `programPackages.ts`, `about.ts`, `videos.ts`, `cities.ts`. This is prose translation, not UI
  strings — it needs a human translator, ideally the doctor, not machine output on medical copy.
- **RTL.** Tailwind logical properties (`ps-`/`pe-`/`ms-`/`me-` instead of `pl-`/`pr-`), `dir="rtl"`
  on the root, icon and chevron mirroring, chart and progress-ring direction, and the whole
  `app-native` layout. Expect this to be the single biggest slice of the work.
- Arabic typography: pick and load a real Arabic face; the current display font has no Arabic
  coverage.
- Numbers, dates and currency: `Intl` with the chosen locale, and a decision on Arabic-Indic versus
  Western digits.
- Emails from the Edge Functions (`_shared/email.ts`) — the recipient's language has to be known and
  stored.
- **AI concierge**: system prompt, the knowledge base, and answering in the user's language.
  `generated-knowledge.json` would need an Arabic build.
- User-generated and doctor-authored content in the database (program items, messages) is **not**
  translated — it stays in whatever language it was written.

### 5.3 Suggested split
Doing this in one pass will fail. Propose it to the owner as three deliverables:
1. Infrastructure + RTL + the marketing website
2. The app (`src/app-native`)
3. AI concierge and emails

**GATE per sub-phase:** the four commands, plus a manual pass of every translated screen in both
directions with the language switcher, checking specifically for layout breakage in RTL and for
untranslated strings left behind.


---

# PHASE 6 — Doctor dashboard on the marketing website
**Owner decision, 22 Aug: the dashboard lives on `monzerallan.com`, not in the app.**

> **Split into 6A and 6B (owner decision, 23 Aug — build now).**
>
> **6A — Availability. Safe to build immediately, before Phase 3.** It runs entirely through
> `adminAvailabilityService` → the `admin-availability` Edge Function under `service_role`. It touches
> **none** of the services carrying the C7 data-scoping bug (body profile, weight, hydration,
> check-in, activity, progress photos) and none of the plan-catalogue code from C1. Nothing in Phase 3
> changes what this screen reads or writes.
>
> **6B — Patient list, patient profile, program builder. After Phase 3.** These read patient data
> through exactly the services C7 fixes. Building them first reproduces the bug across four new
> screens and means fixing it twice.
>
> Commit 6A separately (`feat(phase-6a): doctor availability management`) so it can ship or be
> reverted on its own.


### What already exists — read this before planning anything
Almost every capability the owner described is **built**; it is split across two surfaces:

| Capability | Where it lives today |
|---|---|
| Weekly availability, exceptions, slot duration | Website — `src/pages/AdminAvailabilityPage.tsx` (`/admin/availability`, `AdminRoute`) |
| Appointments list | Website — same page |
| Client picks a free slot | Both — `AccountConsultationsPage.tsx` (web), `NativeBookConsultation.tsx` (app) |
| Slot computation | `supabase/functions/get-availability` + `_shared/availability.ts` |
| Booking spends a credit | `book_consultation_slot` RPC |
| Patient list / needs-review | **App only** — `NativeDoctorDashboard.tsx` |
| Patient profile | **App only** — `NativeDoctorPatientProfile.tsx` |
| Build and send a program | **App only** — `NativeDoctorProgramBuilder.tsx` |

**No backend work is required for the doctor dashboard.** `src/services/doctorService.ts`,
`adminAvailabilityService.ts` and `programService.ts` already cover everything; this phase is a new
presentation layer over existing services. Do not duplicate or fork those services.

**Cost, stated honestly:** the owner chose the more expensive of the two options. Putting it in the
app would have meant moving one screen; putting it on the website means building four. The choice is
defensible — a doctor works at a desk, and the app's screens are mobile-first — but plan it as real
work, not a port. The native screens use `AppScreen`, `NativeListRow` and bottom-nav idioms that do
not belong in the marketing shell; rebuild the UI with the site's own components and let it be a
proper wide desktop layout (tables, filters, split view) rather than a stretched phone layout.

### 6.1 Routing and access
- New routes under `/doctor`: `/doctor` (dashboard), `/doctor/patients/:patientId`,
  `/doctor/programs/:programId/build`, `/doctor/availability`.
- Gate them with `DoctorRoute` (`src/components/auth/DoctorRoute.tsx` — exists, allows doctor **and**
  admin), not `AdminRoute`.
- Keep `/admin/availability` working as a redirect to `/doctor/availability`; do not break a URL the
  doctor may have bookmarked.
- The doctor's dashboard must not render the marketing `Header`/`Footer`/`StickyCta`/`ChatWidget` —
  give it its own shell. Check `App.tsx` before assuming it can sit inside `WebApp`.
- Verify the guard for real: sign in as a normal user and hit `/doctor` directly. It must redirect,
  and `doctorService` calls must fail on the server side too, not only in the UI.

### 6.2 Screens
1. **Dashboard** — patient list with search and the existing filter chips (All / Needs Review /
   Active Program / No Program), each row showing program day, calories today vs target, last meal,
   status. Same data as `getPatientsNeedingReview` and the doctor patient list.
2. **Patient profile** — the patient's logs, weight trend, program, and the message thread.
3. **Program builder** — build and send the 30-day program. This is "العميل هيتبعتله البرنامج من
   الداشبورد" and it is the reason this phase exists; give it the most layout room.
4. **Availability** — this needs **more than re-siting**. An earlier version of this plan said it
   only needed moving; that was wrong, and the gap is in exactly the feature the owner asked for.

   What works today in `AdminAvailabilityPage`: for each existing weekly row, toggle the day on/off,
   edit start and end time, edit slot length. Plus one-off exceptions (date, type, reason) and an
   appointments list.

   What does **not** work:
   - **The doctor can only edit three days.** `CONSULTATION_BOOKING_MIGRATION.sql:133-139` seeds
     exactly three rows — Monday, Wednesday, Friday, 16:00–21:00 Asia/Dubai, 30-minute slots — and
     there is no way to create a fourth. `adminAvailabilityService.ts` exports only
     `updateDoctorAvailability`; `supabase/functions/admin-availability/index.ts` has
     `update-availability` but no create and no delete. The page renders `availability.map(...)`, so
     Tuesday, Thursday, Saturday and Sunday simply do not appear. If the doctor wants to work
     Tuesdays, he cannot say so.
   - **Timezone is not editable.** `src/config/consultations.ts:8` hardcodes
     `DOCTOR_TIMEZONE = "Asia/Dubai"`, the seed rows carry it, and `AccountConsultationsPage.tsx:332`
     prints the literal word "Dubai" beside every slot the patient sees. **Confirm with the owner
     that the practice really is on Dubai time** before building on the assumption.

   So this item is: add `create-availability` and `delete-availability` to the Edge Function, matching
   service functions, and an "Add a day" control plus per-row delete in the UI. Cover all seven days.
   Treat the timezone as a separate decision once the owner confirms it.

### 6.3 Sequencing
- **After Phase 3.** Phase 3 fixes the plan-catalogue split (C1) and the data-scoping bug (C7 —
  services that omit `user_id` and therefore show a patient's data as the doctor's own). Building new
  doctor screens on top of C7 would reproduce the same bug in a second place.
- **Before Phase 5 (Arabic).** Four new screens built after the i18n pass would need a translation
  pass of their own.

**GATE:** the four commands, plus a manual pass signed in as a doctor account — set availability,
open a patient, build and send a program, then sign in as that patient and confirm the program
arrived and a bookable slot appears. Also the negative test in 6.1.

---

# PHASE 13 — `/ar/*` URLs, so the Arabic site can be found

**Not built in Phase 8, deliberately. Phase 8 ships the language switch and the translations; the
Arabic content lives at the same URL as the English.**

## Why this is its own phase, and why it matters more than it sounds

Without distinct URLs there is exactly one URL per page, and Google indexes whichever language it
happens to be served. The `hreflang` tags Phase 8 emits are self-referential and tell a crawler
nothing, because there is no second URL to point at. **The Arabic site is effectively invisible to
search** — and Arabic speakers are this practice's actual audience, so the invisible half is the
half that matters.

A visitor cannot share a link to the Arabic version either: the recipient gets whatever their own
stored preference or browser language resolves to.

## What it costs

- **Routing.** Every route gains an `/ar` prefix. `src/App.tsx` currently declares ~30 routes;
  each needs a paired Arabic path, or a prefix-aware router wrapper.
- **Locale resolution changes source.** `src/i18n/detect.ts` resolves stored choice ->
  `navigator.language` -> default. The path must become the highest-priority source, above the
  stored choice — otherwise a visitor with English stored who opens an `/ar/` link sees English at
  an Arabic URL. The seam for this is already documented in `detect.ts`.
- **The switch becomes a navigation.** Today it flips state in place. With prefixed URLs it must
  rewrite the current path and push it, preserving deep links, query strings and hashes.
- **Every internal link.** `<Link to="/packages">` must resolve to `/ar/packages` in Arabic. That
  is a locale-aware `Link` wrapper, and every existing `to=` audited.
- **SEO becomes real.** Reciprocal `hreflang` (`ar`, `en`, `x-default`), per-locale canonical URLs,
  and both languages in the sitemap.
- **Netlify.** The SPA rewrite already sends everything to `index.html`, so no redirect changes are
  strictly required — but a root-level language redirect for first-time visitors would be.

## Sequencing

**After Phase 8.** The dictionaries, the provider and RTL must exist first; this phase only changes
where the Arabic lives, not what it says.

**GATE:** the four commands, plus `/ar/packages` and `/packages` both rendering in the right
language on a cold load with no stored preference, reciprocal `hreflang` present on both, and the
switch preserving the current route in both directions.

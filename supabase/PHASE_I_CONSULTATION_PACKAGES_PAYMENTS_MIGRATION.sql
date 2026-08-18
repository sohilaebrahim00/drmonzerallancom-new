-- PHASE I — One-time consultation packages: payments + consultation_credits
--
-- This file is NOT executed automatically and has NOT been applied to the
-- live database. Review it, then run it once in the Supabase SQL Editor (or
-- `supabase db push`) when ready — same manual-apply convention as
-- schema.sql / PHASE_G_.../PHASE_H_... before it.
--
-- What this adds, and why it's additive/low-risk:
--   1. `public.payments` — a ledger row per Stripe Checkout attempt for a
--      one-time consultation package (Single/Double Consultation, see
--      src/data/consultationPackages.ts). Nothing existing reads or writes
--      this table, so adding it cannot break anything already live.
--   2. `public.consultation_credits` — an append-only grant history: one row
--      per credit-granting event, linked back to the `payments` row that
--      caused it. This is an AUDIT LEDGER, not the spendable balance — the
--      actual balance the booking flow checks still lives on
--      `subscriptions.consultation_credit_limit` (see point 3), so this
--      table exists purely so you have a full, queryable grant history
--      (support, reporting, "why does this user have N credits").
--   3. Two new allowed `package_id` values on the EXISTING `subscriptions`
--      table ('single_consultation', 'double_consultation'), plus a new
--      nullable `stripe_checkout_session_id` column used as the idempotency
--      key for one-time purchases (memberships keep using
--      `stripe_subscription_id`, untouched). A one-time purchase is modeled
--      as an ordinary `subscriptions` row with status 'active' and a real
--      credit_limit — deliberately reusing the exact credit-spend machinery
--      memberships already use (book_consultation_slot, my_active_subscription,
--      the Account Consultations booking page) instead of building a second,
--      parallel spend system. book_consultation_slot() only ever checks
--      `status = 'active'` and remaining credits — it does NOT check
--      current_period_end — so a one-time pack's long/no-recurrence period
--      does not need any change to that function. Every existing row and
--      every existing query keeps working exactly as before.
--
-- After running this, deploy the two edge functions that use it:
--   supabase/functions/create-consultation-checkout-session
--   supabase/functions/stripe-webhook   (already extended to handle this)

-- ── subscriptions: allow the two new one-time package ids ─────────────────
alter table public.subscriptions
  drop constraint if exists subscriptions_package_id_check;

alter table public.subscriptions
  add constraint subscriptions_package_id_check
  check (package_id in ('basic', 'premium', 'vip-elite', 'single_consultation', 'double_consultation'));

alter table public.subscriptions
  add column if not exists stripe_checkout_session_id text;

-- Idempotency key for one-time purchases (memberships never set this column,
-- so it stays null for them and this index only ever applies to one-time
-- packs — no interaction with the existing stripe_subscription_id flow).
create unique index if not exists subscriptions_stripe_checkout_session_id_idx
  on public.subscriptions (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

-- ── membership_leads: no change needed ─────────────────────────────────────
-- membership_leads is subscription-flow-specific (its own package_id check
-- constraint intentionally stays limited to 'basic'/'premium'/'vip-elite') —
-- one-time consultation purchases use the new `payments` table below
-- instead, since "lead" framing doesn't fit a single-purchase transaction.

-- ── payments ────────────────────────────────────────────────────────────
-- One row per Stripe Checkout attempt for a one-time consultation package.
-- Written by create-consultation-checkout-session (status 'pending', before
-- redirecting to Stripe) and flipped to 'succeeded'/'failed' only by the
-- verified stripe-webhook Edge Function — never by the client, same
-- source-of-truth discipline as `subscriptions`.
create type public.payment_status as enum ('pending', 'succeeded', 'failed', 'refunded');

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  -- Nullable: at insert time (before Stripe redirect) no auth user may exist
  -- yet for a brand-new buyer — mirrors membership_leads' anonymous-first
  -- pattern. The webhook does not need to backfill this column; user
  -- identity for a payment is authoritative via email + the subscriptions
  -- row it activates.
  user_id uuid references auth.users (id) on delete set null,
  full_name text not null,
  email text not null,
  -- Internal app-level slug ('single_consultation' | 'double_consultation'),
  -- kept alongside the raw Stripe product_id below so this table can join
  -- cleanly against subscriptions.package_id.
  package_id text not null check (package_id in ('single_consultation', 'double_consultation')),
  -- The real Stripe Product id (e.g. prod_V65LDqOWTMszsA) — useful for
  -- reconciling against the Stripe Dashboard directly.
  product_id text not null,
  stripe_session_id text,
  stripe_payment_id text,
  -- US cents (Stripe's own convention) to avoid floating-point rounding.
  amount integer not null,
  currency text not null default 'usd',
  status public.payment_status not null default 'pending',
  credits_granted integer not null default 0,
  created_at timestamptz not null default now()
);

create unique index if not exists payments_stripe_session_id_idx
  on public.payments (stripe_session_id)
  where stripe_session_id is not null;

alter table public.payments enable row level security;

-- Deliberately no insert/update/delete policy for authenticated/anon users:
-- payments are only ever written by the two Stripe-related Edge Functions,
-- which use the service_role key and therefore bypass RLS entirely — same
-- pattern as `subscriptions`.
create policy "Users can view their own payments"
  on public.payments for select
  using (auth.uid() = user_id);

-- Convenience view mirroring `my_active_subscription` — a signed-in buyer's
-- own payment/booking-purchase history, newest first.
create or replace view public.my_payments as
  select * from public.payments
  where user_id = auth.uid()
  order by created_at desc;

-- ── consultation_credits ────────────────────────────────────────────────
-- Append-only audit ledger: one row per credit-granting event. The webhook
-- inserts a row here in the SAME operation it bumps
-- subscriptions.consultation_credit_limit — this table is for history/
-- reporting, `subscriptions` remains the one balance book_consultation_slot()
-- actually checks (see file header, point 2).
create table if not exists public.consultation_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  credits integer not null check (credits > 0),
  -- Free-text origin tag, e.g. 'stripe_payment' — kept as text rather than
  -- an enum since future sources (admin grants, promotions) aren't fully
  -- known yet and this table is append-only history, not something RLS or
  -- application logic branches on.
  source text not null,
  payment_id uuid references public.payments (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.consultation_credits enable row level security;

create policy "Users can view their own consultation credit history"
  on public.consultation_credits for select
  using (auth.uid() = user_id);

-- No insert/update/delete policy for authenticated/anon users — written only
-- by the stripe-webhook Edge Function via the service_role key.

create or replace view public.my_consultation_credit_history as
  select * from public.consultation_credits
  where user_id = auth.uid()
  order by created_at desc;

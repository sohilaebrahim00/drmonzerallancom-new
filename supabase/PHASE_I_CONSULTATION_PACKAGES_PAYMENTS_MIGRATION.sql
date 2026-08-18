-- PHASE I — One-time consultation packages + payments ledger
--
-- This file is NOT executed automatically and has NOT been applied to the
-- live database. Review it, then run it once in the Supabase SQL Editor (or
-- `supabase db push`) when ready — same manual-apply convention as
-- schema.sql / PHASE_G_.../PHASE_H_... before it.
--
-- What this adds, and why it's additive/low-risk:
--   1. `public.payments` — a new ledger table for one-time Stripe purchases
--      (Single/Double Consultation, see src/data/consultationPackages.ts).
--      Nothing existing reads or writes this table, so adding it cannot
--      break anything already live.
--   2. Two new allowed `package_id` values on the EXISTING `subscriptions`
--      table ('single_consultation', 'double_consultation'), plus a new
--      nullable `stripe_checkout_session_id` column used as the idempotency
--      key for one-time purchases (memberships keep using
--      `stripe_subscription_id`, untouched). A one-time purchase is modeled
--      as an ordinary `subscriptions` row with status 'active' and a real
--      credit_limit — deliberately reusing the exact credit-spend machinery
--      memberships already use (book_consultation_slot, my_active_subscription,
--      the Account Consultations booking page) instead of building a second,
--      parallel credit system. book_consultation_slot() only ever checks
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
  package_id text not null check (package_id in ('single_consultation', 'double_consultation')),
  status public.payment_status not null default 'pending',
  amount_cents integer,
  currency text not null default 'usd',
  credits_granted integer not null default 0,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists payments_stripe_checkout_session_id_idx
  on public.payments (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

alter table public.payments enable row level security;

-- Deliberately no insert/update/delete policy for authenticated/anon users:
-- payments are only ever written by the two Stripe-related Edge Functions,
-- which use the service_role key and therefore bypass RLS entirely — same
-- pattern as `subscriptions`.
create policy "Users can view their own payments"
  on public.payments for select
  using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at
  before update on public.payments
  for each row execute procedure public.set_updated_at();

-- Convenience view mirroring `my_active_subscription` — a signed-in buyer's
-- own payment/booking-purchase history, newest first.
create or replace view public.my_payments as
  select * from public.payments
  where user_id = auth.uid()
  order by created_at desc;

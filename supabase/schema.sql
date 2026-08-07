-- Monzer Allan — membership & consultation schema
--
-- This file is NOT executed automatically. Run it once in your Supabase
-- project's SQL Editor (or via `supabase db push` if you use the CLI) after
-- creating the project referenced by VITE_SUPABASE_URL. Nothing in this repo
-- has applied this schema to a live database — it is provided so the
-- frontend's queries have a real, correctly-shaped table to talk to once you
-- do.
--
-- Design notes:
--   * `profiles` holds public-safe identity data only. No medical data.
--   * `subscriptions` is the source of truth for membership status and
--     credit balances. The frontend NEVER writes credit balances directly —
--     only Stripe-webhook-driven server code (a Supabase Edge Function; see
--     supabase/functions/stripe-webhook) should insert/update rows here.
--   * `consultation_requests` is written by the authenticated member
--     (their own rows only, via RLS) but its `status` field is only ever
--     advanced by the team / a service-role process — never by the client.

-- ── profiles ────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── subscriptions ───────────────────────────────────────────────────────
create type public.subscription_status as enum ('active', 'past_due', 'cancelled', 'expired');

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  package_id text not null check (package_id in ('basic', 'premium', 'vip-elite')),
  status public.subscription_status not null default 'active',
  stripe_customer_id text,
  stripe_subscription_id text,
  started_at timestamptz not null default now(),
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz,
  consultation_credit_limit integer not null default 0,
  consultation_credits_used integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "Users can view their own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Deliberately no insert/update/delete policy for authenticated users:
-- subscriptions are only ever written by the Stripe-webhook Edge Function,
-- which uses the service_role key and therefore bypasses RLS entirely.

create view public.my_active_subscription as
  select *,
    greatest(consultation_credit_limit - consultation_credits_used, 0) as consultation_credits_remaining
  from public.subscriptions
  where user_id = auth.uid()
    and status = 'active'
  order by current_period_start desc
  limit 1;

-- ── consultation_requests ───────────────────────────────────────────────
create type public.consultation_status as enum ('pending', 'approved', 'scheduled', 'completed', 'cancelled');

create table if not exists public.consultation_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subscription_id uuid references public.subscriptions (id) on delete set null,
  consultation_type text,
  preferred_date date,
  preferred_time text,
  time_zone text,
  reason text,
  status public.consultation_status not null default 'pending',
  google_meet_link text,
  scheduled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.consultation_requests enable row level security;

create policy "Users can view their own consultation requests"
  on public.consultation_requests for select
  using (auth.uid() = user_id);

create policy "Users can create their own consultation requests"
  on public.consultation_requests for insert
  with check (auth.uid() = user_id);

-- No update/delete policy for authenticated users: status changes
-- (approved/scheduled/completed/cancelled) and credit deduction are handled
-- server-side only, so a request can't be self-approved or edited after
-- submission from the client.

-- ── Credit-safe request function ───────────────────────────────────────
-- The client calls this RPC instead of inserting directly, so the
-- "do they have a credit available" check happens inside the database,
-- not in frontend state. It does NOT deduct a credit — deduction happens
-- only when the team/service-role process approves the request (per the
-- product requirement that a credit is spent on approval, not on request).
create or replace function public.request_consultation(
  p_consultation_type text,
  p_preferred_date date,
  p_preferred_time text,
  p_time_zone text,
  p_reason text
)
returns public.consultation_requests
language plpgsql
security definer set search_path = public
as $$
declare
  v_subscription public.subscriptions;
  v_result public.consultation_requests;
begin
  select * into v_subscription
  from public.subscriptions
  where user_id = auth.uid() and status = 'active'
  order by current_period_start desc
  limit 1;

  if v_subscription is null then
    raise exception 'No active membership found.';
  end if;

  if (v_subscription.consultation_credit_limit - v_subscription.consultation_credits_used) <= 0 then
    raise exception 'No consultation credits remaining in your current membership.';
  end if;

  insert into public.consultation_requests (
    user_id, subscription_id, consultation_type, preferred_date, preferred_time, time_zone, reason
  ) values (
    auth.uid(), v_subscription.id, p_consultation_type, p_preferred_date, p_preferred_time, p_time_zone, p_reason
  )
  returning * into v_result;

  return v_result;
end;
$$;

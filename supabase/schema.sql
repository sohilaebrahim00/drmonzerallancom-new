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
-- Redesigned around real, atomic slot booking (see book_consultation_slot
-- below) rather than a loose "preferred date/time" request. A row here
-- represents a specific, real appointment_start/appointment_end slot.
create type public.consultation_status as enum ('pending', 'confirmed', 'completed', 'cancelled', 'rescheduled');
-- 'reserved'  — a credit is held against this row (slot just booked, Google Calendar step not yet done)
-- 'confirmed' — a real Google Calendar/Meet event exists; credit is permanently spent
-- 'released'  — the hold was rolled back (Google step failed, or a valid cancellation) and the credit was restored
create type public.credit_status as enum ('reserved', 'confirmed', 'released');

create table if not exists public.consultation_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subscription_id uuid references public.subscriptions (id) on delete set null,
  appointment_start timestamptz not null,
  appointment_end timestamptz not null,
  client_timezone text,
  consultation_type text,
  reason text,
  status public.consultation_status not null default 'pending',
  credit_status public.credit_status not null default 'reserved',
  google_calendar_event_id text,
  google_meet_url text,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The database itself is the source of truth for "no double booking" — a
-- second concurrent booking attempt for the same start time hits this
-- unique index and fails with a unique_violation, which
-- book_consultation_slot below turns into a clean "SLOT_TAKEN" error.
-- Cancelled/released rows don't block the slot from being rebooked.
create unique index if not exists consultation_requests_active_slot_idx
  on public.consultation_requests (appointment_start)
  where status in ('pending', 'confirmed', 'rescheduled');

alter table public.consultation_requests enable row level security;

create policy "Users can view their own consultation requests"
  on public.consultation_requests for select
  using (auth.uid() = user_id);

-- No client insert/update/delete policy: every row is written exclusively
-- by the SECURITY DEFINER functions below (called from the create-consultation
-- Edge Function after verifying the caller's Supabase session), never by a
-- direct client insert — this is what makes credit deduction and slot
-- locking atomic and unspoofable from the browser.

-- ── Atomic slot booking ─────────────────────────────────────────────────
-- Validates active membership + remaining credit + the 48-hour minimum
-- notice, then reserves the slot and increments consultation_credits_used
-- in the SAME transaction. The unique index above makes the actual
-- double-booking check atomic at the database level: if two requests race
-- for the same appointment_start, only one insert can succeed.
create or replace function public.book_consultation_slot(
  p_user_id uuid,
  p_appointment_start timestamptz,
  p_appointment_end timestamptz,
  p_timezone text,
  p_consultation_type text,
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
  -- Row lock prevents the same user from spending two credits via parallel requests.
  select * into v_subscription
  from public.subscriptions
  where user_id = p_user_id and status = 'active'
  order by current_period_start desc
  limit 1
  for update;

  if v_subscription is null then
    raise exception 'NO_ACTIVE_MEMBERSHIP';
  end if;

  if (v_subscription.consultation_credit_limit - v_subscription.consultation_credits_used) <= 0 then
    raise exception 'NO_CREDITS_REMAINING';
  end if;

  if p_appointment_start < (now() + interval '48 hours') then
    raise exception 'MINIMUM_NOTICE_NOT_MET';
  end if;

  begin
    insert into public.consultation_requests (
      user_id, subscription_id, appointment_start, appointment_end,
      client_timezone, consultation_type, reason, status, credit_status
    ) values (
      p_user_id, v_subscription.id, p_appointment_start, p_appointment_end,
      p_timezone, p_consultation_type, p_reason, 'pending', 'reserved'
    )
    returning * into v_result;
  exception when unique_violation then
    raise exception 'SLOT_TAKEN';
  end;

  update public.subscriptions
  set consultation_credits_used = consultation_credits_used + 1,
      updated_at = now()
  where id = v_subscription.id;

  return v_result;
end;
$$;

revoke all on function public.book_consultation_slot(uuid, timestamptz, timestamptz, text, text, text) from public, anon, authenticated;
grant execute on function public.book_consultation_slot(uuid, timestamptz, timestamptz, text, text, text) to service_role;

-- ── Rollback a reserved hold ────────────────────────────────────────────
-- Called by create-consultation when the Google Calendar/Meet step fails
-- (or isn't configured yet) so a visitor is never left with a spent credit
-- and no real meeting. Restores the credit and marks the row cancelled —
-- the slot's unique index only blocks 'pending'/'confirmed'/'rescheduled'
-- rows, so a cancelled row immediately frees the slot for rebooking.
create or replace function public.rollback_consultation_hold(p_request_id uuid)
returns public.consultation_requests
language plpgsql
security definer set search_path = public
as $$
declare
  v_request public.consultation_requests;
begin
  select * into v_request from public.consultation_requests where id = p_request_id for update;
  if v_request is null then
    raise exception 'REQUEST_NOT_FOUND';
  end if;
  if v_request.credit_status <> 'reserved' then
    -- Already confirmed or already released — never double-release a credit.
    return v_request;
  end if;

  update public.subscriptions
  set consultation_credits_used = greatest(consultation_credits_used - 1, 0),
      updated_at = now()
  where id = v_request.subscription_id;

  update public.consultation_requests
  set status = 'cancelled', credit_status = 'released', cancelled_at = now(), updated_at = now()
  where id = p_request_id
  returning * into v_request;

  return v_request;
end;
$$;

revoke all on function public.rollback_consultation_hold(uuid) from public, anon, authenticated;
grant execute on function public.rollback_consultation_hold(uuid) to service_role;

-- ── Confirm a reserved hold ─────────────────────────────────────────────
-- Called by create-consultation after a real Google Calendar/Meet event is
-- successfully created.
create or replace function public.confirm_consultation_hold(
  p_request_id uuid,
  p_google_calendar_event_id text,
  p_google_meet_url text
)
returns public.consultation_requests
language plpgsql
security definer set search_path = public
as $$
declare
  v_result public.consultation_requests;
begin
  update public.consultation_requests
  set status = 'confirmed',
      credit_status = 'confirmed',
      google_calendar_event_id = p_google_calendar_event_id,
      google_meet_url = p_google_meet_url,
      updated_at = now()
  where id = p_request_id and credit_status = 'reserved'
  returning * into v_result;

  if v_result is null then
    raise exception 'REQUEST_NOT_FOUND_OR_ALREADY_RESOLVED';
  end if;

  return v_result;
end;
$$;

revoke all on function public.confirm_consultation_hold(uuid, text, text) from public, anon, authenticated;
grant execute on function public.confirm_consultation_hold(uuid, text, text) to service_role;

-- ── Member-initiated cancellation ───────────────────────────────────────
-- Cancellation policy (e.g. "credit restored only if cancelled >24h before
-- the appointment") is intentionally NOT hardcoded here — the
-- create-consultation Edge Function decides whether to also call
-- rollback_consultation_hold based on configurable policy, then calls this
-- to update the Calendar event / mark the row cancelled. This function only
-- performs the ownership-checked status change.
create or replace function public.cancel_my_consultation(p_request_id uuid)
returns public.consultation_requests
language plpgsql
security definer set search_path = public
as $$
declare
  v_result public.consultation_requests;
begin
  update public.consultation_requests
  set status = 'cancelled', cancelled_at = now(), updated_at = now()
  where id = p_request_id and user_id = auth.uid() and status in ('pending', 'confirmed')
  returning * into v_result;

  if v_result is null then
    raise exception 'REQUEST_NOT_FOUND_OR_NOT_CANCELLABLE';
  end if;

  return v_result;
end;
$$;

revoke all on function public.cancel_my_consultation(uuid) from public, anon;
grant execute on function public.cancel_my_consultation(uuid) to authenticated;

-- ── shared contact-preference enum ─────────────────────────────────────
create type public.contact_method as enum ('whatsapp', 'email', 'either');

-- ── membership_leads ────────────────────────────────────────────────────
-- Written by the Join page BEFORE the visitor reaches Stripe Checkout, so
-- the team can follow up with people who showed intent but didn't finish
-- paying. Only a Supabase Edge Function (service_role) ever marks a lead
-- "paid" — that happens exclusively from a verified Stripe webhook event,
-- never from the browser.
create type public.membership_lead_status as enum ('started', 'checkout_created', 'paid', 'abandoned');

create table if not exists public.membership_leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  preferred_contact_method public.contact_method not null default 'either',
  package_id text not null check (package_id in ('basic', 'premium', 'vip-elite')),
  status public.membership_lead_status not null default 'started',
  stripe_checkout_session_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.membership_leads enable row level security;

-- Anyone (including anonymous visitors, since no account exists yet at this
-- point in the flow) may create a lead. No select/update/delete policy is
-- granted to anon/authenticated roles — leads are only ever read or updated
-- by service-role Edge Functions (create-checkout-session, stripe-webhook).
create policy "Anyone can submit a membership lead"
  on public.membership_leads for insert
  with check (true);

-- ── contact_inquiries ───────────────────────────────────────────────────
-- Backs the public Contact form. Deliberately write-only from the client
-- (no select policy) so submitted inquiries — which may include a phone
-- number — aren't readable by other visitors. The admin notification email
-- (sent by a service-role Edge Function) is how the team actually sees these.
create table if not exists public.contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  preferred_contact_method public.contact_method not null default 'either',
  subject text,
  message text not null,
  source_page text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

alter table public.contact_inquiries enable row level security;

create policy "Anyone can submit a contact inquiry"
  on public.contact_inquiries for insert
  with check (true);

-- ── admin helper: look up an auth user's id by email ───────────────────
-- Used only by the stripe-webhook Edge Function (service_role) to find an
-- existing member when a checkout completes with an email that already has
-- an account, so it never creates a duplicate auth user. auth.users is not
-- otherwise exposed via the API — this function deliberately grants
-- execute only to service_role, never to anon/authenticated.
create or replace function public.get_user_id_by_email(p_email text)
returns uuid
language sql
security definer set search_path = public, auth
as $$
  select id from auth.users where email = p_email limit 1;
$$;

revoke all on function public.get_user_id_by_email(text) from public, anon, authenticated;
grant execute on function public.get_user_id_by_email(text) to service_role;

-- ── admin flag ──────────────────────────────────────────────────────────
-- Marks the doctor/admin account. Set manually in the Supabase Table
-- Editor for the doctor's own profile row after they sign in once — there
-- is no self-service way to become admin, by design.
alter table public.profiles add column if not exists is_admin boolean not null default false;

-- Helper used by RLS policies below and callable by Edge Functions to check
-- whether the CURRENTLY AUTHENTICATED user (auth.uid()) is the admin.
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- Admins can see every member's consultation requests (needed for the
-- doctor's schedule view) in addition to their own row via the policy above.
create policy "Admins can view all consultation requests"
  on public.consultation_requests for select
  using (public.is_admin());

-- ── doctor_availability ─────────────────────────────────────────────────
-- The doctor's recurring weekly schedule. Public SELECT is intentional —
-- these are business hours, the same kind of information already shown on
-- the Packages page ("Google Meet consultation booked at least three days
-- in advance"), not sensitive data. Only an admin can change it; slot
-- availability itself is still always computed and enforced server-side
-- (see get-availability / create-consultation), never trusted from a
-- client that merely reads this table.
create table if not exists public.doctor_availability (
  id uuid primary key default gen_random_uuid(),
  day_of_week smallint not null check (day_of_week between 0 and 6), -- 0 = Sunday .. 6 = Saturday (ISO/JS convention)
  start_time time not null,
  end_time time not null,
  timezone text not null default 'Asia/Dubai',
  is_active boolean not null default true,
  -- No consultation duration was configured anywhere in the project before
  -- this table existed, so 30 minutes was chosen as a reasonable default —
  -- change it here (or per-row) any time; every slot-generation call reads
  -- it live, nothing derived from it is cached or hardcoded in the frontend.
  slot_duration_minutes integer not null default 30 check (slot_duration_minutes > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time)
);

alter table public.doctor_availability enable row level security;

create policy "Anyone can view doctor availability"
  on public.doctor_availability for select
  using (true);

create policy "Admins can manage doctor availability"
  on public.doctor_availability for all
  using (public.is_admin())
  with check (public.is_admin());

-- Default recurring schedule: Monday, Wednesday, Friday, 4:00 PM–9:00 PM
-- Asia/Dubai (UTC+4). Safe to run more than once — only inserts if the
-- table is empty, so it never overwrites hours an admin has since changed.
insert into public.doctor_availability (day_of_week, start_time, end_time, timezone, is_active, slot_duration_minutes)
select * from (values
  (1, '16:00'::time, '21:00'::time, 'Asia/Dubai', true, 30), -- Monday
  (3, '16:00'::time, '21:00'::time, 'Asia/Dubai', true, 30), -- Wednesday
  (5, '16:00'::time, '21:00'::time, 'Asia/Dubai', true, 30)  -- Friday
) as defaults(day_of_week, start_time, end_time, timezone, is_active, slot_duration_minutes)
where not exists (select 1 from public.doctor_availability);

-- ── availability_exceptions ─────────────────────────────────────────────
-- One-off overrides to the recurring schedule above: a specific date the
-- doctor is unavailable (vacation/holiday/personal block), or a specific
-- date with different hours than the recurring pattern, or an extra
-- working day outside Monday/Wednesday/Friday.
create type public.availability_exception_type as enum (
  'unavailable', 'custom_hours', 'holiday', 'vacation', 'personal_block', 'extra_day'
);

create table if not exists public.availability_exceptions (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  type public.availability_exception_type not null default 'unavailable',
  -- Only meaningful when is_available = true (custom_hours / extra_day) —
  -- null start/end on an unavailable-type row simply blocks the whole date.
  start_time time,
  end_time time,
  reason text,
  is_available boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (date, start_time, end_time)
);

alter table public.availability_exceptions enable row level security;

create policy "Anyone can view availability exceptions"
  on public.availability_exceptions for select
  using (true);

create policy "Admins can manage availability exceptions"
  on public.availability_exceptions for all
  using (public.is_admin())
  with check (public.is_admin());

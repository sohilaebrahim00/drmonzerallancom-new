-- ═══════════════════════════════════════════════════════════════════════
-- Consultation Booking System — INCREMENTAL migration
-- ═══════════════════════════════════════════════════════════════════════
--
-- For an existing Supabase project where the ORIGINAL supabase/schema.sql
-- (profiles, subscriptions, the old-shape consultation_requests,
-- membership_leads, contact_inquiries, get_user_id_by_email) has ALREADY
-- been applied and may already contain real users, memberships, and leads.
--
-- This file does NOT drop or recreate anything that already exists with
-- data in it. Every statement is either additive (new table / new column /
-- new function / new policy) or an idempotent guard (IF NOT EXISTS /
-- CREATE OR REPLACE / DROP POLICY IF EXISTS before CREATE POLICY). Nothing
-- here deletes a user, a subscription, a membership lead, or a contact
-- inquiry. Existing consultation_requests rows are preserved — the old
-- columns they were written with (preferred_date, preferred_time,
-- google_meet_link, scheduled_at) are left in place, untouched; the
-- booking system going forward uses new columns added alongside them.
--
-- ┌─────────────────────────────────────────────────────────────────────┐
-- │  RUN THIS IN TWO SEPARATE STEPS — DO NOT PASTE THE WHOLE FILE AT     │
-- │  ONCE. PostgreSQL will not let a brand-new enum value be used in the │
-- │  same transaction that added it ("unsafe use of new value of enum   │
-- │  type"), and the Supabase SQL Editor runs everything you paste as   │
-- │  one transaction. So:                                               │
-- │                                                                     │
-- │    1. Copy PART 1 only, paste it into the SQL Editor, click Run.    │
-- │    2. Confirm it succeeds (2 statements, no errors).                │
-- │    3. Copy PART 2 only, paste it into the SQL Editor, click Run.    │
-- │                                                                     │
-- │  Running Part 1 and Part 2 together in one paste WILL fail.         │
-- └─────────────────────────────────────────────────────────────────────┘

-- ═══════════════════════════════════════════════════════════════════════
-- PART 1 — run this first, on its own, and let it commit before Part 2
-- ═══════════════════════════════════════════════════════════════════════
-- Adds the two new statuses the booking system needs to the EXISTING
-- consultation_status enum. The old values ('approved', 'scheduled') are
-- left in the type — Postgres has no safe way to remove enum values
-- in-place, and leaving them costs nothing; the app simply stops writing
-- them going forward.

alter type public.consultation_status add value if not exists 'confirmed';
alter type public.consultation_status add value if not exists 'rescheduled';

-- ═══════════════════════════════════════════════════════════════════════
-- PART 2 — run this second, as its own separate execution, after Part 1
-- has committed successfully
-- ═══════════════════════════════════════════════════════════════════════

-- ── new enum types ──────────────────────────────────────────────────────
do $$ begin
  create type public.credit_status as enum ('reserved', 'confirmed', 'released');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.availability_exception_type as enum (
    'unavailable', 'custom_hours', 'holiday', 'vacation', 'personal_block', 'extra_day'
  );
exception when duplicate_object then null;
end $$;

-- ── extend consultation_requests with the new real-booking columns ─────
-- All additive and nullable (or NOT NULL with a DEFAULT, which Postgres
-- backfills safely on an existing table) — nothing here can fail against
-- existing rows or existing data. The old preferred_date / preferred_time
-- / google_meet_link / scheduled_at columns are left exactly as they are.
alter table public.consultation_requests
  add column if not exists appointment_start timestamptz,
  add column if not exists appointment_end timestamptz,
  add column if not exists client_timezone text,
  add column if not exists credit_status public.credit_status not null default 'reserved',
  add column if not exists google_calendar_event_id text,
  add column if not exists google_meet_url text,
  add column if not exists cancelled_at timestamptz;

-- Database-level double-booking protection: a second booking attempt for
-- the same start time hits this and fails with a clean unique_violation.
-- Existing legacy rows (appointment_start still NULL) never conflict —
-- NULL is never equal to NULL in a unique index.
create unique index if not exists consultation_requests_active_slot_idx
  on public.consultation_requests (appointment_start)
  where status in ('pending', 'confirmed', 'rescheduled');

-- ── admin flag on profiles ──────────────────────────────────────────────
alter table public.profiles add column if not exists is_admin boolean not null default false;

create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

drop policy if exists "Admins can view all consultation requests" on public.consultation_requests;
create policy "Admins can view all consultation requests"
  on public.consultation_requests for select
  using (public.is_admin());

-- ── doctor_availability ─────────────────────────────────────────────────
create table if not exists public.doctor_availability (
  id uuid primary key default gen_random_uuid(),
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  timezone text not null default 'Asia/Dubai',
  is_active boolean not null default true,
  slot_duration_minutes integer not null default 30 check (slot_duration_minutes > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time)
);

alter table public.doctor_availability enable row level security;

drop policy if exists "Anyone can view doctor availability" on public.doctor_availability;
create policy "Anyone can view doctor availability"
  on public.doctor_availability for select
  using (true);

drop policy if exists "Admins can manage doctor availability" on public.doctor_availability;
create policy "Admins can manage doctor availability"
  on public.doctor_availability for all
  using (public.is_admin())
  with check (public.is_admin());

-- Default Monday/Wednesday/Friday 4:00 PM–9:00 PM Asia/Dubai — only
-- inserted if the table is empty, so re-running this migration never
-- overwrites hours an admin has since changed.
insert into public.doctor_availability (day_of_week, start_time, end_time, timezone, is_active, slot_duration_minutes)
select * from (values
  (1, '16:00'::time, '21:00'::time, 'Asia/Dubai', true, 30),
  (3, '16:00'::time, '21:00'::time, 'Asia/Dubai', true, 30),
  (5, '16:00'::time, '21:00'::time, 'Asia/Dubai', true, 30)
) as defaults(day_of_week, start_time, end_time, timezone, is_active, slot_duration_minutes)
where not exists (select 1 from public.doctor_availability);

-- ── availability_exceptions ─────────────────────────────────────────────
create table if not exists public.availability_exceptions (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  type public.availability_exception_type not null default 'unavailable',
  start_time time,
  end_time time,
  reason text,
  is_available boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (date, start_time, end_time)
);

alter table public.availability_exceptions enable row level security;

drop policy if exists "Anyone can view availability exceptions" on public.availability_exceptions;
create policy "Anyone can view availability exceptions"
  on public.availability_exceptions for select
  using (true);

drop policy if exists "Admins can manage availability exceptions" on public.availability_exceptions;
create policy "Admins can manage availability exceptions"
  on public.availability_exceptions for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── atomic booking functions ────────────────────────────────────────────
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

-- ── optional cleanup: the old request_consultation() RPC is fully
-- superseded by book_consultation_slot() above and is no longer called by
-- any frontend code. Dropping it removes dead code only — it holds no
-- data of its own. Safe to skip this statement if you'd rather keep it.
drop function if exists public.request_consultation(text, date, text, text, text);

-- ═══════════════════════════════════════════════════════════════════════
-- End of migration. After Part 2 succeeds:
--   1. In the Table Editor, open `profiles`, find the doctor's own row
--      (matches their auth user), and set is_admin = true manually.
--      There is no self-service way to become admin, by design.
--   2. Confirm `doctor_availability` has 3 rows (Mon/Wed/Fri) via
--      Table Editor or: select * from public.doctor_availability;
-- ═══════════════════════════════════════════════════════════════════════

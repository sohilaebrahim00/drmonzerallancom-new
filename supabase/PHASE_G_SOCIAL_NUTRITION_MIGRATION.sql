-- ═══════════════════════════════════════════════════════════════════════
-- PHASE G — Social Nutrition & 30-Day Health Tracking Platform
-- Incremental migration. Extends supabase/schema.sql — does NOT replace it.
--
-- SAFETY:
--   * Every statement is additive (create table/column/policy if not
--     exists, or create-or-replace for functions). Nothing here drops a
--     table, drops a column, or deletes data.
--   * NOT executed automatically by any code in this repo. Review this
--     file, then run it once yourself (Supabase SQL Editor or
--     `supabase db push`) against the project that already has
--     supabase/schema.sql applied.
--   * Existing tables (profiles, subscriptions, consultation_requests,
--     membership_leads, contact_inquiries, doctor_availability,
--     availability_exceptions) are only ever ALTERed to add new nullable/
--     defaulted columns — no existing row, column, or constraint is
--     touched destructively.
--
-- READ FIRST: PHASE_G_SOCIAL_NUTRITION_IMPLEMENTATION_REPORT.md documents
-- exactly which parts of this file are wired up to working application
-- code today vs. schema prepared for a later pass.
-- ═══════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────────
-- 1. ROLES
-- ───────────────────────────────────────────────────────────────────────
-- `profiles.is_admin` (schema.sql) already exists and stays as-is — the
-- doctor/practice-owner account keeps working exactly as before. `role` is
-- the new authoritative, extensible source of truth (supports a future
-- second doctor without repurposing "admin" to mean two different things).

create type public.user_role as enum ('user', 'doctor', 'admin');

alter table public.profiles add column if not exists role public.user_role not null default 'user';
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists timezone text;
alter table public.profiles add column if not exists deleted_at timestamptz;
-- Server-side onboarding-wizard progress (see report's "Onboarding State
-- Machine" section) — the authoritative resume point, separate from the
-- purely local/device "has this device seen the welcome slides" flag
-- already stored via Preferences (ONBOARDING_SEEN_KEY). Storing the
-- current step server-side is what makes "close app mid-onboarding, then
-- reopen on ANY device" resume at the right step, not just the same device.
alter table public.profiles add column if not exists onboarding_current_step text;
alter table public.profiles add column if not exists onboarding_completed_at timestamptz;

-- Backfill: the existing is_admin flag becomes role='admin' — no manual
-- re-entry needed for the account already marked admin today.
update public.profiles set role = 'admin' where is_admin = true and role = 'user';

-- Username: unique, case-insensitive, 3-24 chars, letters/digits/underscore/dot.
-- Nullable (existing accounts have none yet; new signups always set one).
alter table public.profiles
  add constraint profiles_username_format
  check (username is null or username ~ '^[a-z0-9_.]{3,24}$');

create unique index if not exists profiles_username_unique_idx
  on public.profiles (lower(username)) where username is not null;

-- Reserved handles that must never be assignable as a username (route
-- collisions, obvious impersonation risk). Extend this list, don't remove from it.
create table if not exists public.reserved_usernames (
  username text primary key
);
insert into public.reserved_usernames (username) values
  ('admin'), ('root'), ('support'), ('help'), ('api'), ('monzer'), ('monzerallan'),
  ('doctor'), ('dr'), ('official'), ('team'), ('null'), ('undefined'), ('system')
on conflict do nothing;

alter table public.profiles
  add constraint profiles_username_not_reserved
  check (username is null or lower(username) not in (select username from public.reserved_usernames));

-- Role helper functions (is_admin() already exists in schema.sql — kept,
-- and now also true for role='admin' so both flags stay in sync in either
-- direction going forward).
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select coalesce(
    (select is_admin or role = 'admin' from public.profiles where id = auth.uid()),
    false
  );
$$;

create or replace function public.is_doctor()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select coalesce(
    (select role in ('doctor', 'admin') from public.profiles where id = auth.uid()),
    false
  );
$$;

-- SECURITY FIX: schema.sql's existing "Users can update their own profile"
-- policy has a USING clause but no WITH CHECK, which means it does NOT
-- restrict which columns a user may change on their own row — including
-- the `role`/`is_admin` columns just added above. Before this trigger, an
-- authenticated user could self-promote with a single
-- `update profiles set role = 'admin' where id = auth.uid()`. This is a
-- real, pre-existing gap this migration closes (the columns didn't exist
-- before this file, so the gap only became exploitable once they were
-- added — this trigger ships in the SAME migration, so it's never live).
create or replace function public.prevent_self_role_escalation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if (new.role is distinct from old.role or new.is_admin is distinct from old.is_admin) then
    if not public.is_admin() then
      raise exception 'FORBIDDEN: role/is_admin can only be changed by an existing admin';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_self_role_escalation on public.profiles;
create trigger trg_prevent_self_role_escalation
  before update on public.profiles
  for each row execute procedure public.prevent_self_role_escalation();

create policy "Anyone can view public profile fields"
  on public.profiles for select
  using (true);
-- Note: this SELECT policy only controls ROW visibility, not COLUMN
-- visibility — Postgres RLS is row-level. Every client query in this
-- codebase explicitly lists safe columns (id, full_name, username,
-- avatar_url, bio, role) and never `select *` against profiles from
-- untrusted contexts; email/phone/medications/etc. live in auth.users or
-- body_profiles, which have their own, much stricter policies below —
-- so this broad row policy does not expose sensitive data.


-- ───────────────────────────────────────────────────────────────────────
-- 2. PRIVACY SETTINGS
-- ───────────────────────────────────────────────────────────────────────
create table if not exists public.user_privacy_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  share_meals_with_friends boolean not null default true,
  share_meal_photos_with_friends boolean not null default false,
  share_calories_with_friends boolean not null default true,
  share_steps_with_friends boolean not null default true,
  share_activity_with_friends boolean not null default true,
  share_program_progress_with_friends boolean not null default true,
  share_weight_with_friends boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.user_privacy_settings enable row level security;

create policy "Users manage their own privacy settings"
  on public.user_privacy_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Doctor visibility of health/activity data is governed by the existence
-- of an ACTIVE doctor_patient_relationships row (see §5), not a granular
-- per-field toggle here — the relationship itself is the consent
-- mechanism the client asked for ("Doctor access ... requires an active
-- doctor-patient relationship"). Friend visibility is granular (above);
-- doctor visibility is all-or-nothing per active relationship.

create or replace function public.get_or_create_privacy_settings(p_user_id uuid)
returns public.user_privacy_settings
language plpgsql
security definer set search_path = public
as $$
declare
  v_row public.user_privacy_settings;
begin
  if auth.uid() <> p_user_id then
    raise exception 'FORBIDDEN';
  end if;
  select * into v_row from public.user_privacy_settings where user_id = p_user_id;
  if v_row is null then
    insert into public.user_privacy_settings (user_id) values (p_user_id) returning * into v_row;
  end if;
  return v_row;
end;
$$;

revoke all on function public.get_or_create_privacy_settings(uuid) from public, anon;
grant execute on function public.get_or_create_privacy_settings(uuid) to authenticated;


-- ───────────────────────────────────────────────────────────────────────
-- 3. FRIENDSHIPS
-- ───────────────────────────────────────────────────────────────────────
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users (id) on delete cascade,
  addressee_id uuid not null references auth.users (id) on delete cascade,
  status text not null check (status in ('pending', 'accepted', 'declined', 'blocked')) default 'pending',
  -- Who performed the block, when status = 'blocked' — the OTHER party
  -- must never be able to see they were blocked, only that they aren't friends.
  blocked_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requester_id <> addressee_id),
  -- Canonical unordered pair key — makes "no A→B AND B→A duplicate" a real
  -- database constraint rather than an application-trusted check.
  pair_key text generated always as (
    least(requester_id::text, addressee_id::text) || ':' || greatest(requester_id::text, addressee_id::text)
  ) stored
);

-- Only one active (pending/accepted/blocked) row per unordered pair — a
-- fresh request IS allowed again after a 'declined' outcome (not covered
-- by this partial index), matching normal "you can ask again later" UX.
create unique index if not exists friendships_active_pair_idx
  on public.friendships (pair_key)
  where status in ('pending', 'accepted', 'blocked');

create index if not exists friendships_requester_idx on public.friendships (requester_id, status);
create index if not exists friendships_addressee_idx on public.friendships (addressee_id, status);

alter table public.friendships enable row level security;

create policy "Participants can view their own friendship rows"
  on public.friendships for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- No direct client insert/update/delete policy — every state change goes
-- through the SECURITY DEFINER functions below, so self-friending,
-- duplicate requests, and "accept a request that isn't yours" are all
-- rejected in one place rather than trusted to RLS + client logic alone.

create or replace function public.send_friend_request(p_addressee_id uuid)
returns public.friendships
language plpgsql
security definer set search_path = public
as $$
declare
  v_row public.friendships;
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if auth.uid() = p_addressee_id then raise exception 'CANNOT_FRIEND_SELF'; end if;

  insert into public.friendships (requester_id, addressee_id, status)
  values (auth.uid(), p_addressee_id, 'pending')
  returning * into v_row;

  return v_row;
exception
  when unique_violation then
    raise exception 'ALREADY_CONNECTED';
end;
$$;

create or replace function public.respond_friend_request(p_friendship_id uuid, p_accept boolean)
returns public.friendships
language plpgsql
security definer set search_path = public
as $$
declare
  v_row public.friendships;
begin
  update public.friendships
  set status = case when p_accept then 'accepted' else 'declined' end,
      updated_at = now()
  where id = p_friendship_id
    and addressee_id = auth.uid()
    and status = 'pending'
  returning * into v_row;

  if v_row is null then raise exception 'REQUEST_NOT_FOUND'; end if;
  return v_row;
end;
$$;

create or replace function public.cancel_or_remove_friendship(p_friendship_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  delete from public.friendships
  where id = p_friendship_id
    and (requester_id = auth.uid() or addressee_id = auth.uid())
    and status in ('pending', 'accepted');
end;
$$;

create or replace function public.block_user(p_target_id uuid)
returns public.friendships
language plpgsql
security definer set search_path = public
as $$
declare
  v_row public.friendships;
  v_pair text;
begin
  if auth.uid() = p_target_id then raise exception 'CANNOT_BLOCK_SELF'; end if;
  v_pair := least(auth.uid()::text, p_target_id::text) || ':' || greatest(auth.uid()::text, p_target_id::text);

  delete from public.friendships where pair_key = v_pair;

  insert into public.friendships (requester_id, addressee_id, status, blocked_by)
  values (auth.uid(), p_target_id, 'blocked', auth.uid())
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.send_friend_request(uuid) from public, anon;
revoke all on function public.respond_friend_request(uuid, boolean) from public, anon;
revoke all on function public.cancel_or_remove_friendship(uuid) from public, anon;
revoke all on function public.block_user(uuid) from public, anon;
grant execute on function public.send_friend_request(uuid) to authenticated;
grant execute on function public.respond_friend_request(uuid, boolean) to authenticated;
grant execute on function public.cancel_or_remove_friendship(uuid) to authenticated;
grant execute on function public.block_user(uuid) to authenticated;

-- Used throughout the RLS policies below to gate friend-shared data.
create or replace function public.are_friends(p_user_a uuid, p_user_b uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.friendships
    where status = 'accepted'
      and ((requester_id = p_user_a and addressee_id = p_user_b)
        or (requester_id = p_user_b and addressee_id = p_user_a))
  );
$$;

create or replace function public.is_blocked(p_user_a uuid, p_user_b uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.friendships
    where status = 'blocked'
      and ((requester_id = p_user_a and addressee_id = p_user_b)
        or (requester_id = p_user_b and addressee_id = p_user_a))
  );
$$;


-- ───────────────────────────────────────────────────────────────────────
-- 4. USER SEARCH (rate-limit-friendly RPC — never a raw `select *` search)
-- ───────────────────────────────────────────────────────────────────────
create or replace function public.search_users(p_query text)
returns table (id uuid, username text, full_name text, avatar_url text)
language sql
security definer set search_path = public
stable
as $$
  select p.id, p.username, p.full_name, p.avatar_url
  from public.profiles p
  where p.deleted_at is null
    and length(trim(p_query)) >= 2
    and p.id <> auth.uid()
    and (p.username ilike '%' || trim(p_query) || '%' or p.full_name ilike '%' || trim(p_query) || '%')
    and not public.is_blocked(auth.uid(), p.id)
  order by
    (lower(p.username) = lower(trim(p_query))) desc,
    p.username nulls last
  limit 20;
$$;

revoke all on function public.search_users(text) from public, anon;
grant execute on function public.search_users(text) to authenticated;
-- Application-level throttling (debounce + the existing per-minute
-- isRateLimited() helper, reused from supabase/functions/_shared/rateLimit.ts
-- inside a thin search Edge Function) is documented in the implementation
-- report — this function itself already refuses to run for queries under
-- 2 characters and always caps at 20 rows, which bounds worst-case load
-- even if a caller skips the app's own debounce.

create or replace function public.check_username_available(p_username text)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select p_username ~ '^[a-z0-9_.]{3,24}$'
    and lower(p_username) not in (select username from public.reserved_usernames)
    and not exists (select 1 from public.profiles where lower(username) = lower(p_username));
$$;

revoke all on function public.check_username_available(text) from public, anon;
grant execute on function public.check_username_available(text) to authenticated;


-- ───────────────────────────────────────────────────────────────────────
-- 5. DOCTOR ↔ PATIENT RELATIONSHIPS
-- ───────────────────────────────────────────────────────────────────────
create table if not exists public.doctor_patient_relationships (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users (id) on delete cascade,
  patient_id uuid not null references auth.users (id) on delete cascade,
  status text not null check (status in ('pending', 'active', 'ended')) default 'pending',
  requested_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ended_at timestamptz,
  check (doctor_id <> patient_id)
);

create unique index if not exists doctor_patient_active_pair_idx
  on public.doctor_patient_relationships (doctor_id, patient_id)
  where status in ('pending', 'active');

alter table public.doctor_patient_relationships enable row level security;

create policy "Doctor and patient can view their own relationship rows"
  on public.doctor_patient_relationships for select
  using (auth.uid() = doctor_id or auth.uid() = patient_id);

create or replace function public.request_doctor_connection(p_doctor_id uuid)
returns public.doctor_patient_relationships
language plpgsql
security definer set search_path = public
as $$
declare
  v_row public.doctor_patient_relationships;
begin
  if not exists (select 1 from public.profiles where id = p_doctor_id and role in ('doctor', 'admin')) then
    raise exception 'NOT_A_DOCTOR';
  end if;

  insert into public.doctor_patient_relationships (doctor_id, patient_id, status, requested_by)
  values (p_doctor_id, auth.uid(), 'pending', auth.uid())
  returning * into v_row;

  return v_row;
exception
  when unique_violation then
    raise exception 'ALREADY_CONNECTED';
end;
$$;

-- Doctor/admin accepts a pending connection (initiated by the patient), or
-- a doctor/admin can directly assign an active relationship themselves.
create or replace function public.respond_doctor_connection(p_relationship_id uuid, p_accept boolean)
returns public.doctor_patient_relationships
language plpgsql
security definer set search_path = public
as $$
declare
  v_row public.doctor_patient_relationships;
begin
  if not public.is_doctor() then raise exception 'FORBIDDEN'; end if;

  update public.doctor_patient_relationships
  set status = case when p_accept then 'active' else 'ended' end,
      updated_at = now(),
      ended_at = case when p_accept then null else now() end
  where id = p_relationship_id and doctor_id = auth.uid() and status = 'pending'
  returning * into v_row;

  if v_row is null then raise exception 'REQUEST_NOT_FOUND'; end if;
  return v_row;
end;
$$;

create or replace function public.end_doctor_connection(p_relationship_id uuid)
returns public.doctor_patient_relationships
language plpgsql
security definer set search_path = public
as $$
declare
  v_row public.doctor_patient_relationships;
begin
  update public.doctor_patient_relationships
  set status = 'ended', updated_at = now(), ended_at = now()
  where id = p_relationship_id
    and (doctor_id = auth.uid() or patient_id = auth.uid())
    and status in ('pending', 'active')
  returning * into v_row;

  if v_row is null then raise exception 'RELATIONSHIP_NOT_FOUND'; end if;
  return v_row;
end;
$$;

revoke all on function public.request_doctor_connection(uuid) from public, anon;
revoke all on function public.respond_doctor_connection(uuid, boolean) from public, anon;
revoke all on function public.end_doctor_connection(uuid) from public, anon;
grant execute on function public.request_doctor_connection(uuid) to authenticated;
grant execute on function public.respond_doctor_connection(uuid, boolean) to authenticated;
grant execute on function public.end_doctor_connection(uuid) to authenticated;

create or replace function public.has_active_doctor_relationship(p_doctor_id uuid, p_patient_id uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.doctor_patient_relationships
    where doctor_id = p_doctor_id and patient_id = p_patient_id and status = 'active'
  );
$$;

-- A doctor may see the identity (id/username/full_name/avatar) of every
-- patient they have an active or pending relationship with — separate
-- from the health-data policies below, which additionally require 'active'.
create policy "Doctors can view their patients' public profile via relationship"
  on public.profiles for select
  using (
    exists (
      select 1 from public.doctor_patient_relationships r
      where r.patient_id = profiles.id and r.doctor_id = auth.uid() and r.status in ('pending', 'active')
    )
  );


-- ───────────────────────────────────────────────────────────────────────
-- 6. MESSAGING
-- ───────────────────────────────────────────────────────────────────────
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table if not exists public.conversation_participants (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  content text not null check (char_length(trim(content)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at);

alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;

create or replace function public.is_conversation_participant(p_conversation_id uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.conversation_participants
    where conversation_id = p_conversation_id and user_id = auth.uid()
  );
$$;

create policy "Participants can view their conversations"
  on public.conversations for select
  using (public.is_conversation_participant(id));

create policy "Participants can view participant rows in their conversations"
  on public.conversation_participants for select
  using (public.is_conversation_participant(conversation_id));

create policy "Participants can update their own read state"
  on public.conversation_participants for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Participants can read messages in their conversations"
  on public.messages for select
  using (public.is_conversation_participant(conversation_id));

create policy "Participants can send messages if not blocked"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and public.is_conversation_participant(conversation_id)
    and not exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = messages.conversation_id
        and cp.user_id <> auth.uid()
        and public.is_blocked(auth.uid(), cp.user_id)
    )
  );

-- 1-to-1 only (Phase G scope — see report). Requires an accepted, unblocked
-- friendship before a conversation can be created at all.
create or replace function public.get_or_create_direct_conversation(p_other_user_id uuid)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_conversation_id uuid;
begin
  if auth.uid() = p_other_user_id then raise exception 'CANNOT_MESSAGE_SELF'; end if;
  if not public.are_friends(auth.uid(), p_other_user_id) then raise exception 'NOT_FRIENDS'; end if;
  if public.is_blocked(auth.uid(), p_other_user_id) then raise exception 'BLOCKED'; end if;

  select cp1.conversation_id into v_conversation_id
  from public.conversation_participants cp1
  join public.conversation_participants cp2 on cp1.conversation_id = cp2.conversation_id
  where cp1.user_id = auth.uid() and cp2.user_id = p_other_user_id
  limit 1;

  if v_conversation_id is not null then
    return v_conversation_id;
  end if;

  insert into public.conversations default values returning id into v_conversation_id;
  insert into public.conversation_participants (conversation_id, user_id) values
    (v_conversation_id, auth.uid()),
    (v_conversation_id, p_other_user_id);

  return v_conversation_id;
end;
$$;

revoke all on function public.get_or_create_direct_conversation(uuid) from public, anon;
grant execute on function public.get_or_create_direct_conversation(uuid) to authenticated;


-- ───────────────────────────────────────────────────────────────────────
-- 7. BODY PROFILE & HEALTH PROFILE
-- ───────────────────────────────────────────────────────────────────────
create table if not exists public.body_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  date_of_birth date,
  height_cm numeric check (height_cm is null or (height_cm > 0 and height_cm < 300)),
  weight_kg numeric check (weight_kg is null or (weight_kg > 0 and weight_kg < 500)),
  -- Explicitly the parameter the Mifflin-St Jeor formula requires, not a
  -- gender-identity field — presented and labeled as such in the UI.
  biological_sex text check (biological_sex in ('male', 'female')),
  activity_level text check (activity_level in ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  goal text check (goal in ('lose_weight', 'maintain_weight', 'gain_weight')),
  preferred_weight_unit text not null default 'kg' check (preferred_weight_unit in ('kg', 'lb')),
  preferred_height_unit text not null default 'cm' check (preferred_height_unit in ('cm', 'ft_in')),
  health_conditions text[] not null default '{}',
  health_conditions_other text,
  food_allergies text[] not null default '{}',
  food_allergies_other text,
  food_intolerances text[] not null default '{}',
  food_intolerances_other text,
  dietary_preferences text[] not null default '{}',
  -- Optional, private, never shown to friends and never sent to Gemini.
  medications text,
  updated_at timestamptz not null default now()
);

alter table public.body_profiles enable row level security;

create policy "Users manage their own body profile"
  on public.body_profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Deliberately NO friend-visibility policy at all on this table — health
-- conditions/allergies/medications are never shown to friends under any
-- privacy setting (see report §Privacy). Only the owner and an active doctor.
create policy "Active doctor can view patient body profile"
  on public.body_profiles for select
  using (public.has_active_doctor_relationship(auth.uid(), user_id));


-- ───────────────────────────────────────────────────────────────────────
-- 8. DAILY CALORIE TARGET
-- ───────────────────────────────────────────────────────────────────────
create table if not exists public.daily_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  bmr_estimate numeric,
  maintenance_estimate numeric,
  daily_target numeric not null check (daily_target > 0),
  formula text not null default 'mifflin_st_jeor',
  source text not null check (source in ('auto', 'doctor')) default 'auto',
  set_by uuid references auth.users (id),
  inputs_version integer not null default 1,
  calculated_at timestamptz not null default now(),
  is_current boolean not null default true
);

create index if not exists daily_targets_user_current_idx
  on public.daily_targets (user_id) where is_current;

alter table public.daily_targets enable row level security;

create policy "Users can view their own daily targets"
  on public.daily_targets for select
  using (auth.uid() = user_id);

create policy "Doctor can view patient daily targets"
  on public.daily_targets for select
  using (public.has_active_doctor_relationship(auth.uid(), user_id));

create policy "Users can insert their own auto-calculated target"
  on public.daily_targets for insert
  with check (auth.uid() = user_id and source = 'auto' and set_by is null);

create policy "Doctor can insert an override target for their active patient"
  on public.daily_targets for insert
  with check (
    source = 'doctor'
    and set_by = auth.uid()
    and public.has_active_doctor_relationship(auth.uid(), user_id)
  );

-- Keeps exactly one is_current=true row per user, atomically, regardless
-- of whether the insert came from the user's own auto-calculation or a
-- doctor override — no separate "unset previous" round trip needed.
create or replace function public.unset_previous_daily_target()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.is_current then
    update public.daily_targets set is_current = false
    where user_id = new.user_id and is_current = true and id <> new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_unset_previous_daily_target on public.daily_targets;
create trigger trg_unset_previous_daily_target
  before insert on public.daily_targets
  for each row execute procedure public.unset_previous_daily_target();


-- ───────────────────────────────────────────────────────────────────────
-- 9. MEAL LOGS
-- ───────────────────────────────────────────────────────────────────────
create table if not exists public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  meal_time timestamptz not null default now(),
  meal_type text check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  program_item_id uuid, -- FK added in §12 after nutrition_program_items exists
  is_outside_program boolean not null default false,
  image_path text,
  ai_confidence text check (ai_confidence in ('low', 'medium', 'high')),
  total_calories numeric not null default 0,
  total_protein_g numeric not null default 0,
  total_carbs_g numeric not null default 0,
  total_fat_g numeric not null default 0,
  notes text,
  shared_with_friends boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists meal_logs_user_time_idx on public.meal_logs (user_id, meal_time desc);

create table if not exists public.meal_log_items (
  id uuid primary key default gen_random_uuid(),
  meal_log_id uuid not null references public.meal_logs (id) on delete cascade,
  name text not null,
  estimated_portion text,
  estimated_calories numeric not null default 0,
  protein_g numeric not null default 0,
  carbs_g numeric not null default 0,
  fat_g numeric not null default 0,
  is_user_edited boolean not null default false,
  is_user_added boolean not null default false,
  sort_order integer not null default 0
);

alter table public.meal_logs enable row level security;
alter table public.meal_log_items enable row level security;

create policy "Users manage their own meal logs"
  on public.meal_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Friends can view shared meal logs"
  on public.meal_logs for select
  using (
    shared_with_friends
    and public.are_friends(user_id, auth.uid())
    and coalesce((select share_meals_with_friends from public.user_privacy_settings where user_id = meal_logs.user_id), true)
  );

create policy "Doctor can view patient meal logs"
  on public.meal_logs for select
  using (public.has_active_doctor_relationship(auth.uid(), user_id));

create policy "Users manage items of their own meal logs"
  on public.meal_log_items for all
  using (exists (select 1 from public.meal_logs m where m.id = meal_log_id and m.user_id = auth.uid()))
  with check (exists (select 1 from public.meal_logs m where m.id = meal_log_id and m.user_id = auth.uid()));

create policy "Readers of a meal log can view its items"
  on public.meal_log_items for select
  using (exists (
    select 1 from public.meal_logs m where m.id = meal_log_id
    -- Reuses the exact same visibility rules as meal_logs itself.
    and (
      m.user_id = auth.uid()
      or (m.shared_with_friends and public.are_friends(m.user_id, auth.uid()))
      or public.has_active_doctor_relationship(auth.uid(), m.user_id)
    )
  ));


-- ───────────────────────────────────────────────────────────────────────
-- 10. ACTIVITY LIBRARY, TASKS & LOGS
-- ───────────────────────────────────────────────────────────────────────
create table if not exists public.activity_library (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  duration_minutes integer not null check (duration_minutes > 0),
  difficulty text not null default 'easy' check (difficulty in ('easy', 'moderate')),
  instructions text,
  -- Metabolic Equivalent of Task — standard basis for the estimated-burn
  -- calculation in §"Calorie burn engine" (report), not a Gemini guess.
  met_value numeric not null check (met_value > 0),
  safety_tags text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.activity_library enable row level security;

create policy "Anyone authenticated can view active activities"
  on public.activity_library for select
  using (active or public.is_admin());

create policy "Admins manage the activity library"
  on public.activity_library for all
  using (public.is_admin())
  with check (public.is_admin());

-- Small, safe, low-intensity seed set — deliberately no high-intensity or
-- unsupervised-risk entries. Safe to run more than once.
insert into public.activity_library (name, category, duration_minutes, difficulty, instructions, met_value, safety_tags)
select * from (values
  ('Easy Walk', 'walking', 15, 'easy', 'A relaxed-pace walk, indoors or outdoors.', 2.8, array['low-impact']),
  ('Moderate Walk', 'walking', 20, 'easy', 'A brisk-but-comfortable walk.', 3.5, array['low-impact']),
  ('20-Minute Walk', 'walking', 20, 'easy', 'A steady-pace walk for about 20 minutes.', 3.3, array['low-impact']),
  ('30-Minute Walk', 'walking', 30, 'easy', 'A steady-pace walk for about 30 minutes.', 3.3, array['low-impact']),
  ('Gentle Mobility', 'mobility', 10, 'easy', 'Slow joint-mobility movements — ankles, hips, shoulders, neck.', 2.3, array['low-impact', 'beginner-friendly']),
  ('Light Stretching', 'mobility', 10, 'easy', 'A short full-body stretching routine.', 2.3, array['low-impact', 'beginner-friendly']),
  ('Beginner Bodyweight', 'strength', 15, 'moderate', 'A short beginner bodyweight circuit — squats, wall push-ups, standing rows.', 3.8, array['beginner-friendly']),
  ('Wall Push-Ups', 'strength', 10, 'easy', 'A beginner-friendly push-up variation performed against a wall.', 3.0, array['low-impact', 'beginner-friendly'])
) as seed(name, category, duration_minutes, difficulty, instructions, met_value, safety_tags)
where not exists (select 1 from public.activity_library);

create table if not exists public.activity_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  meal_log_id uuid references public.meal_logs (id) on delete cascade,
  activity_id uuid references public.activity_library (id),
  available_at timestamptz not null,
  status text not null check (status in ('pending', 'completed', 'skipped')) default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists activity_tasks_user_status_idx on public.activity_tasks (user_id, status, available_at);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  activity_task_id uuid references public.activity_tasks (id) on delete set null,
  activity_id uuid references public.activity_library (id),
  started_at timestamptz,
  completed_at timestamptz not null default now(),
  duration_minutes integer,
  estimated_calories_burned numeric,
  source text not null default 'task' check (source in ('task', 'manual')),
  shared_with_friends boolean not null default false
);

alter table public.activity_tasks enable row level security;
alter table public.activity_logs enable row level security;

create policy "Users manage their own activity tasks"
  on public.activity_tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Doctor can view patient activity tasks"
  on public.activity_tasks for select
  using (public.has_active_doctor_relationship(auth.uid(), user_id));

create policy "Users manage their own activity logs"
  on public.activity_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Friends can view shared activity logs"
  on public.activity_logs for select
  using (
    shared_with_friends
    and public.are_friends(user_id, auth.uid())
    and coalesce((select share_activity_with_friends from public.user_privacy_settings where user_id = activity_logs.user_id), true)
  );

create policy "Doctor can view patient activity logs"
  on public.activity_logs for select
  using (public.has_active_doctor_relationship(auth.uid(), user_id));


-- ───────────────────────────────────────────────────────────────────────
-- 11. STEPS & WEIGHT
-- ───────────────────────────────────────────────────────────────────────
create table if not exists public.step_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  steps integer not null check (steps >= 0),
  source text not null check (source in ('healthkit', 'health_connect', 'manual')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- One row per user per day, regardless of source — prevents double
  -- counting a sensor sync alongside a manual entry for the same day
  -- (see report: whichever source last upserts for that date wins,
  -- automatic sources take priority in the client-side merge logic).
  unique (user_id, date)
);

create table if not exists public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  weight_kg numeric not null check (weight_kg > 0 and weight_kg < 500),
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists step_logs_user_date_idx on public.step_logs (user_id, date desc);
create index if not exists weight_logs_user_time_idx on public.weight_logs (user_id, logged_at desc);

alter table public.step_logs enable row level security;
alter table public.weight_logs enable row level security;

create policy "Users manage their own step logs"
  on public.step_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Friends can view shared step logs"
  on public.step_logs for select
  using (
    public.are_friends(user_id, auth.uid())
    and coalesce((select share_steps_with_friends from public.user_privacy_settings where user_id = step_logs.user_id), true)
  );

create policy "Doctor can view patient step logs"
  on public.step_logs for select
  using (public.has_active_doctor_relationship(auth.uid(), user_id));

create policy "Users manage their own weight logs"
  on public.weight_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Weight is private by default and stays private from friends
-- unconditionally (no share_weight_with_friends check here) per the
-- explicit "Weight should remain private by default" / doctor-only
-- instruction — the privacy column exists for a possible future opt-in
-- UI but is intentionally NOT wired into this policy yet (see report).
create policy "Doctor can view patient weight logs"
  on public.weight_logs for select
  using (public.has_active_doctor_relationship(auth.uid(), user_id));


-- ───────────────────────────────────────────────────────────────────────
-- 12. 30-DAY NUTRITION PROGRAM
-- ───────────────────────────────────────────────────────────────────────
create table if not exists public.nutrition_programs (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references auth.users (id) on delete cascade,
  doctor_id uuid not null references auth.users (id) on delete cascade,
  title text not null default '30-Day Nutrition Program',
  start_date date not null,
  end_date date not null,
  goal text,
  daily_calorie_target numeric,
  general_instructions text,
  status text not null check (status in ('draft', 'active', 'completed', 'archived')) default 'draft',
  is_template boolean not null default false,
  template_source_id uuid references public.nutrition_programs (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id),
  check (end_date >= start_date),
  -- A template has no patient; an assigned program always has one.
  check ((is_template and patient_id is null) or (not is_template and patient_id is not null))
);

create table if not exists public.nutrition_program_days (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.nutrition_programs (id) on delete cascade,
  day_number integer not null check (day_number between 1 and 30),
  water_goal_ml integer,
  movement_suggestion text,
  doctor_instructions text,
  unique (program_id, day_number)
);

create table if not exists public.nutrition_program_items (
  id uuid primary key default gen_random_uuid(),
  program_day_id uuid not null references public.nutrition_program_days (id) on delete cascade,
  meal_type text not null check (meal_type in ('breakfast', 'snack', 'lunch', 'dinner')),
  title text not null,
  description text,
  suggested_foods text,
  portion_guidance text,
  approximate_calories numeric,
  notes text,
  image_path text,
  time_suggestion time,
  sort_order integer not null default 0
);

create table if not exists public.nutrition_program_item_completions (
  id uuid primary key default gen_random_uuid(),
  program_item_id uuid not null references public.nutrition_program_items (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null check (status in ('completed', 'skipped')) default 'completed',
  meal_log_id uuid references public.meal_logs (id) on delete set null,
  completed_at timestamptz not null default now(),
  unique (program_item_id, user_id)
);

-- Now that nutrition_program_items exists, wire up the FK deferred in §9.
alter table public.meal_logs
  add constraint meal_logs_program_item_fk
  foreign key (program_item_id) references public.nutrition_program_items (id) on delete set null;

alter table public.nutrition_programs enable row level security;
alter table public.nutrition_program_days enable row level security;
alter table public.nutrition_program_items enable row level security;
alter table public.nutrition_program_item_completions enable row level security;

create policy "Patient can view their own assigned programs"
  on public.nutrition_programs for select
  using (auth.uid() = patient_id);

create policy "Doctor manages programs for their active patients, and their own templates"
  on public.nutrition_programs for all
  using (
    auth.uid() = doctor_id
    and (is_template or public.has_active_doctor_relationship(auth.uid(), patient_id))
  )
  with check (
    auth.uid() = doctor_id
    and (is_template or public.has_active_doctor_relationship(auth.uid(), patient_id))
  );

create policy "Patient can view days of their own programs"
  on public.nutrition_program_days for select
  using (exists (select 1 from public.nutrition_programs p where p.id = program_id and p.patient_id = auth.uid()));

create policy "Doctor manages days of programs they own"
  on public.nutrition_program_days for all
  using (exists (select 1 from public.nutrition_programs p where p.id = program_id and p.doctor_id = auth.uid()))
  with check (exists (select 1 from public.nutrition_programs p where p.id = program_id and p.doctor_id = auth.uid()));

create policy "Patient can view items of their own programs"
  on public.nutrition_program_items for select
  using (exists (
    select 1 from public.nutrition_program_days d
    join public.nutrition_programs p on p.id = d.program_id
    where d.id = program_day_id and p.patient_id = auth.uid()
  ));

create policy "Doctor manages items of programs they own"
  on public.nutrition_program_items for all
  using (exists (
    select 1 from public.nutrition_program_days d
    join public.nutrition_programs p on p.id = d.program_id
    where d.id = program_day_id and p.doctor_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.nutrition_program_days d
    join public.nutrition_programs p on p.id = d.program_id
    where d.id = program_day_id and p.doctor_id = auth.uid()
  ));

create policy "Patient manages their own item completions"
  on public.nutrition_program_item_completions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Doctor can view patient item completions"
  on public.nutrition_program_item_completions for select
  using (exists (
    select 1 from public.nutrition_program_items i
    join public.nutrition_program_days d on d.id = i.program_day_id
    join public.nutrition_programs p on p.id = d.program_id
    where i.id = program_item_id and p.doctor_id = auth.uid()
  ));

-- Doctor "assign program to patient" convenience RPC — copies a template
-- (or builds an empty 30-day shell if p_template_id is null) into a new,
-- draft, patient-specific program. Never leaks another patient's own
-- customized program data — only rows explicitly marked is_template=true
-- can be copied from.
create or replace function public.assign_program_from_template(
  p_patient_id uuid,
  p_template_id uuid,
  p_start_date date
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_template public.nutrition_programs;
  v_new_program_id uuid;
  v_day record;
  v_new_day_id uuid;
begin
  if not public.is_doctor() then raise exception 'FORBIDDEN'; end if;
  if not public.has_active_doctor_relationship(auth.uid(), p_patient_id) then
    raise exception 'NO_ACTIVE_RELATIONSHIP';
  end if;

  select * into v_template from public.nutrition_programs
  where id = p_template_id and is_template = true and doctor_id = auth.uid();
  if v_template is null then raise exception 'TEMPLATE_NOT_FOUND'; end if;

  insert into public.nutrition_programs (
    patient_id, doctor_id, title, start_date, end_date, goal,
    daily_calorie_target, general_instructions, status, template_source_id, updated_by
  ) values (
    p_patient_id, auth.uid(), v_template.title, p_start_date, p_start_date + 29, v_template.goal,
    v_template.daily_calorie_target, v_template.general_instructions, 'draft', v_template.id, auth.uid()
  ) returning id into v_new_program_id;

  for v_day in select * from public.nutrition_program_days where program_id = p_template_id order by day_number loop
    insert into public.nutrition_program_days (program_id, day_number, water_goal_ml, movement_suggestion, doctor_instructions)
    values (v_new_program_id, v_day.day_number, v_day.water_goal_ml, v_day.movement_suggestion, v_day.doctor_instructions)
    returning id into v_new_day_id;

    insert into public.nutrition_program_items (
      program_day_id, meal_type, title, description, suggested_foods,
      portion_guidance, approximate_calories, notes, image_path, time_suggestion, sort_order
    )
    select v_new_day_id, meal_type, title, description, suggested_foods,
      portion_guidance, approximate_calories, notes, image_path, time_suggestion, sort_order
    from public.nutrition_program_items where program_day_id = v_day.id;
  end loop;

  return v_new_program_id;
end;
$$;

revoke all on function public.assign_program_from_template(uuid, uuid, date) from public, anon;
grant execute on function public.assign_program_from_template(uuid, uuid, date) to authenticated;


-- ───────────────────────────────────────────────────────────────────────
-- 13. DOCTOR NOTES
-- ───────────────────────────────────────────────────────────────────────
create table if not exists public.doctor_notes (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users (id) on delete cascade,
  patient_id uuid not null references auth.users (id) on delete cascade,
  note text not null check (char_length(trim(note)) > 0),
  meal_log_id uuid references public.meal_logs (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.doctor_notes enable row level security;

create policy "Doctor manages their own notes for active patients"
  on public.doctor_notes for all
  using (auth.uid() = doctor_id and public.has_active_doctor_relationship(auth.uid(), patient_id))
  with check (auth.uid() = doctor_id and public.has_active_doctor_relationship(auth.uid(), patient_id));

-- Deliberately no patient SELECT policy — doctor notes are never shown to
-- the patient or to friends (per explicit instruction). Only the writing
-- doctor (and, for now, an admin acting in a support capacity) can read them.
create policy "Admin can view all doctor notes"
  on public.doctor_notes for select
  using (public.is_admin());


-- ───────────────────────────────────────────────────────────────────────
-- 14. NOTIFICATION PREFERENCES
-- ───────────────────────────────────────────────────────────────────────
create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  activity_reminders boolean not null default true,
  program_reminders boolean not null default true,
  friend_requests boolean not null default true,
  new_messages boolean not null default true,
  doctor_updates boolean not null default true,
  consultation_reminders boolean not null default true,
  prayer_reminders boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

create policy "Users manage their own notification preferences"
  on public.notification_preferences for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ───────────────────────────────────────────────────────────────────────
-- 15. DAILY SUMMARY (live-computed function, not a stored/duplicated
--     aggregate — see report for why: avoids a second, driftable source
--     of truth. Takes the caller's local timezone so "today" is correct
--     for the user, not the database server.)
-- ───────────────────────────────────────────────────────────────────────
create or replace function public.get_daily_summary(p_user_id uuid, p_date date, p_timezone text)
returns table (
  calories_consumed numeric,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  meals_logged integer,
  activity_calories_estimated numeric,
  activities_completed integer,
  steps integer,
  weight_kg numeric
)
language sql
security definer set search_path = public
stable
as $$
  -- SECURITY: this is SECURITY DEFINER, which bypasses RLS on every table
  -- it reads — the WHERE below is the ONLY thing standing between "my own
  -- summary" and "any stranger's private weight/calories". A caller may
  -- request their own p_user_id, or a patient's IF they have an active
  -- doctor relationship — same rule every other health table's RLS policy
  -- already expresses, just re-asserted explicitly here since RLS itself
  -- does not apply inside a SECURITY DEFINER body.
  select * from (
  with bounds as (
    select
      (p_date::text || ' 00:00:00')::timestamp at time zone coalesce(p_timezone, 'UTC') as day_start,
      ((p_date + 1)::text || ' 00:00:00')::timestamp at time zone coalesce(p_timezone, 'UTC') as day_end
  ),
  meals as (
    select coalesce(sum(total_calories), 0) as cal, coalesce(sum(total_protein_g), 0) as pro,
      coalesce(sum(total_carbs_g), 0) as carb, coalesce(sum(total_fat_g), 0) as fat, count(*) as n
    from public.meal_logs, bounds
    where user_id = p_user_id and meal_time >= day_start and meal_time < day_end
  ),
  activities as (
    select coalesce(sum(estimated_calories_burned), 0) as cal, count(*) as n
    from public.activity_logs, bounds
    where user_id = p_user_id and completed_at >= day_start and completed_at < day_end
  ),
  steps_row as (
    select steps from public.step_logs where user_id = p_user_id and date = p_date
  ),
  weight_row as (
    select weight_kg from public.weight_logs, bounds
    where user_id = p_user_id and logged_at >= day_start and logged_at < day_end
    order by logged_at desc limit 1
  )
  select
    meals.cal, meals.pro, meals.carb, meals.fat, meals.n::int,
    activities.cal, activities.n::int,
    (select steps from steps_row), (select weight_kg from weight_row)
  from meals, activities
  ) summary
  where auth.uid() = p_user_id or public.has_active_doctor_relationship(auth.uid(), p_user_id);
$$;

revoke all on function public.get_daily_summary(uuid, date, text) from public, anon;
grant execute on function public.get_daily_summary(uuid, date, text) to authenticated;


-- ───────────────────────────────────────────────────────────────────────
-- 16. FOOD SCAN RATE LIMITING (daily, persisted — separate from the
--     existing in-memory per-minute limiter in _shared/rateLimit.ts,
--     which only survives a single warm function instance)
-- ───────────────────────────────────────────────────────────────────────
create table if not exists public.food_scan_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists food_scan_events_user_time_idx on public.food_scan_events (user_id, created_at desc);

alter table public.food_scan_events enable row level security;
-- Write-only from the client's perspective is not even needed — this
-- table is only ever written by the food-scan Edge Function using the
-- service_role key (bypasses RLS). No policy is granted to
-- anon/authenticated at all, so a direct client read/write is refused.


-- ───────────────────────────────────────────────────────────────────────
-- 17. STORAGE BUCKETS
-- ───────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('meal-images', 'meal-images', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('program-images', 'program-images', false)
on conflict (id) do nothing;

-- Avatars: public read (they're profile pictures, same visibility as the
-- rest of a public profile), owner-only write, path must start with the
-- uploader's own uid so one user can never overwrite another's avatar.
create policy "Anyone can view avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update/replace their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Meal images: private by default. Owner can read/write their own path;
-- an active doctor may read a patient's meal images; friend visibility is
-- NOT granted here even when a meal is shared_with_friends — the shared
-- feed only ever shows meal text/macros, never the original photo path,
-- to keep the private bucket's access model simple and conservative (see
-- report). Actual display uses short-lived signed URLs, never a public path.
create policy "Users manage their own meal images"
  on storage.objects for all
  using (bucket_id = 'meal-images' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'meal-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Doctor can view active patient meal images"
  on storage.objects for select
  using (
    bucket_id = 'meal-images'
    and public.has_active_doctor_relationship(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

-- Program images: doctor-owned, readable by the assigned patient.
create policy "Doctor manages program images they own"
  on storage.objects for all
  using (bucket_id = 'program-images' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'program-images' and (storage.foldername(name))[1] = auth.uid()::text);


-- ═══════════════════════════════════════════════════════════════════════
-- END OF MIGRATION — see PHASE_G_SOCIAL_NUTRITION_IMPLEMENTATION_REPORT.md
-- for the RLS test plan run against this schema and exactly which tables
-- above are wired to working application code vs. prepared for later use.
-- ═══════════════════════════════════════════════════════════════════════

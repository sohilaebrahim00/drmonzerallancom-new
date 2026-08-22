-- ═══════════════════════════════════════════════════════════════════════
-- PHASE H — Daily Nutrition Companion
-- Incremental migration. Extends supabase/schema.sql AND
-- supabase/PHASE_G_SOCIAL_NUTRITION_MIGRATION.sql — does NOT replace either.
-- Apply this file AFTER Phase G has been applied (it references Phase G
-- tables/functions: profiles.role, are_friends(), is_blocked(),
-- has_active_doctor_relationship(), user_privacy_settings, friendships).
--
-- SAFETY:
--   * Every statement is additive (create table/column/policy if not
--     exists, or create-or-replace for functions). Nothing here drops a
--     table, drops a column, or deletes data.
--   * NOT executed automatically by any code in this repo. Review this
--     file, then run it once yourself (Supabase SQL Editor or
--     `supabase db push`).
--
-- READ FIRST: PHASE_H_DAILY_NUTRITION_COMPANION_REPORT.md documents
-- exactly which parts of this file are wired up to working application
-- code today vs. schema prepared for later use.
-- ═══════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────────
-- 1. MACRO TARGETS (extends daily_targets from Phase G §8 — additive
--    columns only, nullable, so an existing row with no macro breakdown
--    still reads correctly; the UI shows macros only when non-null, per
--    the explicit "never invent macro targets" instruction).
-- ───────────────────────────────────────────────────────────────────────
alter table public.daily_targets add column if not exists protein_target_g numeric check (protein_target_g is null or protein_target_g > 0);
alter table public.daily_targets add column if not exists carbs_target_g numeric check (carbs_target_g is null or carbs_target_g > 0);
alter table public.daily_targets add column if not exists fat_target_g numeric check (fat_target_g is null or fat_target_g > 0);


-- ───────────────────────────────────────────────────────────────────────
-- 2. HYDRATION
-- ───────────────────────────────────────────────────────────────────────
create table if not exists public.hydration_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount_ml integer not null check (amount_ml > 0 and amount_ml <= 5000),
  logged_at timestamptz not null default now()
);

create index if not exists hydration_logs_user_time_idx on public.hydration_logs (user_id, logged_at desc);

alter table public.hydration_logs enable row level security;

create policy "Users manage their own hydration logs"
  on public.hydration_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Doctor can view patient hydration logs"
  on public.hydration_logs for select
  using (public.has_active_doctor_relationship(auth.uid(), user_id));

-- Goal precedence: doctor-set > user manual > app default (2000ml,
-- applied client-side, never written as a row here — matching "do not
-- impose a default goal unless configured").
create table if not exists public.hydration_goals (
  user_id uuid primary key references auth.users (id) on delete cascade,
  goal_ml integer not null check (goal_ml > 0 and goal_ml <= 8000),
  source text not null check (source in ('user', 'doctor')) default 'user',
  set_by uuid references auth.users (id),
  updated_at timestamptz not null default now()
);

alter table public.hydration_goals enable row level security;

create policy "Users can view their own hydration goal"
  on public.hydration_goals for select
  using (auth.uid() = user_id);

create policy "Users can set their own hydration goal"
  on public.hydration_goals for insert
  with check (auth.uid() = user_id and source = 'user' and set_by is null);

create policy "Users can update their own user-set hydration goal"
  on public.hydration_goals for update
  using (auth.uid() = user_id and source = 'user')
  with check (auth.uid() = user_id and source = 'user');

create policy "Doctor can set a patient's hydration goal"
  on public.hydration_goals for insert
  with check (
    source = 'doctor' and set_by = auth.uid()
    and public.has_active_doctor_relationship(auth.uid(), user_id)
  );

create policy "Doctor can update a patient's doctor-set hydration goal"
  on public.hydration_goals for update
  using (source = 'doctor' and public.has_active_doctor_relationship(auth.uid(), user_id))
  with check (source = 'doctor' and set_by = auth.uid());

create policy "Doctor can view patient hydration goal"
  on public.hydration_goals for select
  using (public.has_active_doctor_relationship(auth.uid(), user_id));


-- ───────────────────────────────────────────────────────────────────────
-- 3. DAILY CHECK-IN (private by default — see Phase H report §32;
--    same visibility model as body_profiles: owner + active doctor only,
--    never friends, no diagnosis derived from it anywhere in this file).
-- ───────────────────────────────────────────────────────────────────────
create table if not exists public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  checkin_date date not null,
  energy text check (energy in ('low', 'normal', 'good')),
  hunger text check (hunger in ('low', 'normal', 'high')),
  mood text check (mood in ('low', 'neutral', 'good')),
  note text check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now(),
  unique (user_id, checkin_date)
);

alter table public.daily_checkins enable row level security;

create policy "Users manage their own daily check-ins"
  on public.daily_checkins for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Doctor can view patient daily check-ins"
  on public.daily_checkins for select
  using (public.has_active_doctor_relationship(auth.uid(), user_id));


-- ───────────────────────────────────────────────────────────────────────
-- 4. FAVORITE MEALS & CUSTOM MEALS (§21-23 — reduces repeat Gemini calls;
--    a favorite just snapshots a reusable item list, the same shape
--    meal_log_items already uses, so "Log Again" on a favorite reuses the
--    exact same saveMealLog() insert path as a regular meal).
-- ───────────────────────────────────────────────────────────────────────
create table if not exists public.food_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  meal_type text check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  items jsonb not null,
  total_calories numeric not null default 0,
  total_protein_g numeric not null default 0,
  total_carbs_g numeric not null default 0,
  total_fat_g numeric not null default 0,
  image_path text,
  created_at timestamptz not null default now()
);

create index if not exists food_favorites_user_idx on public.food_favorites (user_id, created_at desc);

alter table public.food_favorites enable row level security;

create policy "Users manage their own food favorites"
  on public.food_favorites for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Custom meals are conceptually the same shape as a favorite (a
-- user-authored reusable meal) — kept as a distinct table only because a
-- custom meal is authored from scratch (§23 fields: name, ingredients,
-- serving, calories, macros) rather than saved from a past scan, so the
-- UI/creation flow differs even though storage is identical. A custom meal
-- can also be added to favorites (food_favorites references it optionally).
create table if not exists public.custom_meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  ingredients text,
  serving_description text,
  calories numeric not null check (calories >= 0),
  protein_g numeric not null default 0,
  carbs_g numeric not null default 0,
  fat_g numeric not null default 0,
  image_path text,
  created_at timestamptz not null default now()
);

create index if not exists custom_meals_user_idx on public.custom_meals (user_id, created_at desc);

alter table public.custom_meals enable row level security;

create policy "Users manage their own custom meals"
  on public.custom_meals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ───────────────────────────────────────────────────────────────────────
-- 5. IN-APP NOTIFICATIONS (a real backing store — Phase G's Notification
--    Center screen currently aggregates from existing tables live with no
--    table of its own; this adds one for event types that have no natural
--    source row to aggregate from, e.g. "Doctor Program Updated", and lets
--    read/unread state persist. Existing aggregation (friend requests,
--    unread messages, ready activity tasks) is untouched — this is additive.)
-- ───────────────────────────────────────────────────────────────────────
create table if not exists public.in_app_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in (
    'movement_ready', 'friend_request', 'new_message', 'program_updated',
    'doctor_note', 'consultation', 'prayer', 'system'
  )),
  title text not null,
  body text,
  link_path text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists in_app_notifications_user_idx on public.in_app_notifications (user_id, created_at desc);

alter table public.in_app_notifications enable row level security;

create policy "Users manage their own in-app notifications"
  on public.in_app_notifications for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Extend Phase G's notification_preferences with the per-type toggles §45
-- introduces beyond what Phase G already shipped (activity_reminders,
-- program_reminders, friend_requests, new_messages, doctor_updates,
-- consultation_reminders, prayer_reminders already exist — only water is new).
alter table public.notification_preferences add column if not exists water_reminders boolean not null default false;
alter table public.notification_preferences add column if not exists daily_checkin_reminders boolean not null default false;


-- ───────────────────────────────────────────────────────────────────────
-- 6. PROGRAM MEAL REMINDER TIMES (§90 — optional, doctor/user configurable,
--    per program day so a doctor's meal-time guidance can drive it later;
--    purely data, no scheduling engine here — see report for what's wired.)
-- ───────────────────────────────────────────────────────────────────────
alter table public.nutrition_program_items add column if not exists reminder_enabled boolean not null default false;


-- ───────────────────────────────────────────────────────────────────────
-- 6b. UNBLOCK (Phase G's block_user() had no inverse — cancel_or_remove_
--     friendship() deliberately only covers 'pending'/'accepted' status,
--     so a blocked row could never be removed by the blocker before now.)
-- ───────────────────────────────────────────────────────────────────────
create or replace function public.unblock_user(p_target_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  delete from public.friendships
  where least(requester_id::text, addressee_id::text) || ':' || greatest(requester_id::text, addressee_id::text)
      = least(auth.uid()::text, p_target_id::text) || ':' || greatest(auth.uid()::text, p_target_id::text)
    and status = 'blocked'
    -- Only the party who placed the block may lift it.
    and blocked_by = auth.uid();
end;
$$;

revoke all on function public.unblock_user(uuid) from public, anon;
grant execute on function public.unblock_user(uuid) to authenticated;


-- ───────────────────────────────────────────────────────────────────────
-- 7. USER REPORTS (§73 — simple, not a moderation system; admin-readable only)
-- ───────────────────────────────────────────────────────────────────────
create table if not exists public.user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reported_user_id uuid not null references auth.users (id) on delete cascade,
  reason text not null check (reason in ('spam', 'harassment', 'other')),
  details text check (details is null or char_length(details) <= 1000),
  created_at timestamptz not null default now(),
  check (reporter_id <> reported_user_id)
);

alter table public.user_reports enable row level security;

create policy "Users can view reports they filed"
  on public.user_reports for select
  using (auth.uid() = reporter_id);

create policy "Users can file a report"
  on public.user_reports for insert
  with check (auth.uid() = reporter_id);

-- Deliberately no update/delete policy for reporters — a filed report is
-- immutable from the client, same spirit as doctor_notes being
-- write-once-per-author. Admin review is manual (Supabase dashboard),
-- matching the explicit "do not build a huge moderation system" instruction.
create policy "Admin can view all reports"
  on public.user_reports for select
  using (public.is_admin());


-- ───────────────────────────────────────────────────────────────────────
-- 8. PROGRESS PHOTOS (§130 — private by default, doctor visibility is an
--    explicit per-photo opt-in column, never friends under any setting.)
-- ───────────────────────────────────────────────────────────────────────
create table if not exists public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  image_path text not null,
  taken_at timestamptz not null default now(),
  shared_with_doctor boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists progress_photos_user_idx on public.progress_photos (user_id, taken_at desc);

alter table public.progress_photos enable row level security;

create policy "Users manage their own progress photos"
  on public.progress_photos for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Doctor can view patient progress photos explicitly shared"
  on public.progress_photos for select
  using (
    shared_with_doctor
    and public.has_active_doctor_relationship(auth.uid(), user_id)
  );

insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false)
on conflict (id) do nothing;

create policy "Users manage their own progress photo files"
  on storage.objects for all
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Doctor can view shared progress photo files"
  on storage.objects for select
  using (
    bucket_id = 'progress-photos'
    and exists (
      select 1 from public.progress_photos pp
      where pp.image_path = storage.objects.name
        and pp.shared_with_doctor
        and public.has_active_doctor_relationship(auth.uid(), pp.user_id)
    )
  );


-- ───────────────────────────────────────────────────────────────────────
-- 9. DOCTOR "NEEDS REVIEW" HELPER (§84 — operational reminders, explicitly
--    NOT medical alerts; a read-only view a doctor's own RLS-scoped query
--    can filter, not a new privileged function, so it inherits exactly the
--    same has_active_doctor_relationship() gate every other doctor query does.)
-- ───────────────────────────────────────────────────────────────────────
create or replace view public.doctor_patient_activity_summary as
select
  r.doctor_id,
  r.patient_id,
  (select max(meal_time) from public.meal_logs where user_id = r.patient_id) as last_meal_at,
  (select max(logged_at) from public.weight_logs where user_id = r.patient_id) as last_weight_at,
  (select max(created_at) from public.messages m
     join public.conversation_participants cp on cp.conversation_id = m.conversation_id
     where cp.user_id = r.doctor_id and m.sender_id = r.patient_id) as last_patient_message_at
from public.doctor_patient_relationships r
where r.status = 'active';

-- WRONG AS WRITTEN — corrected in PHASE_J_FIXES_MIGRATION.sql (J.1): without
-- `with (security_invoker = true)` this view runs with its OWNER's rights and
-- the underlying tables' RLS never applies, so the grant below exposed the
-- whole doctor/patient roster to every signed-in user. Apply PHASE_J.
grant select on public.doctor_patient_activity_summary to authenticated;


-- ═══════════════════════════════════════════════════════════════════════
-- END OF MIGRATION — see PHASE_H_DAILY_NUTRITION_COMPANION_REPORT.md for
-- the RLS test plan run against this schema and exactly which tables above
-- are wired to working application code vs. prepared for later use.
-- ═══════════════════════════════════════════════════════════════════════

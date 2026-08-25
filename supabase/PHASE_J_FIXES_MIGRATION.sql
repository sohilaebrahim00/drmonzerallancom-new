-- ═══════════════════════════════════════════════════════════════════════
-- PHASE J — CORRECTIVE MIGRATION (security fixes from FIX_PLAN.md Phase 1)
--
-- Why this file exists instead of edits to the earlier migration files:
-- every object corrected below ALREADY EXISTS on the linked live project
-- (ref nkvycfmxabtwmoirrjxv), confirmed before writing a line of SQL.
-- Editing an already-applied migration in place would change nothing on the
-- live database, so the corrections live here instead.
--
-- Live state as verified on 2026-08-22 via `supabase db query --linked`:
--
--   J.1  public.doctor_patient_activity_summary — EXISTS, and pg_class
--        .reloptions already reads 'security_invoker=true'. The live view is
--        therefore ahead of PHASE_H's file, which never set it. J.1 below is
--        a NO-OP against the database as it stands today; it exists so the
--        repository can reproduce that state instead of silently depending
--        on an out-of-band fix nobody recorded.
--   J.2  public.block_user — EXISTS and is STILL VULNERABLE.
--        pg_get_functiondef shows the unconditional
--        `delete from public.friendships where pair_key = v_pair;`.
--        J.2 is a real correction.
--   J.3  public.profiles — the `authenticated` role holds table-wide SELECT
--        (information_schema.role_table_grants), i.e. every column including
--        is_admin. J.3 is a real correction.
--
-- Also observed while verifying, and deliberately NOT changed here because
-- it is outside FIX_PLAN.md Phase 1: `authenticated` has no UPDATE privilege
-- on public.profiles at all (only postgres and service_role do), so
-- profileService's own-row updates cannot be succeeding against this project
-- today. That is a pre-existing defect, unrelated to J.3 — J.3 touches only
-- SELECT — but do not mistake it for a regression introduced by this file.
--
-- EVERY STATEMENT IN THIS FILE IS IDEMPOTENT AND SAFE TO RE-RUN.
--
-- Apply with: supabase db execute -f supabase/PHASE_J_FIXES_MIGRATION.sql
-- (or paste into the SQL Editor). Run it AFTER PHASE_G, PHASE_H and PHASE_I.
-- ═══════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────────
-- J.1 — doctor_patient_activity_summary must run with INVOKER rights
--       (FIX_PLAN.md 1.1)
--
-- As created in PHASE_H the view had no `security_invoker`, so Postgres
-- ran it with the OWNER's rights (postgres) and the row-level security on
-- meal_logs / weight_logs / messages / doctor_patient_relationships never
-- applied at all. The view is granted to `authenticated`, so any signed-in
-- user could read the entire doctor↔patient roster plus each patient's
-- last meal / weight / message timestamp.
--
-- The query body below is byte-for-byte the one in
-- PHASE_H_DAILY_NUTRITION_COMPANION_MIGRATION.sql:350-359 — only the
-- `with (security_invoker = true)` clause is new.
--
-- NOTE: the live view already carries security_invoker=true (see the header),
-- so running this changes nothing there. It matters for any environment
-- rebuilt from these files, and it stops a future `create or replace` copied
-- from PHASE_H from silently dropping the clause again.
-- ───────────────────────────────────────────────────────────────────────
create or replace view public.doctor_patient_activity_summary
  with (security_invoker = true) as
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

-- `create or replace view` preserves existing grants, but re-stating it
-- keeps this file runnable against a database where the view was dropped.
grant select on public.doctor_patient_activity_summary to authenticated;

comment on view public.doctor_patient_activity_summary is
  'security_invoker = true — the caller''s own RLS on doctor_patient_relationships, meal_logs, weight_logs and messages is what scopes these rows. Never drop that clause: without it the view runs as its owner and RLS does not apply.';


-- ───────────────────────────────────────────────────────────────────────
-- J.2 — block_user() must not let a blocked user erase the block on them
--       (FIX_PLAN.md 1.2)
--
-- As created in PHASE_G, block_user() ran an unconditional
-- `delete from public.friendships where pair_key = v_pair`. Because the
-- function is SECURITY DEFINER, B could wipe the row recording A's block
-- of B, insert their own block row in its place, and then call
-- unblock_user() (which does check `blocked_by = auth.uid()`) to remove it
-- entirely — leaving A's block list silently empty.
--
-- The guard below returns the OTHER party's existing row unchanged. It
-- deliberately does not raise a distinct error: a caller must not be able
-- to tell "I blocked them" apart from "they blocked me".
-- ───────────────────────────────────────────────────────────────────────
create or replace function public.block_user(p_target_id uuid)
returns public.friendships
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.friendships;
  v_pair text;
begin
  if auth.uid() = p_target_id then raise exception 'CANNOT_BLOCK_SELF'; end if;
  v_pair := least(auth.uid()::text, p_target_id::text) || ':' || greatest(auth.uid()::text, p_target_id::text);

  select * into v_row from public.friendships
    where pair_key = v_pair and status = 'blocked' and blocked_by <> auth.uid();
  if found then
    -- The other party already blocked this pair. Return their row unchanged:
    -- a no-op that looks identical to success, so the caller learns nothing.
    return v_row;
  end if;

  delete from public.friendships where pair_key = v_pair;

  insert into public.friendships (requester_id, addressee_id, status, blocked_by)
  values (auth.uid(), p_target_id, 'blocked', auth.uid())
  returning * into v_row;

  return v_row;
end;
$$;

-- `create or replace function` preserves grants; re-stated so this file is
-- runnable standalone and keeps anon off the function.
revoke all on function public.block_user(uuid) from public, anon;
grant execute on function public.block_user(uuid) to authenticated;


-- ───────────────────────────────────────────────────────────────────────
-- J.3 — profiles: column-level SELECT grants (FIX_PLAN.md 1.7)
--
-- The PHASE_G policy "Authenticated users can view public profiles" is
-- `using (deleted_at is null)` over every column of every row, so any
-- signed-in user could read `is_admin` and learn exactly which account is
-- the administrator.
--
-- The column list below is exactly what the frontend selects, audited
-- across every `.from("profiles")` call site in src/ (see the Phase 1
-- report). `is_admin` is deliberately NOT granted — AdminRoute now calls
-- the security-definer public.is_admin() RPC instead, which is the
-- authoritative check and reveals nothing about any other account.
-- `created_at` IS granted: dataExportService.ts:33 reads it for the
-- signed-in user's own GDPR export.
--
-- Only SELECT is touched. INSERT/UPDATE/DELETE privileges are unchanged,
-- so profileService's own-row updates keep working, and every SQL function
-- that reads profiles (is_admin(), is_doctor(), search_users(),
-- check_username_available(), request_doctor_connection()) is SECURITY
-- DEFINER and therefore runs with owner rights, unaffected by this grant.
-- ───────────────────────────────────────────────────────────────────────
revoke select on public.profiles from authenticated;
grant select (
  id,
  full_name,
  username,
  avatar_url,
  bio,
  role,
  timezone,
  deleted_at,
  created_at,
  onboarding_current_step,
  onboarding_completed_at
) on public.profiles to authenticated;

comment on column public.profiles.is_admin is
  'NOT granted to `authenticated` (see PHASE_J_FIXES_MIGRATION.sql J.3). Read it only from SECURITY DEFINER functions such as public.is_admin(), or with the service-role key. Adding it back to the authenticated grant re-opens the admin-account disclosure.';


-- ═══════════════════════════════════════════════════════════════════════
-- PHASE 2 — PAYMENTS (FIX_PLAN.md Phase 2)
--
-- Live state verified on 2026-08-23 via `supabase db query --linked` before
-- any of this was written:
--
--   J.4  subscriptions_stripe_checkout_session_id_idx EXISTS and IS PARTIAL
--        (`WHERE (stripe_checkout_session_id IS NOT NULL)`) — the 42P10 in
--        FIX_PLAN 2.1 is real on this database today.
--   J.5  subscriptions has NO index on stripe_subscription_id at all
--        (pg_index over the table lists only subscriptions_pkey and the
--        partial checkout-session one) — FIX_PLAN 2.2 confirmed.
--   J.6  consultation_credits carries CHECK ((credits > 0)), which makes the
--        negative reversal ledger row FIX_PLAN 2.6 requires impossible until
--        the constraint is replaced. See J.6.
--
-- Everything below is idempotent and re-runnable.
-- ═══════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────────
-- J.4 — ON CONFLICT cannot match a partial index (FIX_PLAN.md 2.1)
--
-- PostgREST emits `ON CONFLICT (stripe_checkout_session_id)` with no
-- predicate. Postgres cannot match that to a partial index, so the upsert in
-- stripe-webhook raised 42P10, the handler returned, and the webhook still
-- answered 200 — Stripe never retried, and the buyer was charged for nothing.
--
-- A plain unique index is correct here: Postgres treats NULLs as distinct by
-- default, so membership rows (which leave this column null) still do not
-- collide with each other.
-- ───────────────────────────────────────────────────────────────────────
drop index if exists public.subscriptions_stripe_checkout_session_id_idx;
create unique index if not exists subscriptions_stripe_checkout_session_id_idx
  on public.subscriptions (stripe_checkout_session_id);


-- ───────────────────────────────────────────────────────────────────────
-- J.5 — the recurring path had no arbiter index at all (FIX_PLAN.md 2.2)
--
-- Same 42P10, on `onConflict: "stripe_subscription_id"` — which means every
-- monthly renewal of every existing member was failing silently.
-- ───────────────────────────────────────────────────────────────────────
create unique index if not exists subscriptions_stripe_subscription_id_idx
  on public.subscriptions (stripe_subscription_id);


-- ───────────────────────────────────────────────────────────────────────
-- J.6 — allow negative consultation_credits rows (needed by FIX_PLAN.md 2.6)
--
-- 2.6 requires a NEGATIVE ledger row on refund/dispute so the audit trail
-- stays append-only and still balances. The original constraint
-- `check (credits > 0)` forbids exactly that, so the reversal insert in
-- stripe-webhook would fail with 23514 and the ledger would silently drift
-- from the real entitlement.
--
-- Zero stays forbidden — a zero-credit ledger row carries no information and
-- is always a bug.
-- ───────────────────────────────────────────────────────────────────────
alter table public.consultation_credits
  drop constraint if exists consultation_credits_credits_check;
alter table public.consultation_credits
  add constraint consultation_credits_credits_check check (credits <> 0);

comment on column public.consultation_credits.credits is
  'Signed. Positive rows are grants; negative rows are reversals written by the stripe-webhook refund/dispute handlers. Never zero. The spendable balance remains subscriptions.consultation_credit_limit - consultation_credits_used; this table is the append-only history of how it got there.';


-- ───────────────────────────────────────────────────────────────────────
-- J.7 — email lookup must be case-insensitive (FIX_PLAN.md 2.5)
--
-- GoTrue stores addresses lower-cased. `where email = p_email` therefore
-- never matched a buyer who typed `Jane@Example.com`: the lookup missed, the
-- invite failed as "already registered", the retry missed identically,
-- findOrInviteUser returned null and the handler returned — payment taken,
-- nothing recorded.
--
-- Also mirrored into supabase/schema.sql so a fresh setup is correct.
-- ───────────────────────────────────────────────────────────────────────
create or replace function public.get_user_id_by_email(p_email text)
returns uuid
language sql
security definer set search_path = public, auth
as $$
  select id from auth.users where lower(email) = lower(trim(p_email)) limit 1;
$$;

revoke all on function public.get_user_id_by_email(text) from public, anon, authenticated;
grant execute on function public.get_user_id_by_email(text) to service_role;


-- ───────────────────────────────────────────────────────────────────────
-- J.8 — spend credits from the OLDEST active row (FIX_PLAN.md 2.8)
--
-- Every one-time purchase inserts its own subscriptions row, but this RPC
-- locked exactly one (`order by current_period_start desc limit 1`). A buyer
-- who bought Diet Premium (3 credits), spent one, then bought Treatment Basic
-- (1 credit) could book once and the remaining two were stranded forever.
--
-- Now it takes the OLDEST active row that still has credit, so entitlements
-- are consumed in the order they were bought. Everything stays inside the
-- caller's transaction and every existing failure mode is preserved:
-- NO_ACTIVE_MEMBERSHIP when there is no active row at all,
-- NO_CREDITS_REMAINING when active rows exist but none has credit left,
-- MINIMUM_NOTICE_NOT_MET and SLOT_TAKEN unchanged.
--
-- Also mirrored into supabase/schema.sql so a fresh setup is correct.
-- ───────────────────────────────────────────────────────────────────────
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
  v_has_active boolean;
  v_result public.consultation_requests;
begin
  -- Distinguishes "no membership at all" from "membership(s), but no credit
  -- left" so the two existing error codes keep their original meanings.
  select exists (
    select 1 from public.subscriptions
    where user_id = p_user_id and status = 'active'
  ) into v_has_active;

  if not v_has_active then
    raise exception 'NO_ACTIVE_MEMBERSHIP';
  end if;

  -- Row lock prevents the same user from spending two credits via parallel
  -- requests. Oldest-first: spend what was bought first.
  select * into v_subscription
  from public.subscriptions
  where user_id = p_user_id
    and status = 'active'
    and consultation_credits_used < consultation_credit_limit
  order by current_period_start asc
  limit 1
  for update;

  if v_subscription is null then
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


-- ───────────────────────────────────────────────────────────────────────
-- J.9 — my_active_subscription must report the COMBINED balance
--       (FIX_PLAN.md 2.8)
--
-- Same `limit 1` defect as the RPC above: the view showed only the newest
-- row's credits. It now reports one row per user carrying the summed
-- entitlement, with the newest row's identity columns for display.
-- ───────────────────────────────────────────────────────────────────────
drop view if exists public.my_active_subscription;
create view public.my_active_subscription
  with (security_invoker = true) as
  select
    (array_agg(s.id order by s.current_period_start desc))[1] as id,
    s.user_id,
    (array_agg(s.package_id order by s.current_period_start desc))[1] as package_id,
    'active'::public.subscription_status as status,
    (array_agg(s.stripe_customer_id order by s.current_period_start desc))[1] as stripe_customer_id,
    (array_agg(s.stripe_subscription_id order by s.current_period_start desc))[1] as stripe_subscription_id,
    min(s.started_at) as started_at,
    max(s.current_period_start) as current_period_start,
    max(s.current_period_end) as current_period_end,
    sum(s.consultation_credit_limit)::integer as consultation_credit_limit,
    sum(s.consultation_credits_used)::integer as consultation_credits_used,
    greatest(
      sum(s.consultation_credit_limit)::integer - sum(s.consultation_credits_used)::integer,
      0
    ) as consultation_credits_remaining
  from public.subscriptions s
  where s.user_id = auth.uid()
    and s.status = 'active'
  group by s.user_id;

grant select on public.my_active_subscription to authenticated;


-- ───────────────────────────────────────────────────────────────────────
-- J.10 — cancelling must return the credit (FIX_PLAN.md 2.9)
--
-- cancel_my_consultation marked the row cancelled without decrementing
-- consultation_credits_used or setting credit_status = 'released', directly
-- contradicting the enum comment in schema.sql ("'released' — the hold was
-- rolled back ... and the credit was restored"). A member who cancelled lost
-- the credit outright.
--
-- The credit is only ever returned for a row that still HOLDS one
-- (credit_status = 'reserved' or 'confirmed'), and the decrement targets the
-- exact subscriptions row the booking was made against, so with several
-- active packs the credit goes back where it came from. Both statements run
-- in the caller's transaction; a double-cancel is impossible because the
-- update's `status in ('pending','confirmed')` predicate matches nothing the
-- second time.
--
-- Also mirrored into supabase/schema.sql so a fresh setup is correct.
-- ───────────────────────────────────────────────────────────────────────
create or replace function public.cancel_my_consultation(p_request_id uuid)
returns public.consultation_requests
language plpgsql
security definer set search_path = public
as $$
declare
  v_result public.consultation_requests;
  v_had_credit boolean;
begin
  select (credit_status in ('reserved', 'confirmed')) into v_had_credit
  from public.consultation_requests
  where id = p_request_id and user_id = auth.uid()
  for update;

  update public.consultation_requests
  set status = 'cancelled',
      credit_status = case
        when credit_status in ('reserved', 'confirmed') then 'released'::public.credit_status
        else credit_status
      end,
      cancelled_at = now(),
      updated_at = now()
  where id = p_request_id and user_id = auth.uid() and status in ('pending', 'confirmed')
  returning * into v_result;

  if v_result is null then
    raise exception 'REQUEST_NOT_FOUND_OR_NOT_CANCELLABLE';
  end if;

  if coalesce(v_had_credit, false) and v_result.subscription_id is not null then
    update public.subscriptions
    set consultation_credits_used = greatest(consultation_credits_used - 1, 0),
        updated_at = now()
    where id = v_result.subscription_id;
  end if;

  return v_result;
end;
$$;

revoke all on function public.cancel_my_consultation(uuid) from public, anon;
grant execute on function public.cancel_my_consultation(uuid) to authenticated;


-- ───────────────────────────────────────────────────────────────────────
-- J.11 — FIX_PLAN.md 2.12: NO ACTION REQUIRED, recorded so nobody "fixes"
--        something that is already correct.
--
-- The Phase 1 report claimed `authenticated` holds no UPDATE on
-- public.profiles. That was read from information_schema.role_table_grants,
-- which only lists TABLE-level grants. Re-checked against the catalog on
-- 2026-08-23 with the query FIX_PLAN 2.12 specifies: `authenticated` DOES
-- hold UPDATE, granted per column on exactly
--   avatar_url, bio, full_name, onboarding_completed_at,
--   onboarding_current_step, timezone, updated_at, username
--
-- That is already the correct shape — it excludes `role` and `is_admin`, so
-- privilege alone blocks self-promotion to admin, on top of the
-- prevent_self_role_escalation trigger. profileService's own-row updates work
-- today. DO NOT add a table-wide update grant here.
-- ───────────────────────────────────────────────────────────────────────




-- ───────────────────────────────────────────────────────────────────────
-- J.12 — payments.consultation_count must allow 4 (FIX_PLAN.md 2.5.5)
--
-- Every tier gained one consultation on 22 Aug 2026, so the Premium tiers
-- now grant 4. PHASE_I declared
--   check (consultation_count between 1 and 3)
-- which a 4-consultation purchase violates: the `payments` insert in
-- create-consultation-checkout-session fails with 23514, the function
-- returns "Could not start checkout. Please try again.", and the buyer never
-- reaches Stripe at all. Nothing is charged — but nothing sells either.
--
-- The constraint name below is NOT a guess: read from the catalog on
-- 2026-08-25 with
--   select conname, pg_get_constraintdef(oid) from pg_constraint
--   where conrelid='public.payments'::regclass and contype='c';
-- which returned payments_consultation_count_check =
--   CHECK (((consultation_count >= 1) AND (consultation_count <= 3)))
--
-- Lower bound stays at 1 so every existing row remains valid.
--
-- Checked at the same time, and deliberately NOT changed: subscriptions has
-- no numeric constraint on consultation_credit_limit, and
-- consultation_credits.credits only requires <> 0 (J.6), so 4 passes both.
-- This constraint was the only thing standing in the way.
-- ───────────────────────────────────────────────────────────────────────
alter table public.payments
  drop constraint if exists payments_consultation_count_check;
alter table public.payments
  add constraint payments_consultation_count_check
  check (consultation_count between 1 and 4);


-- ═══════════════════════════════════════════════════════════════════════
-- END OF PHASE J
-- ═══════════════════════════════════════════════════════════════════════

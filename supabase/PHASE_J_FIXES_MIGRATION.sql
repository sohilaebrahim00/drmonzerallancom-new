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
-- END OF PHASE J
-- ═══════════════════════════════════════════════════════════════════════

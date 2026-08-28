-- ═══════════════════════════════════════════════════════════════════════
-- PHASE L — PHONE NUMBER ON PROFILES AND PAYMENTS
--
-- The doctor's "New Consultation Scheduled" email reads "Phone: Not
-- provided". The template is correct — it renders that for a null. The bug is
-- that nothing ever supplied a number: the program purchase form had no phone
-- field, the checkout function never read one, and two Edge Functions passed a
-- hardcoded null into the email. There was also nowhere to put it: profiles
-- had no phone column at all.
--
-- This file adds the storage. The rest of the chain is wired in the same
-- commit.
--
-- SAFE ON A LIVE DATABASE WITH PAYING CUSTOMERS:
--   * Both columns are nullable and added with `if not exists`, so this is
--     additive and re-runnable. No existing row is rewritten.
--   * Existing rows keep NULL. That is a true statement about the world — we
--     never asked those customers for a number. Backfilling a placeholder
--     would turn "we don't know" into a value the doctor might try to dial.
--
-- Every statement is idempotent.
-- ═══════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────────
-- L.1 — the columns
-- ───────────────────────────────────────────────────────────────────────
alter table public.profiles  add column if not exists phone text;
alter table public.payments  add column if not exists phone text;

comment on column public.profiles.phone is
  'Contact number captured at program purchase, so the doctor can reach the patient. NULL for anyone who bought before Phase L — that is a real historical gap, not a defect to backfill.';

comment on column public.payments.phone is
  'The number as given at checkout, kept on the payment row so the webhook can put it in the doctor''s notification without a second lookup.';


-- ───────────────────────────────────────────────────────────────────────
-- L.2 — grants
--
-- Matched to how full_name is granted on profiles, read from the catalogue
-- on 2026-08-28 via information_schema.column_privileges (NOT
-- role_table_grants — that view lists only TABLE-level grants, and reading it
-- for a column-level question is what led an earlier session to conclude,
-- wrongly, that `authenticated` had no UPDATE on profiles at all):
--
--   full_name | authenticated | SELECT
--   full_name | authenticated | UPDATE
--
-- So phone gets exactly SELECT and UPDATE for authenticated. Column-level,
-- because PHASE_J J.3 revoked the table-wide SELECT — a new column is not
-- readable by the client until it is named here.
--
-- payments is deliberately NOT granted: it is written only by the two
-- Stripe Edge Functions under the service-role key, and read by the doctor
-- through admin-subscribers. The patient has no reason to read it directly.
-- ───────────────────────────────────────────────────────────────────────
grant select (phone), update (phone) on public.profiles to authenticated;


-- ───────────────────────────────────────────────────────────────────────
-- L.3 — optional PDF attachment on a nutrition program (6D.3)
--
-- The doctor writes programs in Word or Canva today. Making him re-enter
-- every meal into the structured builder before his existing customers get
-- anything is the slow path; a PDF ships this week. This is an ADDITION —
-- the structured builder stays, and stays the better long-term surface
-- (it renders on a phone without downloading, it can be edited, and
-- completion can be tracked against it).
--
-- The column holds a storage OBJECT PATH, never a URL. Links are minted as
-- short-lived signed URLs at read time; a stored URL would either expire in
-- the database or, worse, be a public one.
-- ───────────────────────────────────────────────────────────────────────
alter table public.nutrition_programs add column if not exists pdf_path text;

comment on column public.nutrition_programs.pdf_path is
  'Path within the private program-files bucket, e.g. "<patient_id>/<program_id>.pdf". NOT a URL — reads go through a short-lived signed URL. Null means this program is structured-builder only, which is the normal case.';

-- Private bucket. `public => false` is the whole point: a public bucket URL
-- is an unguessable-but-permanent link to someone's medical program, which is
-- not access control.
insert into storage.buckets (id, name, public)
values ('program-files', 'program-files', false)
on conflict (id) do nothing;

-- Path convention is "<patient_id>/<anything>.pdf", so the first folder
-- segment is the owner — the same shape the progress-photos policies use.
drop policy if exists "Patients read their own program files" on storage.objects;
create policy "Patients read their own program files"
  on storage.objects for select
  using (
    bucket_id = 'program-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- The doctor uploads and replaces; the patient never writes here. Scoped to
-- an ACTIVE relationship via the same predicate the progress-photo and intake
-- policies use, so a doctor cannot write into a stranger's folder.
drop policy if exists "Doctor manages program files for their patients" on storage.objects;
create policy "Doctor manages program files for their patients"
  on storage.objects for all
  using (
    bucket_id = 'program-files'
    and public.has_active_doctor_relationship(auth.uid(), ((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'program-files'
    and public.has_active_doctor_relationship(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );


-- ═══════════════════════════════════════════════════════════════════════
-- END OF MIGRATION — nothing below this line changes anything.
-- ═══════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────────
-- VERIFICATION ONLY — read-only. Run this AFTER the migration to confirm it
-- landed. It is not part of the migration and can be run any number of times.
-- ───────────────────────────────────────────────────────────────────────
-- select 'profiles.phone exists'      as check,
--        (count(*) > 0)::text         as value
--   from information_schema.columns
--  where table_schema = 'public' and table_name = 'profiles' and column_name = 'phone'
-- union all
-- select 'payments.phone exists',
--        (count(*) > 0)::text
--   from information_schema.columns
--  where table_schema = 'public' and table_name = 'payments' and column_name = 'phone'
-- union all
-- select 'profiles.phone grants (authenticated)',
--        coalesce(string_agg(privilege_type, ', ' order by privilege_type), 'NONE')
--   from information_schema.column_privileges
--  where table_schema = 'public' and table_name = 'profiles'
--    and column_name = 'phone' and grantee = 'authenticated'
-- union all
-- select 'rows with a phone (expected 0 immediately after)',
--        count(*)::text
--   from public.profiles where phone is not null;

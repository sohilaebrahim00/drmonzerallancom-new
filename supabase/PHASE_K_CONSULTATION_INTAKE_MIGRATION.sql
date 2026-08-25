-- ═══════════════════════════════════════════════════════════════════════
-- PHASE K — PRE-CONSULTATION INTAKE
--
-- The eight questions the assistant asks a patient after they book, so the
-- doctor opens the call with the history already in hand. Intake, not
-- assessment: this stores what the patient said and nothing else.
--
-- GROUND RULE 3 — branch taken: (a) NEW FILE, authoritative.
-- Verified against the linked project on 2026-08-25 before writing:
--   select tablename from pg_tables
--   where schemaname='public' and tablename like '%intake%';   -> NONE
-- No object in this file exists live, so this file is the source of truth
-- for them rather than a corrective PHASE_J-style patch. Every statement is
-- still idempotent and re-runnable.
--
-- Apply with: supabase db query --linked -f supabase/PHASE_K_CONSULTATION_INTAKE_MIGRATION.sql
-- ═══════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────────
-- K.1 — the intake table
--
-- One row per consultation. One COLUMN per question, holding the patient's
-- own words with no processing: no summary, no normalisation, no
-- paraphrase. A tidy rewrite drops exactly the detail a clinician would
-- have used, so the raw text is the only thing stored.
--
-- Distinguishing the three states a question can be in, without a second
-- table: answered (column is not null), skipped (column is null AND
-- next_question is past it), not yet reached (column is null AND
-- next_question has not got there). The doctor's view derives "skipped"
-- that way rather than storing a flag that could drift out of step.
--
-- next_question is 1-8 while in progress and 9 when every question has been
-- put to the patient — which is what makes the conversation resumable.
-- ───────────────────────────────────────────────────────────────────────
create table if not exists public.consultation_intake (
  id uuid primary key default gen_random_uuid(),
  -- One intake per booking. Cascades so a deleted consultation never leaves
  -- an orphaned medical record behind.
  consultation_request_id uuid not null unique
    references public.consultation_requests (id) on delete cascade,
  patient_id uuid not null references auth.users (id) on delete cascade,

  -- Q1 What brings you to this consultation? (ما الذي دفعك لطلب الاستشارة اليوم؟)
  q1_reason text,
  -- Q2 What symptoms are you having at the moment? (ما الأعراض التي تعاني منها حاليًا؟)
  q2_symptoms text,
  -- Q3 Recent tests/investigations + every medicine, vitamin and supplement.
  --    (هل أجريت أي تحاليل دم أو فحوصات طبية مؤخرًا؟ … واذكر جميع الأدوية)
  q3_tests_and_medications text,
  -- Q4 Vitamin and mineral levels specifically — D, B12, iron or similar.
  --    (هل أجريت أي تقييم للتغذية أو الفيتامينات والمعادن)
  q4_vitamin_mineral_levels text,
  -- Q5 A normal day of eating, with rough times. (كيف تبدو عاداتك الغذائية اليومية؟)
  q5_daily_eating text,
  -- Q6 Stress 1-10 and its main sources. (كيف تقيّم مستوى التوتر لديك حاليًا)
  q6_stress text,
  -- Q7 Physical activity: type and times per week. (ما مدى ممارستك للنشاط البدني؟)
  q7_activity text,
  -- Q8 Usual sleep: hours and quality. (كيف تصف نمط نومك المعتاد؟)
  q8_sleep text,

  next_question smallint not null default 1
    check (next_question between 1 and 9),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists consultation_intake_patient_id_idx
  on public.consultation_intake (patient_id);

comment on table public.consultation_intake is
  'Pre-consultation intake — the patient''s own words, verbatim. Never store a summary, a normalised value or a paraphrase in these columns: the clinical value is in the exact wording. Intake is collection only; nothing here is an assessment.';

alter table public.consultation_intake enable row level security;


-- ───────────────────────────────────────────────────────────────────────
-- K.2 — RLS
--
-- The patient owns their intake and can read and write it — 3.1.6 requires
-- that they can reopen and correct an answer before the call, so this is
-- deliberately not insert-once.
--
-- The doctor's read uses public.has_active_doctor_relationship(auth.uid(),
-- patient_id) — the same predicate the progress-photo policies use
-- (PHASE_H ...MIGRATION.sql:314-319), not a new rule. That function is
-- SECURITY DEFINER and self-guarding: it returns false unless auth.uid() is
-- itself one of the two parties, so it cannot be used to probe other
-- people's relationships.
--
-- One deliberate difference from progress_photos: there is no
-- `shared_with_doctor` flag here. A progress photo is something a patient
-- opts into sharing; an intake is answers given TO this doctor for THIS
-- consultation, so gating it behind a second opt-in would mean the doctor
-- asks for a history and then cannot read it.
--
-- No admin-read policy, on purpose. consultation_requests has one
-- ("Admins can view all consultation requests"), and Phase 2.8 showed what
-- that does when a query forgets to scope itself. Nobody but the patient
-- and their active doctor reads this.
-- ───────────────────────────────────────────────────────────────────────
drop policy if exists "Patients manage their own consultation intake" on public.consultation_intake;
create policy "Patients manage their own consultation intake"
  on public.consultation_intake for all
  using (auth.uid() = patient_id)
  with check (auth.uid() = patient_id);

drop policy if exists "Doctor can read their patient's consultation intake" on public.consultation_intake;
create policy "Doctor can read their patient's consultation intake"
  on public.consultation_intake for select
  using (public.has_active_doctor_relationship(auth.uid(), patient_id));


-- ───────────────────────────────────────────────────────────────────────
-- K.3 — keep updated_at honest
-- ───────────────────────────────────────────────────────────────────────
create or replace function public.touch_consultation_intake()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists consultation_intake_touch on public.consultation_intake;
create trigger consultation_intake_touch
  before update on public.consultation_intake
  for each row execute function public.touch_consultation_intake();


-- ═══════════════════════════════════════════════════════════════════════
-- END OF PHASE K
-- ═══════════════════════════════════════════════════════════════════════

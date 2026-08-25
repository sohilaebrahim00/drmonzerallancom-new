import { supabase } from "@/lib/supabase";
import {
  INTAKE_COMPLETE_MARKER,
  INTAKE_QUESTIONS,
  type IntakeAnswerColumn,
} from "@/data/intakeQuestions";
export { INTAKE_QUESTIONS };

/**
 * A pre-consultation intake row. Every answer is the patient's own words,
 * stored verbatim — see PHASE_K_CONSULTATION_INTAKE_MIGRATION.sql.
 */
export interface ConsultationIntake {
  id: string;
  consultation_request_id: string;
  patient_id: string;
  q1_reason: string | null;
  q2_symptoms: string | null;
  q3_tests_and_medications: string | null;
  q4_vitamin_mineral_levels: string | null;
  q5_daily_eating: string | null;
  q6_stress: string | null;
  q7_activity: string | null;
  q8_sleep: string | null;
  next_question: number;
  started_at: string;
  completed_at: string | null;
  updated_at: string;
}

const INTAKE_COLUMNS =
  "id, consultation_request_id, patient_id, q1_reason, q2_symptoms, q3_tests_and_medications, q4_vitamin_mineral_levels, q5_daily_eating, q6_stress, q7_activity, q8_sleep, next_question, started_at, completed_at, updated_at";

export type IntakeAnswerState = "answered" | "skipped" | "not_reached";

export interface IntakeAnswerView {
  number: number;
  label: string;
  prompt: string;
  answer: string | null;
  state: IntakeAnswerState;
}

/**
 * Turns a row into one entry per question, including the ones with no
 * answer. The doctor is shown the gaps on purpose: a tidy list of only the
 * answered questions hides that anything was skipped, and "skipped" is
 * itself clinically meaningful.
 *
 * A question is skipped rather than merely unreached when the conversation
 * has already moved past it — derived from next_question rather than stored,
 * so the two can never drift apart.
 */
export function intakeAnswers(intake: ConsultationIntake | null): IntakeAnswerView[] {
  return INTAKE_QUESTIONS.map((q) => {
    const answer = intake ? ((intake[q.column] as string | null) ?? null) : null;
    const reached = intake ? intake.next_question > q.number : false;
    return {
      number: q.number,
      label: q.label,
      prompt: q.prompt,
      answer,
      state: answer ? "answered" : reached ? "skipped" : "not_reached",
    };
  });
}

export function intakeAnsweredCount(intake: ConsultationIntake | null): number {
  if (!intake) return 0;
  return INTAKE_QUESTIONS.filter((q) => Boolean(intake[q.column])).length;
}

/** The signed-in patient's intake for one consultation, if it exists yet. */
export async function getMyIntake(
  consultationRequestId: string,
): Promise<ConsultationIntake | null> {
  if (!supabase) return null;
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return null;
  const { data, error } = await supabase
    .from("consultation_intake")
    .select(INTAKE_COLUMNS)
    .eq("consultation_request_id", consultationRequestId)
    .eq("patient_id", userId)
    .maybeSingle();
  if (error) {
    console.warn("[intakeService] consultation_intake unavailable:", error.message);
    return null;
  }
  return data as ConsultationIntake | null;
}

/**
 * A patient's intake as the DOCTOR reads it. Scoped explicitly to the
 * patient even though the RLS policy already restricts it to an active
 * relationship — the same defence in depth Phase 2.8 had to retrofit after
 * an admin-wide policy quietly widened a "getMy…" query.
 */
export async function getPatientIntakes(patientId: string): Promise<ConsultationIntake[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("consultation_intake")
    .select(INTAKE_COLUMNS)
    .eq("patient_id", patientId)
    .order("started_at", { ascending: false });
  if (error) {
    console.warn("[intakeService] consultation_intake unavailable:", error.message);
    return [];
  }
  return (data ?? []) as ConsultationIntake[];
}

/**
 * Corrects one answer before the call (3.1.6). The patient's medical
 * information is theirs to fix; this is deliberately not write-once.
 *
 * Stores exactly what was typed. No trimming beyond whitespace, no
 * normalising, no summarising.
 */
export async function updateIntakeAnswer(
  intakeId: string,
  column: IntakeAnswerColumn,
  answer: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: "Not connected." };
  const trimmed = answer.trim();
  const { error } = await supabase
    .from("consultation_intake")
    .update({ [column]: trimmed.length > 0 ? trimmed : null })
    .eq("id", intakeId);
  if (error) return { ok: false, error: "Could not save that answer. Please try again." };
  return { ok: true };
}

export function isIntakeComplete(intake: ConsultationIntake | null): boolean {
  return Boolean(intake && intake.next_question >= INTAKE_COMPLETE_MARKER);
}

/**
 * The intake for a consultation, creating the row on first visit.
 *
 * The chat flow from 3.1 creates this row lazily too, so both front doors
 * converge on the same record — a patient can start in the assistant, carry
 * on from the page, and pick up exactly where they stopped.
 */
export async function ensureMyIntake(
  consultationRequestId: string,
): Promise<ConsultationIntake | null> {
  if (!supabase) return null;
  const existing = await getMyIntake(consultationRequestId);
  if (existing) return existing;

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return null;

  const { data, error } = await supabase
    .from("consultation_intake")
    .insert({ consultation_request_id: consultationRequestId, patient_id: userId })
    .select(INTAKE_COLUMNS)
    .maybeSingle();
  if (error) {
    // A concurrent create (the assistant, another tab) trips the unique
    // constraint on consultation_request_id. That is a success, not a
    // failure — read back the row the other path made.
    const raced = await getMyIntake(consultationRequestId);
    if (raced) return raced;
    console.warn("[intakeService] could not start intake:", error.message);
    return null;
  }
  return data as ConsultationIntake | null;
}

/**
 * Records an answer, or a skip, and moves the pointer on.
 *
 * `next_question` only ever moves FORWARD. Going back to change an earlier
 * answer must not rewind it — otherwise correcting question 2 would make the
 * patient walk through 3 to 8 again, and would tell the doctor those later
 * answers were "not reached" when they had in fact been given.
 */
export async function saveIntakeStep(
  intake: ConsultationIntake,
  questionNumber: number,
  answer: string | null,
): Promise<{ ok: true; intake: ConsultationIntake } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: "Not connected." };
  const question = INTAKE_QUESTIONS.find((q) => q.number === questionNumber);
  if (!question) return { ok: false, error: "Unknown question." };

  const trimmed = (answer ?? "").trim();
  const nextQuestion = Math.max(intake.next_question, questionNumber + 1);
  const patch: Record<string, unknown> = {
    [question.column]: trimmed.length > 0 ? trimmed : null,
    next_question: Math.min(nextQuestion, INTAKE_COMPLETE_MARKER),
  };
  if (nextQuestion >= INTAKE_COMPLETE_MARKER && !intake.completed_at) {
    patch.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("consultation_intake")
    .update(patch)
    .eq("id", intake.id)
    .select(INTAKE_COLUMNS)
    .maybeSingle();
  if (error || !data) return { ok: false, error: "Could not save that answer. Please try again." };
  return { ok: true, intake: data as ConsultationIntake };
}

/**
 * The question to resume at: the first unanswered one, so a patient who
 * skipped question 2 and answered the rest is offered 2 again rather than
 * being sent to the end. Returns null when every question has an answer.
 */
export function firstUnansweredQuestion(intake: ConsultationIntake | null): number | null {
  if (!intake) return 1;
  const pending = INTAKE_QUESTIONS.find((q) => !intake[q.column]);
  return pending ? pending.number : null;
}

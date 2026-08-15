import { supabase } from "@/lib/supabase";
import { PROGRAM_LENGTH_DAYS } from "@/config/features";
import { getDemoMode, DEMO_PROGRAM_ID } from "@/dev/demoMode";
import { DEMO_PROGRAM, DEMO_PROGRAM_DAY } from "@/dev/demoFixtures";

export type ProgramStatus = "draft" | "active" | "completed" | "archived";
export type MealType = "breakfast" | "snack" | "lunch" | "dinner";

export interface ProgramItem {
  id: string;
  meal_type: MealType;
  title: string;
  description: string | null;
  suggested_foods: string | null;
  portion_guidance: string | null;
  approximate_calories: number | null;
  time_suggestion: string | null;
  sort_order: number;
  completion?: "completed" | "skipped" | null;
}

export interface ProgramDay {
  id: string;
  day_number: number;
  water_goal_ml: number | null;
  movement_suggestion: string | null;
  doctor_instructions: string | null;
  items: ProgramItem[];
}

export interface NutritionProgram {
  id: string;
  patient_id: string | null;
  doctor_id: string;
  title: string;
  start_date: string;
  end_date: string;
  goal: string | null;
  daily_calorie_target: number | null;
  general_instructions: string | null;
  status: ProgramStatus;
  is_template: boolean;
}

async function currentUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/** Patient's currently active program, if any. */
export async function getMyActiveProgram(): Promise<NutritionProgram | null> {
  if (getDemoMode()) return DEMO_PROGRAM;
  if (!supabase) return null;
  const userId = await currentUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from("nutrition_programs")
    .select(
      "id, patient_id, doctor_id, title, start_date, end_date, goal, daily_calorie_target, general_instructions, status, is_template",
    )
    .eq("patient_id", userId)
    .eq("status", "active")
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return data as NutritionProgram | null;
}

export function currentProgramDayNumber(program: NutritionProgram, today = new Date()): number {
  const start = new Date(program.start_date);
  start.setHours(0, 0, 0, 0);
  const cursor = new Date(today);
  cursor.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((cursor.getTime() - start.getTime()) / 86_400_000) + 1;
  return Math.min(Math.max(diffDays, 1), PROGRAM_LENGTH_DAYS);
}

export async function getProgramDay(
  programId: string,
  dayNumber: number,
  forUserId?: string,
): Promise<ProgramDay | null> {
  // DEV-ONLY demo preview — the same representative day content regardless
  // of which day number is requested, so the Program screen's day strip and
  // the doctor's Program Builder are both browsable without a real backend.
  if (getDemoMode()) return { ...DEMO_PROGRAM_DAY, day_number: dayNumber };
  if (!supabase) return null;

  const { data: day, error } = await supabase
    .from("nutrition_program_days")
    .select("id, day_number, water_goal_ml, movement_suggestion, doctor_instructions")
    .eq("program_id", programId)
    .eq("day_number", dayNumber)
    .maybeSingle();

  if (error || !day) return null;

  const { data: items } = await supabase
    .from("nutrition_program_items")
    .select(
      "id, meal_type, title, description, suggested_foods, portion_guidance, approximate_calories, time_suggestion, sort_order",
    )
    .eq("program_day_id", day.id)
    .order("sort_order", { ascending: true });

  let completions: Record<string, "completed" | "skipped"> = {};
  if (forUserId && items && items.length > 0) {
    const { data: completionRows } = await supabase
      .from("nutrition_program_item_completions")
      .select("program_item_id, status")
      .eq("user_id", forUserId)
      .in(
        "program_item_id",
        items.map((i) => i.id),
      );
    completions = Object.fromEntries(
      (completionRows ?? []).map((c) => [c.program_item_id, c.status]),
    );
  }

  return {
    ...day,
    items: (items ?? []).map((item) => ({ ...item, completion: completions[item.id] ?? null })),
  };
}

export async function markProgramItemSkipped(programItemId: string): Promise<void> {
  if (getDemoMode()) return;
  if (!supabase) return;
  const userId = await currentUserId();
  if (!userId) return;
  await supabase
    .from("nutrition_program_item_completions")
    .upsert(
      { program_item_id: programItemId, user_id: userId, status: "skipped" },
      { onConflict: "program_item_id,user_id" },
    );
}

// ── Doctor-side ────────────────────────────────────────────────────────

export async function getMyTemplates(): Promise<NutritionProgram[]> {
  if (getDemoMode()) return [];
  if (!supabase) return [];
  const userId = await currentUserId();
  if (!userId) return [];
  const { data, error } = await supabase
    .from("nutrition_programs")
    .select(
      "id, patient_id, doctor_id, title, start_date, end_date, goal, daily_calorie_target, general_instructions, status, is_template",
    )
    .eq("doctor_id", userId)
    .eq("is_template", true);
  if (error) return [];
  return data ?? [];
}

export async function getPatientProgram(patientId: string): Promise<NutritionProgram | null> {
  if (getDemoMode()) return DEMO_PROGRAM;
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("nutrition_programs")
    .select(
      "id, patient_id, doctor_id, title, start_date, end_date, goal, daily_calorie_target, general_instructions, status, is_template",
    )
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return data as NutritionProgram | null;
}

/** Creates a blank draft 30-day program (no template) for the doctor to fill in. */
export async function createBlankProgram(
  patientId: string,
  startDate: Date,
): Promise<{ ok: true; programId: string } | { ok: false; error: string }> {
  if (getDemoMode()) return { ok: true, programId: DEMO_PROGRAM_ID };
  if (!supabase) return { ok: false, error: "Not connected." };
  const doctorId = await currentUserId();
  if (!doctorId) return { ok: false, error: "Not signed in." };

  const startStr = startDate.toISOString().slice(0, 10);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + PROGRAM_LENGTH_DAYS - 1);

  const { data: program, error } = await supabase
    .from("nutrition_programs")
    .insert({
      patient_id: patientId,
      doctor_id: doctorId,
      start_date: startStr,
      end_date: endDate.toISOString().slice(0, 10),
      status: "draft",
      updated_by: doctorId,
    })
    .select("id")
    .single();

  if (error || !program)
    return { ok: false, error: "Could not create program. Confirm patient is connected to you." };

  const days = Array.from({ length: PROGRAM_LENGTH_DAYS }, (_, i) => ({
    program_id: program.id,
    day_number: i + 1,
  }));
  await supabase.from("nutrition_program_days").insert(days);

  return { ok: true, programId: program.id };
}

export async function activateProgram(
  programId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (getDemoMode()) return { ok: true };
  if (!supabase) return { ok: false, error: "Not connected." };
  const doctorId = await currentUserId();
  if (!doctorId) return { ok: false, error: "Not signed in." };
  const { error } = await supabase
    .from("nutrition_programs")
    .update({ status: "active", updated_at: new Date().toISOString(), updated_by: doctorId })
    .eq("id", programId)
    .eq("doctor_id", doctorId);
  if (error) return { ok: false, error: "Could not activate program." };
  return { ok: true };
}

export async function saveProgramItem(
  programDayId: string,
  item: Omit<ProgramItem, "id" | "completion"> & { id?: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (getDemoMode()) return { ok: true };
  if (!supabase) return { ok: false, error: "Not connected." };
  const payload = {
    program_day_id: programDayId,
    meal_type: item.meal_type,
    title: item.title,
    description: item.description,
    suggested_foods: item.suggested_foods,
    portion_guidance: item.portion_guidance,
    approximate_calories: item.approximate_calories,
    time_suggestion: item.time_suggestion,
    sort_order: item.sort_order,
  };
  const { error } = item.id
    ? await supabase.from("nutrition_program_items").update(payload).eq("id", item.id)
    : await supabase.from("nutrition_program_items").insert(payload);
  if (error) return { ok: false, error: "Could not save meal item." };
  return { ok: true };
}

/** Copies every item from one day of a program to another (the doctor-builder "Copy Previous Day" action). */
export async function copyProgramDay(
  programId: string,
  fromDayNumber: number,
  toDayNumber: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (getDemoMode()) return { ok: true };
  if (!supabase) return { ok: false, error: "Not connected." };

  const [{ data: fromDay }, { data: toDay }] = await Promise.all([
    supabase
      .from("nutrition_program_days")
      .select("id")
      .eq("program_id", programId)
      .eq("day_number", fromDayNumber)
      .maybeSingle(),
    supabase
      .from("nutrition_program_days")
      .select("id")
      .eq("program_id", programId)
      .eq("day_number", toDayNumber)
      .maybeSingle(),
  ]);
  if (!fromDay || !toDay) return { ok: false, error: "Day not found." };

  const { data: items } = await supabase
    .from("nutrition_program_items")
    .select(
      "meal_type, title, description, suggested_foods, portion_guidance, approximate_calories, notes, time_suggestion, sort_order",
    )
    .eq("program_day_id", fromDay.id);

  if (!items || items.length === 0) return { ok: true };

  await supabase.from("nutrition_program_items").delete().eq("program_day_id", toDay.id);
  const { error } = await supabase
    .from("nutrition_program_items")
    .insert(items.map((item) => ({ ...item, program_day_id: toDay.id })));

  if (error) return { ok: false, error: "Could not copy day." };
  return { ok: true };
}

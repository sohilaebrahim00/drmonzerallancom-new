import { supabase } from "@/lib/supabase";
import type { FoodItem } from "@/services/foodScanService";
import { getDemoMode, DEMO_USER_ID } from "@/dev/demoMode";
import { DEMO_MEALS_TODAY } from "@/dev/demoFixtures";

export interface MealLogItemInput {
  name: string;
  estimatedPortion: string;
  estimatedCalories: number;
  proteinGrams: number;
  carbohydrateGrams: number;
  fatGrams: number;
  isUserEdited?: boolean;
  isUserAdded?: boolean;
}

export interface SaveMealInput {
  mealType: "breakfast" | "lunch" | "dinner" | "snack" | null;
  items: MealLogItemInput[];
  aiConfidence: "low" | "medium" | "high" | null;
  programItemId?: string | null;
  isOutsideProgram?: boolean;
  imagePath?: string | null;
  notes?: string | null;
  sharedWithFriends?: boolean;
}

export interface MealLog {
  id: string;
  meal_time: string;
  meal_type: string | null;
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  is_outside_program: boolean;
  shared_with_friends: boolean;
  items: FoodItem[];
}

function totals(items: MealLogItemInput[]) {
  return items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.estimatedCalories,
      protein: acc.protein + item.proteinGrams,
      carbs: acc.carbs + item.carbohydrateGrams,
      fat: acc.fat + item.fatGrams,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

export async function saveMealLog(
  input: SaveMealInput,
): Promise<{ ok: true; mealLogId: string } | { ok: false; error: string }> {
  // DEV-ONLY demo preview — a believable success with no Supabase write at all.
  if (getDemoMode()) return { ok: true, mealLogId: `demo-meal-${Date.now()}` };
  if (!supabase) return { ok: false, error: "Not connected." };
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return { ok: false, error: "Not signed in." };
  if (input.items.length === 0) return { ok: false, error: "Add at least one food item." };

  const sum = totals(input.items);

  const { data: mealLog, error: mealError } = await supabase
    .from("meal_logs")
    .insert({
      user_id: userId,
      meal_type: input.mealType,
      program_item_id: input.programItemId ?? null,
      is_outside_program: input.isOutsideProgram ?? false,
      image_path: input.imagePath ?? null,
      ai_confidence: input.aiConfidence,
      total_calories: sum.calories,
      total_protein_g: sum.protein,
      total_carbs_g: sum.carbs,
      total_fat_g: sum.fat,
      notes: input.notes ?? null,
      shared_with_friends: input.sharedWithFriends ?? false,
    })
    .select("id")
    .single();

  if (mealError || !mealLog)
    return { ok: false, error: "Could not save your meal. Please try again." };

  const { error: itemsError } = await supabase.from("meal_log_items").insert(
    input.items.map((item, index) => ({
      meal_log_id: mealLog.id,
      name: item.name,
      estimated_portion: item.estimatedPortion,
      estimated_calories: item.estimatedCalories,
      protein_g: item.proteinGrams,
      carbs_g: item.carbohydrateGrams,
      fat_g: item.fatGrams,
      is_user_edited: item.isUserEdited ?? false,
      is_user_added: item.isUserAdded ?? false,
      sort_order: index,
    })),
  );

  if (itemsError) return { ok: false, error: "Meal saved, but items could not be recorded." };

  if (input.programItemId) {
    await supabase.from("nutrition_program_item_completions").upsert(
      {
        program_item_id: input.programItemId,
        user_id: userId,
        status: "completed",
        meal_log_id: mealLog.id,
      },
      { onConflict: "program_item_id,user_id" },
    );
  }

  return { ok: true, mealLogId: mealLog.id };
}

async function fetchMealLogsInRange(
  userId: string,
  startIso: string,
  endIso: string,
): Promise<MealLog[]> {
  if (!supabase) return [];
  const { data: logs, error } = await supabase
    .from("meal_logs")
    .select(
      "id, meal_time, meal_type, total_calories, total_protein_g, total_carbs_g, total_fat_g, is_outside_program, shared_with_friends",
    )
    .eq("user_id", userId)
    .gte("meal_time", startIso)
    .lt("meal_time", endIso)
    .order("meal_time", { ascending: false });

  if (error || !logs || logs.length === 0) return [];

  const { data: items } = await supabase
    .from("meal_log_items")
    .select("meal_log_id, name, estimated_portion, estimated_calories, protein_g, carbs_g, fat_g")
    .in(
      "meal_log_id",
      logs.map((l) => l.id),
    );

  const itemsByLog = new Map<string, FoodItem[]>();
  for (const item of items ?? []) {
    const arr = itemsByLog.get(item.meal_log_id) ?? [];
    arr.push({
      name: item.name,
      estimatedPortion: item.estimated_portion,
      estimatedCalories: item.estimated_calories,
      proteinGrams: item.protein_g,
      carbohydrateGrams: item.carbs_g,
      fatGrams: item.fat_g,
    });
    itemsByLog.set(item.meal_log_id, arr);
  }

  return logs.map((log) => ({ ...log, items: itemsByLog.get(log.id) ?? [] }));
}

/** `date` boundaries are computed in the caller's local timezone (browser Date), then sent as UTC ISO strings. */
export async function getMyMealsForDay(date: Date): Promise<MealLog[]> {
  if (getDemoMode()) return DEMO_MEALS_TODAY;
  if (!supabase) return [];
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return [];

  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return fetchMealLogsInRange(userId, start.toISOString(), end.toISOString());
}

export async function getMyMealsInRange(startDate: Date, endDate: Date): Promise<MealLog[]> {
  if (getDemoMode()) return DEMO_MEALS_TODAY;
  if (!supabase) return [];
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return [];
  return fetchMealLogsInRange(userId, startDate.toISOString(), endDate.toISOString());
}

export async function getPatientMealsInRange(
  patientId: string,
  startDate: Date,
  endDate: Date,
): Promise<MealLog[]> {
  // DEV-ONLY demo preview — only Sarah (the demo patient) has fixture meal
  // history; other demo patients (Ahmed/Mona) correctly show no logs here,
  // matching their DEMO_PATIENT_OVERVIEWS figures on the doctor dashboard.
  if (getDemoMode()) return patientId === DEMO_USER_ID ? DEMO_MEALS_TODAY : [];
  return fetchMealLogsInRange(patientId, startDate.toISOString(), endDate.toISOString());
}

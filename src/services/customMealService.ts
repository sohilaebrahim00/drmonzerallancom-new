import { supabase } from "@/lib/supabase";
import { getDemoMode } from "@/dev/demoMode";

export interface CustomMeal {
  id: string;
  name: string;
  ingredients: string | null;
  serving_description: string | null;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface CustomMealInput {
  name: string;
  ingredients?: string;
  servingDescription?: string;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
}

export async function getMyCustomMeals(): Promise<CustomMeal[]> {
  if (getDemoMode()) return [];
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("custom_meals")
    .select("id, name, ingredients, serving_description, calories, protein_g, carbs_g, fat_g")
    .order("created_at", { ascending: false });
  if (error) return [];
  return data ?? [];
}

export async function createCustomMeal(
  input: CustomMealInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (getDemoMode()) return { ok: true, id: `demo-custom-meal-${Date.now()}` };
  if (!supabase) return { ok: false, error: "Not connected." };
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return { ok: false, error: "Not signed in." };
  if (!input.name.trim()) return { ok: false, error: "Give this meal a name." };
  if (input.calories < 0) return { ok: false, error: "Calories can't be negative." };

  const { data, error } = await supabase
    .from("custom_meals")
    .insert({
      user_id: userId,
      name: input.name.trim(),
      ingredients: input.ingredients?.trim() || null,
      serving_description: input.servingDescription?.trim() || null,
      calories: input.calories,
      protein_g: input.proteinGrams,
      carbs_g: input.carbsGrams,
      fat_g: input.fatGrams,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: "Could not save this meal." };
  return { ok: true, id: data.id };
}

export async function deleteCustomMeal(id: string): Promise<void> {
  if (getDemoMode()) return;
  if (!supabase) return;
  await supabase.from("custom_meals").delete().eq("id", id);
}

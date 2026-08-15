import { supabase } from "@/lib/supabase";
import type { MealLogItemInput } from "@/services/mealLogService";
import { getDemoMode } from "@/dev/demoMode";

export interface FoodFavorite {
  id: string;
  name: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack" | null;
  items: MealLogItemInput[];
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
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

export async function getMyFavorites(): Promise<FoodFavorite[]> {
  if (getDemoMode()) return [];
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("food_favorites")
    .select(
      "id, name, meal_type, items, total_calories, total_protein_g, total_carbs_g, total_fat_g",
    )
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as FoodFavorite[];
}

export async function saveFavorite(
  name: string,
  mealType: "breakfast" | "lunch" | "dinner" | "snack" | null,
  items: MealLogItemInput[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (getDemoMode()) return { ok: true };
  if (!supabase) return { ok: false, error: "Not connected." };
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return { ok: false, error: "Not signed in." };
  if (!name.trim()) return { ok: false, error: "Give this favorite a name." };
  if (items.length === 0) return { ok: false, error: "No items to save." };

  const sum = totals(items);
  const { error } = await supabase.from("food_favorites").insert({
    user_id: userId,
    name: name.trim(),
    meal_type: mealType,
    items,
    total_calories: sum.calories,
    total_protein_g: sum.protein,
    total_carbs_g: sum.carbs,
    total_fat_g: sum.fat,
  });
  if (error) return { ok: false, error: "Could not save favorite." };
  return { ok: true };
}

export async function deleteFavorite(id: string): Promise<void> {
  if (getDemoMode()) return;
  if (!supabase) return;
  await supabase.from("food_favorites").delete().eq("id", id);
}

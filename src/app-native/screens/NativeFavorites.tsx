import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChefHat, Loader2, Plus, Repeat, Star, Trash2 } from "lucide-react";

import { AppScreen } from "@/app-native/components/AppScreen";
import { EmptyState } from "@/app-native/components/EmptyState";
import { cn } from "@/lib/utils";
import { saveMealLog } from "@/services/mealLogService";
import { createPostMealActivityTask } from "@/services/activityService";
import { deleteFavorite, getMyFavorites, type FoodFavorite } from "@/services/favoritesService";
import { deleteCustomMeal, getMyCustomMeals, type CustomMeal } from "@/services/customMealService";

type Tab = "favorites" | "custom";
type RowState = "idle" | "saving" | "done";

function FavoriteRow({ favorite, onRemoved }: { favorite: FoodFavorite; onRemoved: () => void }) {
  const [state, setState] = useState<RowState>("idle");

  async function handleLogAgain() {
    if (state !== "idle") return;
    setState("saving");
    const outcome = await saveMealLog({
      mealType: favorite.meal_type,
      items: favorite.items,
      aiConfidence: null,
      isOutsideProgram: true,
    });
    if (!outcome.ok) {
      setState("idle");
      return;
    }
    await createPostMealActivityTask(outcome.mealLogId);
    setState("done");
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-app-surface p-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
        <Star className="h-4.5 w-4.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-navy">{favorite.name}</p>
        <p className="text-xs text-muted-foreground">{Math.round(favorite.total_calories)} kcal</p>
      </div>
      <button
        type="button"
        onClick={handleLogAgain}
        disabled={state !== "idle"}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-primary disabled:opacity-60"
        aria-label="Log again"
      >
        {state === "saving" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : state === "done" ? (
          <Check className="h-4 w-4 text-app-success" />
        ) : (
          <Repeat className="h-4 w-4" />
        )}
      </button>
      <button
        type="button"
        onClick={() => deleteFavorite(favorite.id).then(onRemoved)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        aria-label="Remove favorite"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function CustomMealRow({ meal, onRemoved }: { meal: CustomMeal; onRemoved: () => void }) {
  const [state, setState] = useState<RowState>("idle");

  async function handleLog() {
    if (state !== "idle") return;
    setState("saving");
    const outcome = await saveMealLog({
      mealType: null,
      items: [
        {
          name: meal.name,
          estimatedPortion: meal.serving_description ?? "1 serving",
          estimatedCalories: meal.calories,
          proteinGrams: meal.protein_g,
          carbohydrateGrams: meal.carbs_g,
          fatGrams: meal.fat_g,
        },
      ],
      aiConfidence: null,
      isOutsideProgram: true,
    });
    if (!outcome.ok) {
      setState("idle");
      return;
    }
    await createPostMealActivityTask(outcome.mealLogId);
    setState("done");
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-app-surface p-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
        <ChefHat className="h-4.5 w-4.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-navy">{meal.name}</p>
        <p className="text-xs text-muted-foreground">{Math.round(meal.calories)} kcal</p>
      </div>
      <button
        type="button"
        onClick={handleLog}
        disabled={state !== "idle"}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-primary disabled:opacity-60"
        aria-label="Log this meal"
      >
        {state === "saving" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : state === "done" ? (
          <Check className="h-4 w-4 text-app-success" />
        ) : (
          <Repeat className="h-4 w-4" />
        )}
      </button>
      <button
        type="button"
        onClick={() => deleteCustomMeal(meal.id).then(onRemoved)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        aria-label="Delete custom meal"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function NativeFavorites() {
  const [tab, setTab] = useState<Tab>("favorites");
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<FoodFavorite[]>([]);
  const [customMeals, setCustomMeals] = useState<CustomMeal[]>([]);

  function refresh() {
    setLoading(true);
    Promise.all([getMyFavorites(), getMyCustomMeals()]).then(([f, c]) => {
      setFavorites(f);
      setCustomMeals(c);
      setLoading(false);
    });
  }

  useEffect(refresh, []);

  return (
    <AppScreen title="Favorites" back className="mx-auto w-full max-w-lg px-4 pb-8 pt-3">
      <div className="grid grid-cols-2 gap-2">
        {(["favorites", "custom"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "cursor-pointer rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors",
              tab === t
                ? "border-primary bg-secondary/60 text-primary"
                : "border-border text-navy/70",
            )}
          >
            {t === "favorites" ? "Favorites" : "My Custom Meals"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {tab === "favorites" &&
            (favorites.length === 0 ? (
              <EmptyState
                icon={Star}
                title="No favorites yet"
                body="After saving a meal, add it to Favorites to log it again in one tap."
              />
            ) : (
              favorites.map((f) => <FavoriteRow key={f.id} favorite={f} onRemoved={refresh} />)
            ))}

          {tab === "custom" && (
            <>
              <Link
                to="/food-scanner/custom-meal"
                className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-border/70 py-2.5 text-xs font-semibold text-primary hover:border-turquoise"
              >
                <Plus className="h-3.5 w-3.5" /> Create Custom Meal
              </Link>
              {customMeals.length === 0 ? (
                <EmptyState
                  icon={ChefHat}
                  title="No custom meals yet"
                  body="Create a reusable meal with your own nutrition values."
                />
              ) : (
                customMeals.map((m) => <CustomMealRow key={m.id} meal={m} onRemoved={refresh} />)
              )}
            </>
          )}
        </div>
      )}
    </AppScreen>
  );
}

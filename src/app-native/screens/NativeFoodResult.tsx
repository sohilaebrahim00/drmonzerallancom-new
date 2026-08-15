import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Camera,
  CircleNotch,
  ChatCircleDots,
  ShieldWarning,
  Star,
  Trash,
} from "@phosphor-icons/react";

import { AppScreen } from "@/app-native/components/AppScreen";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { useLocationState } from "@/app-native/useLocationState";
import { hapticSuccess } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import type { FoodItem, FoodScanResult } from "@/services/foodScanService";
import { getMyBodyProfile } from "@/services/bodyProfileService";
import { saveMealLog, type MealLogItemInput } from "@/services/mealLogService";
import { createPostMealActivityTask } from "@/services/activityService";
import { getMyPrivacySettings } from "@/services/privacyService";
import { saveFavorite } from "@/services/favoritesService";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { getDemoMode } from "@/dev/demoMode";
import { DEMO_PROGRAM_DAY } from "@/dev/demoFixtures";

type MealType = "breakfast" | "lunch" | "dinner" | "snack";
const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
];

function buildMealPrompt(result: FoodScanResult): string {
  const items = result.foods
    .map((f) => `${f.name} (${f.estimatedPortion}, ~${Math.round(f.estimatedCalories)} kcal)`)
    .join(", ");
  return `I just scanned a meal with the Food Scanner: ${items}. Estimated total: ~${Math.round(result.totalEstimatedCalories)} kcal. Can you give me general nutrition feedback on this?`;
}

/** Simple substring match against the user's declared allergens — a cautious heads-up, never a safety guarantee (see disclaimer below). */
function detectPossibleAllergens(foods: FoodItem[], allergies: string[]): string[] {
  if (allergies.length === 0) return [];
  const haystack = foods.map((f) => f.name.toLowerCase()).join(" ");
  return allergies.filter((allergen) => haystack.includes(allergen.toLowerCase()));
}

export default function NativeFoodResult() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const result = useLocationState<FoodScanResult>("result");
  const programItemId = useLocationState<string>("programItemId");
  const [foods, setFoods] = useState<FoodItem[]>(result?.foods ?? []);
  const [plannedMeal, setPlannedMeal] = useState<{
    title: string;
    suggested_foods: string | null;
  } | null>(null);
  const [mealType, setMealType] = useState<MealType>("snack");
  const [shareWithFriends, setShareWithFriends] = useState(true);
  const [allergyMatches, setAllergyMatches] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [favoriteState, setFavoriteState] = useState<"idle" | "saving" | "done">("idle");

  useEffect(() => {
    if (!user || !result?.foodDetected) return;
    Promise.all([getMyBodyProfile(), getMyPrivacySettings()]).then(([bodyProfile, privacy]) => {
      if (bodyProfile) {
        const allergens = [
          ...bodyProfile.food_allergies,
          ...(bodyProfile.food_allergies_other ? [bodyProfile.food_allergies_other] : []),
        ];
        setAllergyMatches(detectPossibleAllergens(result.foods, allergens));
      }
      if (privacy) setShareWithFriends(privacy.share_meals_with_friends);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!programItemId) return;
    if (getDemoMode()) {
      const item = DEMO_PROGRAM_DAY.items.find((i) => i.id === programItemId);
      setPlannedMeal(item ? { title: item.title, suggested_foods: item.suggested_foods } : null);
      return;
    }
    if (!supabase) return;
    supabase
      .from("nutrition_program_items")
      .select("title, suggested_foods")
      .eq("id", programItemId)
      .maybeSingle()
      .then(({ data }) => setPlannedMeal(data ?? null));
  }, [programItemId]);

  if (!result) return <Navigate to="/food-scanner" replace />;

  const total = foods.reduce((sum, f) => sum + (f.estimatedCalories || 0), 0);

  async function handleSave() {
    if (saving || saved) return;
    setSaving(true);
    setSaveError(null);

    const items: MealLogItemInput[] = foods.map((f) => ({
      name: f.name,
      estimatedPortion: f.estimatedPortion,
      estimatedCalories: f.estimatedCalories,
      proteinGrams: f.proteinGrams,
      carbohydrateGrams: f.carbohydrateGrams,
      fatGrams: f.fatGrams,
    }));

    const outcome = await saveMealLog({
      mealType,
      items,
      aiConfidence: result!.confidence,
      programItemId: programItemId ?? null,
      isOutsideProgram: !programItemId,
      sharedWithFriends: shareWithFriends,
    });

    if (!outcome.ok) {
      setSaving(false);
      setSaveError(outcome.error);
      return;
    }

    await createPostMealActivityTask(outcome.mealLogId);
    setSaving(false);
    setSaved(true);
    hapticSuccess();
  }

  async function handleSaveFavorite() {
    if (favoriteState !== "idle" || foods.length === 0) return;
    setFavoriteState("saving");
    const outcome = await saveFavorite(
      foods[0]?.name || "Favorite meal",
      mealType,
      foods.map((f) => ({
        name: f.name,
        estimatedPortion: f.estimatedPortion,
        estimatedCalories: f.estimatedCalories,
        proteinGrams: f.proteinGrams,
        carbohydrateGrams: f.carbohydrateGrams,
        fatGrams: f.fatGrams,
      })),
    );
    setFavoriteState(outcome.ok ? "done" : "idle");
  }

  function removeFood(index: number) {
    setFoods((prev) => prev.filter((_, i) => i !== index));
  }

  function updateFood(index: number, patch: Partial<FoodItem>) {
    setFoods((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }

  function addFood() {
    setFoods((prev) => [
      ...prev,
      {
        name: "",
        estimatedPortion: "1 serving",
        estimatedCalories: 0,
        proteinGrams: 0,
        carbohydrateGrams: 0,
        fatGrams: 0,
      },
    ]);
    hapticSuccess();
  }

  if (!result.foodDetected) {
    return (
      <AppScreen
        title="Scan Result"
        back
        className="mx-auto w-full max-w-lg px-4 py-10 text-center"
      >
        <Alert className="border-amber-300 bg-amber-50 text-amber-900">
          <AlertDescription>{result.notes}</AlertDescription>
        </Alert>
        <Button onClick={() => navigate("/food-scanner")} className="mt-4 w-full cursor-pointer">
          <Camera className="h-4 w-4" /> Scan Another Meal
        </Button>
      </AppScreen>
    );
  }

  return (
    <AppScreen title="Estimated Nutrition" back className="mx-auto w-full max-w-lg px-4 pb-8 pt-3">
      {plannedMeal && (
        <div className="mb-3 rounded-xl border border-border/70 bg-secondary/40 p-3">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-primary">
            Planned Meal
          </p>
          <p className="mt-0.5 text-sm font-semibold text-navy">{plannedMeal.title}</p>
          {plannedMeal.suggested_foods && (
            <p className="text-xs text-muted-foreground">{plannedMeal.suggested_foods}</p>
          )}
          <p className="mt-1.5 text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
            What You Logged
          </p>
        </div>
      )}
      <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-navy to-primary p-5 text-center text-white shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
          Estimated Nutrition
        </p>
        <p className="mt-1 font-display text-4xl font-extrabold">~{Math.round(total)} kcal</p>
        {result.confidence === "low" && (
          <span className="mt-2 inline-block rounded-full bg-white/15 px-2.5 py-1 text-[0.65rem] font-semibold text-white/90">
            Review suggested — double-check the items below
          </span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2.5 text-center">
        {(["proteinGrams", "carbohydrateGrams", "fatGrams"] as const).map((key, i) => {
          const labels = ["Protein", "Carbs", "Fat"];
          const t = foods.reduce((sum, f) => sum + (f[key] || 0), 0);
          return (
            <div key={key} className="rounded-xl border border-border/70 bg-card p-3 shadow-sm">
              <p className="font-display text-lg font-bold text-navy">{Math.round(t)}g</p>
              <p className="text-xs text-muted-foreground">{labels[i]}</p>
            </div>
          );
        })}
      </div>

      <p className="mt-4 px-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Detected Foods
      </p>
      <div className="mt-2 space-y-2">
        {foods.map((food, index) => (
          <div
            key={index}
            className="flex items-center gap-2 rounded-xl border border-border/70 bg-card p-3"
          >
            <div className="min-w-0 flex-1">
              <input
                value={food.name}
                onChange={(e) => updateFood(index, { name: e.target.value })}
                placeholder="Food name"
                className="w-full truncate bg-transparent text-sm font-semibold text-navy outline-none"
              />
              <div className="mt-1 flex items-center gap-2">
                <input
                  value={food.estimatedPortion}
                  onChange={(e) => updateFood(index, { estimatedPortion: e.target.value })}
                  className="w-20 bg-transparent text-xs text-muted-foreground outline-none"
                />
                <input
                  type="number"
                  value={Math.round(food.estimatedCalories)}
                  onChange={(e) =>
                    updateFood(index, { estimatedCalories: Number(e.target.value) || 0 })
                  }
                  className="w-16 bg-transparent text-xs text-muted-foreground outline-none"
                />
                <span className="text-xs text-muted-foreground">kcal</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeFood(index)}
              aria-label={`Remove ${food.name || "item"}`}
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addFood}
          className={cn(
            "flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-border/70 py-2.5 text-xs font-semibold text-primary hover:border-turquoise",
          )}
        >
          + Add Missing Item
        </button>
      </div>

      {result.notes && (
        <p className="mt-3 text-center text-xs text-muted-foreground">{result.notes}</p>
      )}

      {allergyMatches.length > 0 && (
        <Alert className="mt-4 border-amber-300 bg-amber-50 text-amber-900">
          <ShieldWarning className="h-4 w-4" />
          <AlertDescription>
            This meal may contain an ingredient you listed as an allergy (
            {allergyMatches.join(", ")}). This is a text match on the detected food names, not a
            guarantee — image recognition cannot confirm food is safe. When in doubt, check the
            ingredients yourself.
          </AlertDescription>
        </Alert>
      )}

      <p className="mt-4 rounded-xl border border-border/70 bg-secondary/40 p-3 text-xs leading-relaxed text-muted-foreground">
        Nutrition values are estimates based on the image and visible portion size. Actual calories
        and nutrients can vary significantly depending on ingredients, preparation method, and
        portion size.
      </p>

      {user && !saved && (
        <div className="mt-4 space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Meal type
            </p>
            <div className="mt-1.5 grid grid-cols-4 gap-1.5">
              {MEAL_TYPES.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMealType(m.value)}
                  className={cn(
                    "cursor-pointer rounded-lg border px-1 py-2 text-xs font-semibold transition-colors",
                    mealType === m.value
                      ? "border-primary bg-secondary/60 text-primary"
                      : "border-border text-navy/70",
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card px-3.5 py-3">
            <span className="text-sm font-semibold text-navy">Share with Friends</span>
            <Switch checked={shareWithFriends} onCheckedChange={setShareWithFriends} />
          </div>
          <button
            type="button"
            onClick={handleSaveFavorite}
            disabled={favoriteState !== "idle"}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border/70 py-2.5 text-xs font-semibold text-primary hover:border-turquoise disabled:opacity-70"
          >
            <Star className="h-3.5 w-3.5" />
            {favoriteState === "done"
              ? "Saved to Favorites"
              : favoriteState === "saving"
                ? "Saving..."
                : "Save to Favorites"}
          </button>
        </div>
      )}

      {saveError && (
        <Alert variant="destructive" className="mt-3" role="alert">
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}

      {saved && (
        <Alert className="mt-4 border-green/40 bg-green/10 text-navy">
          <AlertDescription>
            Meal saved. Your daily calories are updated, and a movement suggestion will be ready in
            about 25 minutes.
          </AlertDescription>
        </Alert>
      )}

      <div className="mt-5 flex flex-col gap-2.5">
        {user && (
          <Button onClick={handleSave} disabled={saving || saved} className="w-full cursor-pointer">
            {saving ? (
              <CircleNotch className="h-4 w-4 animate-spin" />
            ) : saved ? (
              "Saved"
            ) : (
              "Save Meal"
            )}
          </Button>
        )}
        <Button
          onClick={() =>
            navigate("/ai", {
              state: {
                prefillMessage: buildMealPrompt({
                  ...result,
                  foods,
                  totalEstimatedCalories: total,
                }),
              },
            })
          }
          variant="outline"
          className="w-full cursor-pointer"
        >
          <ChatCircleDots className="h-4 w-4" /> Ask AI About This Meal
        </Button>
        <Button
          onClick={() => navigate("/food-scanner")}
          variant="outline"
          className="w-full cursor-pointer"
        >
          <Camera className="h-4 w-4" /> Scan Another Meal
        </Button>
      </div>
    </AppScreen>
  );
}

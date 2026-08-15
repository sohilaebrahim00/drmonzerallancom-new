import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { AppScreen } from "@/app-native/components/AppScreen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLocationState } from "@/app-native/useLocationState";
import { createCustomMeal } from "@/services/customMealService";
import { saveFavorite } from "@/services/favoritesService";
import type { FoodScanResult } from "@/services/foodScanService";

/** Create-from-scratch reusable meal (§23) — saved once as a custom meal AND a favorite (so it also shows in "Log Again"), then handed to the same review/save screen every other logging path uses. */
export default function NativeCustomMeal() {
  const navigate = useNavigate();
  const programItemId = useLocationState<string>("programItemId");
  const [name, setName] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [serving, setServing] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    setError(null);

    const input = {
      name,
      ingredients: ingredients || undefined,
      servingDescription: serving || undefined,
      calories: Number(calories) || 0,
      proteinGrams: Number(protein) || 0,
      carbsGrams: Number(carbs) || 0,
      fatGrams: Number(fat) || 0,
    };

    const outcome = await createCustomMeal(input);
    if (!outcome.ok) {
      setSaving(false);
      setError(outcome.error);
      return;
    }

    await saveFavorite(input.name, null, [
      {
        name: input.name,
        estimatedPortion: input.servingDescription ?? "1 serving",
        estimatedCalories: input.calories,
        proteinGrams: input.proteinGrams,
        carbohydrateGrams: input.carbsGrams,
        fatGrams: input.fatGrams,
      },
    ]);

    const scanResult: FoodScanResult = {
      foodDetected: true,
      foods: [
        {
          name: input.name,
          estimatedPortion: input.servingDescription ?? "1 serving",
          estimatedCalories: input.calories,
          proteinGrams: input.proteinGrams,
          carbohydrateGrams: input.carbsGrams,
          fatGrams: input.fatGrams,
        },
      ],
      totalEstimatedCalories: input.calories,
      confidence: "high",
      notes: "Custom meal — values you entered yourself. Also saved to Favorites for next time.",
    };

    setSaving(false);
    navigate("/food-scanner/result", {
      state: { result: scanResult, programItemId },
      replace: true,
    });
  }

  const canSave = name.trim().length > 0 && calories.trim().length > 0;

  return (
    <AppScreen title="Create Custom Meal" back className="mx-auto w-full max-w-lg px-4 pb-8 pt-3">
      <div className="space-y-3.5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Name
          </p>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. My Breakfast"
            className="mt-1.5"
          />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Ingredients (optional)
          </p>
          <textarea
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            rows={2}
            placeholder="e.g. 2 eggs, 1 slice whole wheat toast, avocado"
            className="mt-1.5 w-full rounded-lg border border-border bg-background p-3 text-sm text-navy outline-none"
          />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Serving (optional)
          </p>
          <Input
            value={serving}
            onChange={(e) => setServing(e.target.value)}
            placeholder="e.g. 1 plate"
            className="mt-1.5"
          />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Calories
          </p>
          <Input
            type="number"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            placeholder="e.g. 450"
            className="mt-1.5"
          />
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Protein (g)</p>
            <Input
              type="number"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Carbs (g)</p>
            <Input
              type="number"
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Fat (g)</p>
            <Input
              type="number"
              value={fat}
              onChange={(e) => setFat(e.target.value)}
              className="mt-1.5"
            />
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mt-4" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        onClick={handleSave}
        disabled={!canSave || saving}
        className="mt-6 w-full cursor-pointer"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save & Continue"}
      </Button>
    </AppScreen>
  );
}

import { useState } from "react";
import { CaretDown, CaretUp } from "@phosphor-icons/react";

import { OnboardingStepShell } from "@/app-native/onboarding/OnboardingStepShell";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { upsertMyBodyProfile, recalculateMyDailyTarget } from "@/services/bodyProfileService";
import type { ActivityLevel, BiologicalSex, Goal } from "@/lib/calorieCalculator";

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string }[] = [
  { value: "sedentary", label: "Sedentary — little to no exercise" },
  { value: "light", label: "Light — exercise 1-3 days/week" },
  { value: "moderate", label: "Moderate — exercise 3-5 days/week" },
  { value: "active", label: "Active — exercise 6-7 days/week" },
  { value: "very_active", label: "Very active — physical job or 2x/day training" },
];

const GOALS: { value: Goal; label: string }[] = [
  { value: "lose_weight", label: "Lose Weight" },
  { value: "maintain_weight", label: "Maintain Weight" },
  { value: "gain_weight", label: "Gain Weight" },
];

const HEALTH_CONDITIONS = ["Diabetes", "Hypertension", "High Cholesterol", "Thyroid condition"];
const FOOD_ALLERGIES = [
  "Nuts",
  "Peanuts",
  "Milk",
  "Egg",
  "Fish",
  "Shellfish",
  "Soy",
  "Wheat",
  "Sesame",
];
const FOOD_INTOLERANCES = ["Lactose intolerance", "Gluten sensitivity"];
const DIETARY_PREFERENCES = ["Vegetarian", "Vegan", "Halal", "Low-Carb"];

function ChipGroup({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className={cn(
              "cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              active
                ? "border-primary bg-secondary/60 text-primary"
                : "border-border text-navy/70 hover:border-turquoise",
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function BodyHealthStep({
  onNext,
  onSkip,
}: {
  onNext: () => Promise<void>;
  onSkip: () => Promise<void>;
}) {
  const [age, setAge] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [sex, setSex] = useState<BiologicalSex | "">("");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | "">("");
  const [goal, setGoal] = useState<Goal | "">("");
  const [showHealth, setShowHealth] = useState(false);
  const [conditions, setConditions] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [intolerances, setIntolerances] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const canCalculate = age && heightCm && weightKg && sex && activityLevel && goal;

  async function handleNext() {
    if (saving) return;
    setSaving(true);

    const ageNum = Number(age);
    const dateOfBirth = ageNum
      ? new Date(new Date().getFullYear() - ageNum, new Date().getMonth(), new Date().getDate())
          .toISOString()
          .slice(0, 10)
      : null;

    await upsertMyBodyProfile({
      date_of_birth: dateOfBirth,
      height_cm: heightCm ? Number(heightCm) : null,
      weight_kg: weightKg ? Number(weightKg) : null,
      biological_sex: sex || null,
      activity_level: activityLevel || null,
      goal: goal || null,
      health_conditions: conditions,
      food_allergies: allergies,
      food_intolerances: intolerances,
      dietary_preferences: preferences,
    });

    if (canCalculate) {
      await recalculateMyDailyTarget();
    }

    setSaving(false);
    await onNext();
  }

  return (
    <OnboardingStepShell
      step="body_health"
      title="Body & Goal"
      subtitle="This lets us estimate a daily calorie target for you — Dr. Monzer can always set one manually instead."
      onNext={handleNext}
      saving={saving}
      onSkip={() => onSkip()}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Age
            </label>
            <Input
              className="mt-1.5"
              type="number"
              inputMode="numeric"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="28"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Height (cm)
            </label>
            <Input
              className="mt-1.5"
              type="number"
              inputMode="decimal"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              placeholder="170"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Weight (kg)
            </label>
            <Input
              className="mt-1.5"
              type="number"
              inputMode="decimal"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              placeholder="70"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Sex <span className="normal-case text-[0.65rem]">(for the calorie formula)</span>
            </label>
            <select
              className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-navy outline-none"
              value={sex}
              onChange={(e) => setSex(e.target.value as BiologicalSex)}
            >
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Activity level
          </label>
          <select
            className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-navy outline-none"
            value={activityLevel}
            onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
          >
            <option value="">Select</option>
            {ACTIVITY_LEVELS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Goal
          </label>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {GOALS.map((g) => (
              <button
                key={g.value}
                type="button"
                onClick={() => setGoal(g.value)}
                className={cn(
                  "cursor-pointer rounded-lg border px-2 py-2 text-xs font-semibold transition-colors",
                  goal === g.value
                    ? "border-primary bg-secondary/60 text-primary"
                    : "border-border text-navy/70",
                )}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowHealth((v) => !v)}
          className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-border/70 bg-secondary/30 px-3 py-2.5 text-sm font-semibold text-navy"
        >
          Health details (optional)
          {showHealth ? <CaretUp className="h-4 w-4" /> : <CaretDown className="h-4 w-4" />}
        </button>

        {showHealth && (
          <div className="space-y-4 rounded-xl border border-border/70 p-3.5">
            <div>
              <p className="text-xs font-semibold text-navy">Health conditions</p>
              <p className="text-[0.7rem] text-muted-foreground">
                Private — never shown to friends.
              </p>
              <div className="mt-2">
                <ChipGroup
                  options={HEALTH_CONDITIONS}
                  selected={conditions}
                  onToggle={(v) => setConditions((c) => toggle(c, v))}
                />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-navy">Food allergies</p>
              <div className="mt-2">
                <ChipGroup
                  options={FOOD_ALLERGIES}
                  selected={allergies}
                  onToggle={(v) => setAllergies((c) => toggle(c, v))}
                />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-navy">Food intolerances</p>
              <div className="mt-2">
                <ChipGroup
                  options={FOOD_INTOLERANCES}
                  selected={intolerances}
                  onToggle={(v) => setIntolerances((c) => toggle(c, v))}
                />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-navy">Dietary preferences</p>
              <div className="mt-2">
                <ChipGroup
                  options={DIETARY_PREFERENCES}
                  selected={preferences}
                  onToggle={(v) => setPreferences((c) => toggle(c, v))}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </OnboardingStepShell>
  );
}

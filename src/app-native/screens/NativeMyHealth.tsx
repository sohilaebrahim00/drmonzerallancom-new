import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

import { AppScreen } from "@/app-native/components/AppScreen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import {
  getMyBodyProfile,
  getMyCurrentTarget,
  upsertMyBodyProfile,
  recalculateMyDailyTarget,
  type BodyProfile,
  type DailyTarget,
} from "@/services/bodyProfileService";
import type { ActivityLevel, BiologicalSex, Goal } from "@/lib/calorieCalculator";

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string }[] = [
  { value: "sedentary", label: "Sedentary" },
  { value: "light", label: "Light" },
  { value: "moderate", label: "Moderate" },
  { value: "active", label: "Active" },
  { value: "very_active", label: "Very Active" },
];
const GOALS: { value: Goal; label: string }[] = [
  { value: "lose_weight", label: "Lose" },
  { value: "maintain_weight", label: "Maintain" },
  { value: "gain_weight", label: "Gain" },
];

export default function NativeMyHealth() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<BodyProfile | null>(null);
  const [target, setTarget] = useState<DailyTarget | null>(null);
  const [age, setAge] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [sex, setSex] = useState<BiologicalSex | "">("");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | "">("");
  const [goal, setGoal] = useState<Goal | "">("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getMyBodyProfile(), getMyCurrentTarget()]).then(([bodyProfile, currentTarget]) => {
      setProfile(bodyProfile);
      setTarget(currentTarget);
      if (bodyProfile) {
        if (bodyProfile.date_of_birth) {
          const dob = new Date(bodyProfile.date_of_birth);
          setAge(String(new Date().getFullYear() - dob.getFullYear()));
        }
        setHeightCm(bodyProfile.height_cm ? String(bodyProfile.height_cm) : "");
        setWeightKg(bodyProfile.weight_kg ? String(bodyProfile.weight_kg) : "");
        setSex(bodyProfile.biological_sex ?? "");
        setActivityLevel(bodyProfile.activity_level ?? "");
        setGoal(bodyProfile.goal ?? "");
      }
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    setMessage(null);

    const ageNum = Number(age);
    const dateOfBirth = ageNum
      ? new Date(new Date().getFullYear() - ageNum, 0, 1).toISOString().slice(0, 10)
      : null;

    await upsertMyBodyProfile({
      date_of_birth: dateOfBirth,
      height_cm: heightCm ? Number(heightCm) : null,
      weight_kg: weightKg ? Number(weightKg) : null,
      biological_sex: sex || null,
      activity_level: activityLevel || null,
      goal: goal || null,
    });

    const outcome = await recalculateMyDailyTarget();
    if (outcome.ok) {
      setTarget(outcome.target);
      setMessage("Saved — your daily target has been updated.");
    } else if (outcome.reason === "REQUIRES_DOCTOR_MINOR") {
      setMessage("Saved. Daily targets for users under 18 should be set by your doctor.");
    } else {
      setMessage("Saved. Add all fields above to see an estimated daily target.");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <AppScreen title="My Health" back className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </AppScreen>
    );
  }

  return (
    <AppScreen title="My Health" back className="mx-auto w-full max-w-lg px-4 pb-8 pt-3">
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-navy to-primary p-5 text-white shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Daily Target</p>
        {target ? (
          <>
            <p className="mt-1 font-display text-3xl font-extrabold">
              {Math.round(target.daily_target)} kcal
            </p>
            <p className="mt-1 text-xs text-white/80">
              {target.source === "doctor"
                ? "Target set by Dr. Monzer"
                : "Estimated from your body profile"}
            </p>
          </>
        ) : (
          <p className="mt-1 text-sm text-white/85">
            Complete the fields below to see your estimated target.
          </p>
        )}
      </div>

      {profile?.food_allergies && profile.food_allergies.length > 0 && (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          Allergies on file: {profile.food_allergies.join(", ")}
          {profile.food_allergies_other ? `, ${profile.food_allergies_other}` : ""}
        </div>
      )}

      <div className="mt-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Age
            </label>
            <Input
              className="mt-1.5"
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Height (cm)
            </label>
            <Input
              className="mt-1.5"
              type="number"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
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
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Sex
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
          <div className="mt-1.5 grid grid-cols-5 gap-1.5">
            {ACTIVITY_LEVELS.map((a) => (
              <button
                key={a.value}
                type="button"
                onClick={() => setActivityLevel(a.value)}
                className={cn(
                  "cursor-pointer rounded-lg border px-1 py-2 text-[0.65rem] font-semibold transition-colors",
                  activityLevel === a.value
                    ? "border-primary bg-secondary/60 text-primary"
                    : "border-border text-navy/70",
                )}
              >
                {a.label}
              </button>
            ))}
          </div>
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

        {message && (
          <Alert className="border-border/70 bg-secondary/60">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full cursor-pointer justify-center"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Save &amp; Recalculate
            </>
          )}
        </Button>
      </div>
    </AppScreen>
  );
}

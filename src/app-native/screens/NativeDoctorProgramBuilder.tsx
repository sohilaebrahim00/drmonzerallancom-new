import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Copy, Loader2, Plus } from "lucide-react";

import { AppScreen } from "@/app-native/components/AppScreen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  activateProgram,
  copyProgramDay,
  getProgramDay,
  saveProgramItem,
  type MealType,
  type ProgramDay,
} from "@/services/programService";
import { PROGRAM_LENGTH_DAYS } from "@/config/features";

const MEAL_TYPES: MealType[] = ["breakfast", "snack", "lunch", "dinner"];

export default function NativeDoctorProgramBuilder() {
  const { programId } = useParams<{ programId: string }>();
  const [dayNumber, setDayNumber] = useState(1);
  const [day, setDay] = useState<ProgramDay | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<{ mealType: MealType; title: string; calories: string }>({
    mealType: "breakfast",
    title: "",
    calories: "",
  });
  const [saving, setSaving] = useState(false);
  const [activating, setActivating] = useState(false);
  const [activated, setActivated] = useState(false);

  function loadDay() {
    if (!programId) return;
    setLoading(true);
    getProgramDay(programId, dayNumber).then((d) => {
      setDay(d);
      setLoading(false);
    });
  }

  useEffect(loadDay, [programId, dayNumber]);

  async function handleAddItem() {
    if (!day || !draft.title.trim() || saving) return;
    setSaving(true);
    await saveProgramItem(day.id, {
      meal_type: draft.mealType,
      title: draft.title.trim(),
      description: null,
      suggested_foods: null,
      portion_guidance: null,
      approximate_calories: draft.calories ? Number(draft.calories) : null,
      time_suggestion: null,
      sort_order: day.items.length,
    });
    setDraft({ mealType: "breakfast", title: "", calories: "" });
    setSaving(false);
    loadDay();
  }

  async function handleCopyPreviousDay() {
    if (!programId || dayNumber <= 1 || saving) return;
    setSaving(true);
    await copyProgramDay(programId, dayNumber - 1, dayNumber);
    setSaving(false);
    loadDay();
  }

  async function handleActivate() {
    if (!programId || activating) return;
    setActivating(true);
    const result = await activateProgram(programId);
    setActivating(false);
    if (result.ok) setActivated(true);
  }

  return (
    <AppScreen title="Build Program" back className="mx-auto w-full max-w-lg px-4 pb-8 pt-3">
      <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-card p-3 shadow-sm">
        <button
          type="button"
          onClick={() => setDayNumber((d) => Math.max(1, d - 1))}
          disabled={dayNumber <= 1}
          className="cursor-pointer rounded-full p-1.5 text-navy disabled:opacity-30"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="font-display text-base font-bold text-navy">
          Day {dayNumber} of {PROGRAM_LENGTH_DAYS}
        </p>
        <button
          type="button"
          onClick={() => setDayNumber((d) => Math.min(PROGRAM_LENGTH_DAYS, d + 1))}
          disabled={dayNumber >= PROGRAM_LENGTH_DAYS}
          className="cursor-pointer rounded-full p-1.5 text-navy disabled:opacity-30"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {dayNumber > 1 && (
        <button
          type="button"
          onClick={handleCopyPreviousDay}
          disabled={saving}
          className="mt-2.5 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-border/70 py-2.5 text-xs font-semibold text-primary hover:border-turquoise disabled:opacity-60"
        >
          <Copy className="h-3.5 w-3.5" /> Copy Previous Day
        </button>
      )}

      {loading ? (
        <div className="mt-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {day?.items.map((item) => (
            <div key={item.id} className="rounded-xl border border-border/70 bg-card p-3">
              <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-primary">
                {item.meal_type}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-navy">{item.title}</p>
              {item.approximate_calories && (
                <p className="text-xs text-muted-foreground">~{item.approximate_calories} kcal</p>
              )}
            </div>
          ))}
          {(!day || day.items.length === 0) && (
            <p className="py-3 text-center text-xs text-muted-foreground">
              No items yet for this day.
            </p>
          )}
        </div>
      )}

      <div className="mt-4 rounded-xl border border-dashed border-border/70 p-3.5">
        <p className="text-xs font-semibold text-navy">Add meal item</p>
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {MEAL_TYPES.map((mt) => (
            <button
              key={mt}
              type="button"
              onClick={() => setDraft((d) => ({ ...d, mealType: mt }))}
              className={cn(
                "cursor-pointer rounded-lg border px-1 py-1.5 text-[0.65rem] font-semibold capitalize transition-colors",
                draft.mealType === mt
                  ? "border-primary bg-secondary/60 text-primary"
                  : "border-border text-navy/70",
              )}
            >
              {mt}
            </button>
          ))}
        </div>
        <Input
          className="mt-2"
          value={draft.title}
          onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          placeholder="e.g. Grilled chicken, rice, vegetables"
        />
        <Input
          className="mt-2"
          type="number"
          value={draft.calories}
          onChange={(e) => setDraft((d) => ({ ...d, calories: e.target.value }))}
          placeholder="Approx. calories (optional)"
        />
        <Button
          onClick={handleAddItem}
          disabled={!draft.title.trim() || saving}
          className="mt-2 w-full cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Add Item
        </Button>
      </div>

      <Button
        onClick={handleActivate}
        disabled={activating || activated}
        className="mt-6 w-full cursor-pointer"
      >
        {activating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : activated ? (
          "Program Active"
        ) : (
          "Activate Program"
        )}
      </Button>
    </AppScreen>
  );
}

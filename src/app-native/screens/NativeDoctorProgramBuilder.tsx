import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  CaretLeft,
  CaretRight,
  CheckCircle,
  CircleNotch,
  CopySimple,
  Plus,
} from "@phosphor-icons/react";

import { AppScreen } from "@/app-native/components/AppScreen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  activateProgram,
  copyProgramDay,
  getProgramById,
  getProgramDay,
  saveProgramItem,
  uploadProgramPdf,
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
  const [patientNotified, setPatientNotified] = useState(false);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfMessage, setPdfMessage] = useState<string | null>(null);
  const [pdfAttached, setPdfAttached] = useState(false);

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

  /**
   * Attach a PDF written outside the builder (Word, Canva) to this program.
   *
   * An ADDITION to the structured builder, not a replacement — the builder
   * renders on a phone without downloading, can be edited, and completion can
   * be tracked against it. This exists so existing customers get something
   * this week rather than after every meal is re-typed.
   */
  async function handlePdf(file: File | null) {
    if (!file || !programId) return;
    setPdfUploading(true);
    setPdfMessage(null);
    const active = await getProgramById(programId);
    if (!active) {
      setPdfUploading(false);
      setPdfMessage("Could not load this program.");
      return;
    }
    const res = await uploadProgramPdf(active, file);
    setPdfUploading(false);
    if (res.ok) {
      setPdfAttached(true);
      setPdfMessage("PDF attached. The patient can download it from their program page.");
    } else {
      setPdfMessage(res.error);
    }
  }

  async function handleActivate() {
    if (!programId || activating) return;
    setActivating(true);
    const result = await activateProgram(programId);
    setActivating(false);
    if (result.ok) {
      setActivated(true);
      // The program is active either way; this only records whether the
      // patient was actually emailed, so the button never implies a
      // notification that did not go out.
      setPatientNotified(result.notified);
    }
  }

  return (
    <AppScreen title="Build Program" back className="mx-auto w-full max-w-2xl px-4 pb-8 pt-3">
      <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-card p-3 shadow-sm">
        <button
          type="button"
          onClick={() => setDayNumber((d) => Math.max(1, d - 1))}
          disabled={dayNumber <= 1}
          aria-label="Previous day"
          className="cursor-pointer rounded-full p-1.5 text-navy disabled:opacity-30"
        >
          <CaretLeft className="h-5 w-5" />
        </button>
        <p className="font-display text-base font-bold text-navy">
          Day {dayNumber} of {PROGRAM_LENGTH_DAYS}
        </p>
        <button
          type="button"
          onClick={() => setDayNumber((d) => Math.min(PROGRAM_LENGTH_DAYS, d + 1))}
          disabled={dayNumber >= PROGRAM_LENGTH_DAYS}
          aria-label="Next day"
          className="cursor-pointer rounded-full p-1.5 text-navy disabled:opacity-30"
        >
          <CaretRight className="h-5 w-5" />
        </button>
      </div>

      {dayNumber > 1 && (
        <button
          type="button"
          onClick={handleCopyPreviousDay}
          disabled={saving}
          className="mt-2.5 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-border/70 py-2.5 text-xs font-semibold text-primary hover:border-turquoise disabled:opacity-60"
        >
          <CopySimple className="h-3.5 w-3.5" /> Copy Previous Day
        </button>
      )}

      <div className="mt-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-5">
        <div>
          <p className="mb-1.5 px-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground/80">
            This Day&apos;s Meals
          </p>
          {loading ? (
            <div className="flex justify-center py-6">
              <CircleNotch className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-2">
              {day?.items.map((item) => (
                <div key={item.id} className="rounded-xl border border-border/70 bg-card p-3">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-primary">
                    {item.meal_type}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-navy">{item.title}</p>
                  {item.approximate_calories && (
                    <p className="text-xs text-muted-foreground">
                      ~{item.approximate_calories} kcal
                    </p>
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
        </div>

        <div className="mt-4 rounded-xl border border-dashed border-border/70 p-3.5 lg:mt-0">
          <p className="text-xs font-semibold text-navy">Add Meal Item</p>
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
            {saving ? (
              <CircleNotch className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Add Item
          </Button>
        </div>
      </div>

      {/* Optional PDF. The structured builder above remains the primary
          surface — this is for a program already written in Word or Canva. */}
      <div className="mt-6 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
        <p className="text-sm font-semibold text-navy">Attach a PDF (optional)</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          If you wrote this program in Word or Canva, attach it here and the patient can download
          it. PDF only, up to 10 MB. The day-by-day plan above still works on its own.
        </p>
        <input
          type="file"
          accept="application/pdf"
          disabled={pdfUploading}
          onChange={(e) => handlePdf(e.target.files?.[0] ?? null)}
          className="mt-3 block w-full text-xs text-muted-foreground file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-secondary file:px-4 file:py-2 file:text-xs file:font-semibold file:text-navy"
        />
        {pdfUploading && (
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <CircleNotch className="h-3.5 w-3.5 animate-spin" /> Uploading…
          </p>
        )}
        {pdfMessage && (
          <p
            className={cn(
              "mt-2 text-xs",
              pdfAttached ? "font-semibold text-turquoise" : "text-destructive",
            )}
          >
            {pdfMessage}
          </p>
        )}
      </div>

      <Button
        onClick={handleActivate}
        disabled={activating || activated}
        className="mt-6 w-full cursor-pointer"
      >
        {activating ? (
          <CircleNotch className="h-4 w-4 animate-spin" />
        ) : activated ? (
          <>
            <CheckCircle className="h-4 w-4" weight="fill" />{" "}
            {patientNotified ? "Program Active — Patient Notified" : "Program Active"}
          </>
        ) : (
          "Activate Program"
        )}
      </Button>
      {activated && !patientNotified && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          The program is active, but we could not email the patient. Let them know it is ready.
        </p>
      )}
    </AppScreen>
  );
}

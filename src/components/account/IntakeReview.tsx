import { useEffect, useState } from "react";
import { Loader2, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { business } from "@/data/business";
import { INTAKE_QUESTIONS, type IntakeAnswerColumn } from "@/data/intakeQuestions";
import {
  getMyIntake,
  intakeAnswers,
  intakeAnsweredCount,
  updateIntakeAnswer,
  type ConsultationIntake,
} from "@/services/intakeService";

/**
 * Lets the patient read back what was recorded about them before the call,
 * and correct any answer (3.1.6). This is their medical information — they do
 * not get to write it once into a box they can never reopen.
 *
 * Renders nothing at all until an intake exists, so a patient who has not
 * started one is not nagged by an empty panel.
 */
export function IntakeReview({ consultationRequestId }: { consultationRequestId: string }) {
  const [intake, setIntake] = useState<ConsultationIntake | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<IntakeAnswerColumn | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMyIntake(consultationRequestId).then((row) => {
      if (cancelled) return;
      setIntake(row);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [consultationRequestId]);

  async function save(column: IntakeAnswerColumn) {
    if (!intake) return;
    setSaving(true);
    setError(null);
    const res = await updateIntakeAnswer(intake.id, column, draft);
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setIntake({ ...intake, [column]: draft.trim() || null });
    setEditing(null);
  }

  if (loading || !intake) return null;

  const rows = intakeAnswers(intake);
  const answered = intakeAnsweredCount(intake);

  return (
    <div className="mt-4 rounded-xl border border-border/70 bg-card p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Your Pre-Consultation Answers
        </p>
        <p className="text-xs text-muted-foreground">
          {answered} of {rows.length} answered
        </p>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        This is the right place for test results, medicines and supplements — only{" "}
        {business.doctorName} can read it. You can change any answer before your call.
      </p>

      {error && <p className="mt-2 text-xs font-semibold text-destructive">{error}</p>}

      <div className="mt-3 space-y-3">
        {rows.map((row) => {
          const column = INTAKE_QUESTIONS[row.number - 1].column;
          const isEditing = editing === column;
          return (
            <div
              key={row.number}
              className="border-t border-border/50 pt-3 first:border-0 first:pt-0"
            >
              <p className="text-xs font-semibold text-navy">{row.prompt}</p>

              {isEditing ? (
                <div className="mt-2">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-border bg-background p-2 text-sm"
                    aria-label={`Your answer to: ${row.label}`}
                  />
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      className="cursor-pointer"
                      disabled={saving}
                      onClick={() => save(column)}
                    >
                      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="cursor-pointer"
                      onClick={() => setEditing(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-1 flex items-start justify-between gap-3">
                  {row.answer ? (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-navy">
                      {row.answer}
                    </p>
                  ) : (
                    <p className="text-sm italic text-muted-foreground">
                      {row.state === "skipped" ? "You skipped this" : "Not answered yet"}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(column);
                      setDraft(row.answer ?? "");
                    }}
                    className="inline-flex shrink-0 cursor-pointer items-center gap-1 text-xs font-semibold text-primary hover:text-turquoise"
                  >
                    <Pencil className="h-3 w-3" /> {row.answer ? "Edit" : "Add"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

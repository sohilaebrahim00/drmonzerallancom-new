import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList } from "lucide-react";

import { business } from "@/data/business";
import { INTAKE_QUESTION_COUNT } from "@/data/intakeQuestions";
import {
  firstUnansweredQuestion,
  getMyIntake,
  intakeAnsweredCount,
  type ConsultationIntake,
} from "@/services/intakeService";

/**
 * The account-page nudge toward the optional intake.
 *
 * Renders NOTHING once every question has an answer — a patient who has
 * finished must never be nagged, and a patient who ignores this entirely must
 * never see anything that reads as a problem. Hence no warning colours, no
 * "required", no red: it is an invitation and looks like one.
 *
 * Deep-links to the first unanswered question so "Continue" resumes where
 * they stopped rather than restarting at one.
 */
export function IntakePrompt({ consultationRequestId }: { consultationRequestId: string }) {
  const [intake, setIntake] = useState<ConsultationIntake | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return null;

  const answered = intakeAnsweredCount(intake);
  const resumeAt = firstUnansweredQuestion(intake);

  // Every question answered — nothing to prompt. Say nothing at all.
  if (resumeAt === null) return null;

  const started = answered > 0;
  const href = `/account/consultations/intake${started ? `?q=${resumeAt}` : ""}`;

  return (
    <div className="mt-4 rounded-xl border border-turquoise/40 bg-turquoise/5 p-4">
      <div className="flex items-start gap-3">
        <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-turquoise" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-navy">
            {started ? "Finish your pre-consultation questions" : "Help your doctor prepare"}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {started
              ? `${answered} of ${INTAKE_QUESTION_COUNT} answered. Pick up where you left off — it's optional, and you can stop again any time.`
              : `A few questions so ${business.doctorName} can prepare for your call. Optional, about 3 minutes.`}
          </p>
          <Link
            to={href}
            className="mt-2 inline-flex cursor-pointer items-center text-xs font-semibold text-primary hover:text-turquoise"
          >
            {started ? "Continue" : "Start"} →
          </Link>
        </div>
      </div>
    </div>
  );
}

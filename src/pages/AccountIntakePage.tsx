import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, ChevronLeft, Loader2 } from "lucide-react";

import { Seo } from "@/components/seo/Seo";
import { Reveal } from "@/components/common/Reveal";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/context/AuthContext";
import { business } from "@/data/business";
import { INTAKE_QUESTIONS, INTAKE_QUESTION_COUNT } from "@/data/intakeQuestions";
import { getMyConsultationRequests, type ConsultationRequest } from "@/services/membershipService";
import {
  ensureMyIntake,
  firstUnansweredQuestion,
  intakeAnswers,
  intakeAnsweredCount,
  saveIntakeStep,
  type ConsultationIntake,
} from "@/services/intakeService";
import { cn } from "@/lib/utils";

/**
 * The pre-consultation intake as a real page rather than a chat.
 *
 * Phase 3.1 put these questions in the AI concierge and they worked, but
 * almost nobody opens a floating chat widget — so most patients never learned
 * the questions existed. Same eight questions, same storage, same RLS, behind
 * a front door people actually walk through. The chat flow is untouched and
 * still works for anyone who starts there.
 *
 * The intake is OPTIONAL, confirmed by the doctor. Nothing here gates
 * booking, paying or joining a call, and there is deliberately no warning
 * styling anywhere: a patient who ignores it entirely should never see
 * something that looks like a problem.
 */
export default function AccountIntakePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<ConsultationRequest | null>(null);
  const [intake, setIntake] = useState<ConsultationIntake | null>(null);
  const [current, setCurrent] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState(false);

  // 3.2.3 — deep link. The account card and the email drop the patient at the
  // question they stopped on rather than back at question one.
  const requestedQuestion = Number(searchParams.get("q"));

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const requests = await getMyConsultationRequests(user.id);
      const now = Date.now();
      const upcoming = requests
        .filter(
          (r) =>
            (r.status === "pending" || r.status === "confirmed") &&
            new Date(r.appointment_start).getTime() > now,
        )
        .sort(
          (a, b) =>
            new Date(a.appointment_start).getTime() - new Date(b.appointment_start).getTime(),
        )[0];
      if (cancelled) return;

      if (!upcoming) {
        setLoading(false);
        return;
      }
      setBooking(upcoming);
      const row = await ensureMyIntake(upcoming.id);
      if (cancelled) return;
      setIntake(row);

      const resumeAt =
        requestedQuestion >= 1 && requestedQuestion <= INTAKE_QUESTION_COUNT
          ? requestedQuestion
          : firstUnansweredQuestion(row);
      if (resumeAt === null) {
        setReviewing(true);
      } else {
        setCurrent(resumeAt);
        setDraft((row?.[INTAKE_QUESTIONS[resumeAt - 1].column] as string | null) ?? "");
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const question = current ? INTAKE_QUESTIONS[current - 1] : null;
  const answered = useMemo(() => intakeAnsweredCount(intake), [intake]);

  function goTo(n: number) {
    if (!intake) return;
    setCurrent(n);
    setDraft((intake[INTAKE_QUESTIONS[n - 1].column] as string | null) ?? "");
    setReviewing(false);
    setError(null);
  }

  async function commit(answer: string | null) {
    if (!intake || !current) return;
    setSaving(true);
    setError(null);
    const res = await saveIntakeStep(intake, current, answer);
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setIntake(res.intake);
    if (current >= INTAKE_QUESTION_COUNT) {
      setReviewing(true);
      setCurrent(null);
    } else {
      const n = current + 1;
      setCurrent(n);
      setDraft((res.intake[INTAKE_QUESTIONS[n - 1].column] as string | null) ?? "");
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-16 sm:px-10 sm:py-20">
      <Seo
        title="Before Your Consultation"
        description="A few optional questions before your consultation."
        path="/account/consultations/intake"
        noindex
      />

      <Reveal direction="up">
        <Link
          to="/account"
          className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-navy"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Back to my account
        </Link>
        <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
          Before Your Consultation
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          A few questions so {business.doctorName} can prepare for your call. Every question is
          optional, you can stop at any point, and whatever you answer is saved as you go. Only{" "}
          {business.doctorName} can read your answers.
        </p>
      </Reveal>

      {loading ? (
        <div className="mt-10 flex items-center justify-center py-16" role="status">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      ) : !booking ? (
        <p className="mt-8 rounded-2xl border border-dashed border-border/70 bg-secondary/30 p-6 text-center text-sm text-muted-foreground">
          These questions are for an upcoming consultation, and you don&apos;t have one booked right
          now.{" "}
          <Link
            to="/account/consultations"
            className="font-semibold text-primary hover:text-turquoise"
          >
            Book a consultation
          </Link>{" "}
          and they&apos;ll be here waiting.
        </p>
      ) : !intake ? (
        <Alert className="mt-8">
          <AlertDescription>
            We couldn&apos;t open your answers just now. Please try again in a moment — your
            consultation is unaffected.
          </AlertDescription>
        </Alert>
      ) : reviewing ? (
        <ReviewStep
          intake={intake}
          answered={answered}
          onEdit={goTo}
          onDone={() => navigate("/account")}
        />
      ) : (
        question &&
        current !== null && (
          <div className="mt-8">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Question {current} of {INTAKE_QUESTION_COUNT}
              </p>
              <p className="text-xs text-muted-foreground">{answered} answered so far</p>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-turquoise transition-all"
                style={{ width: `${((current ?? 1) / INTAKE_QUESTION_COUNT) * 100}%` }}
              />
            </div>

            <div className="mt-6 rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
              <p className="font-display text-base font-bold leading-relaxed text-navy">
                {question.prompt}
              </p>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={6}
                placeholder="Type as much or as little as you like."
                className="mt-4 w-full rounded-xl border border-border bg-background p-3 text-sm leading-relaxed"
                aria-label={question.label}
              />

              {error && <p className="mt-2 text-xs font-semibold text-destructive">{error}</p>}

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button
                  className="cursor-pointer"
                  disabled={saving || draft.trim().length === 0}
                  onClick={() => commit(draft)}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save and continue"}
                </Button>
                {/* Skipping is a normal choice, not a mistake — same weight as
                    any other secondary control, no warning styling. */}
                <Button
                  variant="ghost"
                  className="cursor-pointer text-muted-foreground"
                  disabled={saving}
                  onClick={() => commit(null)}
                >
                  Skip this question
                </Button>
                {current > 1 && (
                  <button
                    type="button"
                    onClick={() => goTo(current - 1)}
                    className="ml-auto inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-navy"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Previous question
                  </button>
                )}
              </div>
            </div>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              You can close this page at any time — your answers are saved as you go, and you can
              pick up where you left off.
            </p>
          </div>
        )
      )}
    </div>
  );
}

/** The final review: every question and answer, editable before finishing. */
function ReviewStep({
  intake,
  answered,
  onEdit,
  onDone,
}: {
  intake: ConsultationIntake;
  answered: number;
  onEdit: (n: number) => void;
  onDone: () => void;
}) {
  const rows = intakeAnswers(intake);
  return (
    <div className="mt-8">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-turquoise" />
        <p className="font-display text-lg font-bold text-navy">Your answers</p>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {answered} of {INTAKE_QUESTION_COUNT} answered. Change anything you like before your call —
        this stays open right up until you speak.
      </p>

      <div className="mt-5 space-y-4">
        {rows.map((row) => (
          <div
            key={row.number}
            className={cn(
              "rounded-2xl border p-4",
              row.answer ? "border-border/70 bg-card" : "border-dashed border-border",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-semibold text-navy">
                {row.number}. {row.label}
              </p>
              <button
                type="button"
                onClick={() => onEdit(row.number)}
                className="shrink-0 cursor-pointer text-xs font-semibold text-primary hover:text-turquoise"
              >
                {row.answer ? "Edit" : "Answer"}
              </button>
            </div>
            {row.answer ? (
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-navy">
                {row.answer}
              </p>
            ) : (
              <p className="mt-2 text-sm italic text-muted-foreground">Not answered</p>
            )}
          </div>
        ))}
      </div>

      <Button className="mt-6 w-full cursor-pointer" onClick={onDone}>
        Done
      </Button>
    </div>
  );
}

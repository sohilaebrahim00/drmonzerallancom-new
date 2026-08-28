import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Download, Loader2 } from "lucide-react";

import { Seo } from "@/components/seo/Seo";
import { Reveal } from "@/components/common/Reveal";
import { business } from "@/data/business";
import {
  currentProgramDayNumber,
  getMyActiveProgram,
  getProgramDay,
  getProgramPdfUrl,
  type NutritionProgram,
  type ProgramDay,
} from "@/services/programService";

const MEAL_ORDER = ["breakfast", "snack", "lunch", "dinner"] as const;

/**
 * The page the doctor's "Open My Program" email button points at.
 *
 * It previously pointed at /my-program on app.monzerallan.com — a route that
 * existed only in the app shell (AppExperience), on a host that serves the
 * marketing site. Every patient who clicked it landed somewhere wrong. This
 * is the same data the app screen reads, through the same service, on the
 * website router where the link actually resolves.
 */
export default function MyProgramPage() {
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<NutritionProgram | null>(null);
  const [day, setDay] = useState<ProgramDay | null>(null);
  const [dayNumber, setDayNumber] = useState(1);
  const [pdfBusy, setPdfBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const active = await getMyActiveProgram();
      if (cancelled) return;
      setProgram(active);
      if (active) {
        const n = currentProgramDayNumber(active);
        setDayNumber(n);
        const today = await getProgramDay(active.id, n);
        if (!cancelled) setDay(today);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function openPdf() {
    if (!program?.pdf_path) return;
    setPdfBusy(true);
    const url = await getProgramPdfUrl(program.pdf_path);
    setPdfBusy(false);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16 sm:px-10 sm:py-20">
      <Seo
        title="My Program"
        description="Your personal nutrition program."
        path="/my-program"
        noindex
      />

      <Reveal direction="up">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
          My Program
        </h1>
      </Reveal>

      {loading ? (
        <div className="mt-10 flex items-center justify-center py-16" role="status">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      ) : !program ? (
        /* Already paid. Selling them a package again is the bug, not the fix —
           so this says what is actually happening and offers no purchase CTA. */
        <div className="mt-10 rounded-2xl border border-border/70 bg-card p-8 text-center shadow-sm">
          <p className="font-display text-lg font-bold text-navy">
            {business.doctorName} is preparing your program
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            Your purchase is confirmed. Your personal program is being written for you, and it will
            appear here as soon as it is ready — you&apos;ll get an email the moment it is.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link to="/account" className="text-sm font-semibold text-primary hover:text-turquoise">
              My account
            </Link>
            <Link to="/contact" className="text-sm font-semibold text-primary hover:text-turquoise">
              Ask a question
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
            <p className="font-display text-lg font-bold text-navy">{program.title}</p>
            {program.goal && (
              <p className="mt-1 text-sm text-muted-foreground">Goal: {program.goal}</p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Day {dayNumber}
              {program.daily_calorie_target
                ? ` · about ${program.daily_calorie_target} kcal a day`
                : ""}
            </p>

            {program.pdf_path && (
              <button
                type="button"
                onClick={openPdf}
                disabled={pdfBusy}
                className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full border border-turquoise/50 bg-turquoise/10 px-5 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-turquoise/20"
              >
                {pdfBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Download your program (PDF)
              </button>
            )}

            {program.general_instructions && (
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-navy">
                {program.general_instructions}
              </p>
            )}
          </div>

          {day && (
            <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Today — day {day.day_number}
              </p>
              {day.doctor_instructions && (
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-navy">
                  {day.doctor_instructions}
                </p>
              )}
              <div className="mt-4 space-y-4">
                {MEAL_ORDER.map((meal) => {
                  const items = day.items.filter((i) => i.meal_type === meal);
                  if (items.length === 0) return null;
                  return (
                    <div key={meal}>
                      <p className="text-xs font-semibold uppercase tracking-wide text-turquoise">
                        {meal}
                      </p>
                      <ul className="mt-1 space-y-2">
                        {items.map((item) => (
                          <li key={item.id} className="text-sm leading-relaxed text-navy">
                            <span className="font-semibold">{item.title}</span>
                            {item.portion_guidance ? ` — ${item.portion_guidance}` : ""}
                            {item.description && (
                              <span className="block text-muted-foreground">
                                {item.description}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

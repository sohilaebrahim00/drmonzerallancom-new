import { Link } from "react-router-dom";
import { BookOpen, CalendarClock, CreditCard, Sparkles, UserRound } from "lucide-react";

import type { LucideIcon } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { useTranslate, type SimpleTranslationKey } from "@/i18n";

const PREVIEW_CARDS = [
  {
    icon: UserRound,
    titleKey: "memberPreview.card1.title",
    detailKey: "memberPreview.card1.detail",
  },
  {
    icon: CreditCard,
    titleKey: "memberPreview.card2.title",
    detailKey: "memberPreview.card2.detail",
  },
  {
    icon: CalendarClock,
    titleKey: "memberPreview.card3.title",
    detailKey: "memberPreview.card3.detail",
  },
  {
    icon: Sparkles,
    titleKey: "memberPreview.card4.title",
    detailKey: "memberPreview.card4.detail",
  },
  {
    icon: BookOpen,
    titleKey: "memberPreview.card5.title",
    detailKey: "memberPreview.card5.detail",
  },
] satisfies { icon: LucideIcon; titleKey: SimpleTranslationKey; detailKey: SimpleTranslationKey }[];

export function MemberExperiencePreview() {
  const { user } = useAuth();
  const t = useTranslate();
  if (user) return null;

  return (
    <section className="relative py-20 sm:py-28" aria-labelledby="member-preview-heading">
      <div className="mx-auto w-full max-w-6xl px-6 sm:px-10">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p
              dir="auto"
              className="text-xs font-semibold uppercase tracking-[0.28em] text-primary"
            >
              {t("memberPreview.eyebrow")}
            </p>
            <h2
              dir="auto"
              id="member-preview-heading"
              className="mt-4 font-display text-2xl font-extrabold leading-tight tracking-tight text-navy sm:text-3xl"
            >
              {t("memberPreview.title")}
            </h2>
            <p dir="auto" className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              {t("memberPreview.description")}
            </p>
            <Link
              to="/packages"
              className="mt-6 inline-flex w-fit cursor-pointer items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-turquoise"
            >
              <Sparkles className="h-4 w-4" /> {t("cta.explorePrograms")}
            </Link>
          </div>

          <div>
            <div className="rounded-3xl border border-border/70 bg-card p-3 shadow-[0_30px_70px_-30px_rgba(23,35,59,0.3)] sm:p-5">
              <div className="rounded-2xl bg-gradient-to-br from-navy to-primary p-5 text-white">
                <p
                  dir="auto"
                  className="text-xs font-semibold uppercase tracking-wide text-white/70"
                >
                  {t("memberPreview.illustrative")}
                </p>
                <p dir="auto" className="mt-2 font-display text-lg font-bold">
                  {t("memberPreview.samplePlan")}
                </p>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-white/80">{t("memberPreview.credits")}</span>
                  <span className="font-semibold">{t("memberPreview.creditsSample")}</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                  <div className="h-full w-1/2 rounded-full bg-turquoise" />
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-white/80">{t("memberPreview.next")}</span>
                  <span className="font-semibold">{t("memberPreview.nextSample")}</span>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {PREVIEW_CARDS.map((card) => (
                  <div
                    key={card.titleKey}
                    className="flex items-start gap-3 rounded-xl border border-border/60 bg-background p-4"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                      <card.icon className="h-4.5 w-4.5" />
                    </span>
                    <div>
                      <p dir="auto" className="text-sm font-semibold text-navy">
                        {t(card.titleKey)}
                      </p>
                      <p
                        dir="auto"
                        className="mt-0.5 text-xs leading-relaxed text-muted-foreground"
                      >
                        {t(card.detailKey)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

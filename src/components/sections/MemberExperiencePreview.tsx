import { Link } from "react-router-dom";
import { BookOpen, CalendarClock, CreditCard, Sparkles, UserRound } from "lucide-react";

import { Reveal } from "@/components/common/Reveal";
import { useAuth } from "@/context/AuthContext";

const PREVIEW_CARDS = [
  {
    icon: UserRound,
    title: "Active Membership",
    detail: "Plan, status, and renewal date at a glance",
  },
  {
    icon: CreditCard,
    title: "Consultation Credits",
    detail: "See how many credits you have left this month",
  },
  {
    icon: CalendarClock,
    title: "Upcoming Consultation",
    detail: "Your next confirmed Google Meet session",
  },
  {
    icon: Sparkles,
    title: "Request Consultation",
    detail: "Use a credit to request a new session anytime",
  },
  {
    icon: BookOpen,
    title: "Educational Resources",
    detail: "Articles and videos picked for your goals",
  },
];

export function MemberExperiencePreview() {
  const { user } = useAuth();
  if (user) return null;

  return (
    <section className="relative py-20 sm:py-28" aria-labelledby="member-preview-heading">
      <div className="mx-auto w-full max-w-6xl px-6 sm:px-10">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal direction="right">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
              Member Experience
            </p>
            <h2
              id="member-preview-heading"
              className="mt-4 font-display text-2xl font-extrabold leading-tight tracking-tight text-navy sm:text-3xl"
            >
              Your Membership, All in One Place
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              Once you join, your dashboard keeps your membership, consultation credits, and
              upcoming sessions organized in a single, simple view.
            </p>
            <Link
              to="/packages"
              className="mt-6 inline-flex w-fit cursor-pointer items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-turquoise"
            >
              <Sparkles className="h-4 w-4" /> Explore Memberships
            </Link>
          </Reveal>

          <Reveal direction="left" delay={0.1}>
            <div className="rounded-3xl border border-border/70 bg-card p-3 shadow-[0_30px_70px_-30px_rgba(23,35,59,0.3)] sm:p-5">
              <div className="rounded-2xl bg-gradient-to-br from-navy to-primary p-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
                  Member Dashboard Preview
                </p>
                <p className="mt-1 text-sm font-semibold">A preview of what&apos;s inside</p>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {PREVIEW_CARDS.map((card) => (
                  <div
                    key={card.title}
                    className="flex items-start gap-3 rounded-xl border border-border/60 bg-background p-4"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                      <card.icon className="h-4.5 w-4.5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-navy">{card.title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        {card.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

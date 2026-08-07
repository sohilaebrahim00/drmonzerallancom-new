import { CalendarCheck, CreditCard, Sparkles, UserPlus } from "lucide-react";

import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";

const STEPS = [
  {
    icon: Sparkles,
    title: "Choose a Package",
    description:
      "Pick Basic, Premium, or VIP Elite based on the support and consultation credits you need.",
  },
  {
    icon: UserPlus,
    title: "Create Your Account",
    description:
      "Set up your member login — this is where your membership and consultation history live.",
  },
  {
    icon: CreditCard,
    title: "Complete Payment",
    description: "Confirm your monthly membership securely to activate your consultation credits.",
  },
  {
    icon: CalendarCheck,
    title: "Request Consultations",
    description:
      "Use your credits to request online consultations over Google Meet, right from your dashboard.",
  },
];

export function HowMembershipWorks() {
  return (
    <section
      id="how-it-works"
      className="relative py-20 sm:py-28"
      aria-labelledby="how-it-works-heading"
    >
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-10">
        <SectionHeading
          eyebrow="Membership"
          title="How Membership Works"
          description="From choosing a package to your first consultation — a simple, transparent process."
        />

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <Reveal key={step.title} direction="up" delay={index * 0.08}>
              <div className="relative flex h-full flex-col items-center gap-3 rounded-2xl border border-border/70 bg-card p-6 text-center shadow-sm">
                <span className="absolute -top-3 left-1/2 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {index + 1}
                </span>
                <div className="mt-3 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-primary">
                  <step.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-base font-bold text-navy">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

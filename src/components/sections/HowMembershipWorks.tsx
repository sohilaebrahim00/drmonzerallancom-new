import { CalendarCheck, CreditCard, MessagesSquare, Sparkles, UserPlus, Video } from "lucide-react";

import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";

const STEPS = [
  {
    icon: Sparkles,
    title: "Choose Your Membership",
    description: "Pick Basic, Premium, or VIP Elite based on the support you need.",
  },
  {
    icon: UserPlus,
    title: "Create Your Member Account",
    description: "Your account is where your membership and consultation history live.",
  },
  {
    icon: CreditCard,
    title: "Access Your Consultation Credits",
    description: "Your monthly credit allowance activates as soon as your membership is confirmed.",
  },
  {
    icon: CalendarCheck,
    title: "Request Your Online Consultation",
    description: "Use a credit to request a session directly from your dashboard.",
  },
  {
    icon: Video,
    title: "Meet Through Google Meet",
    description: "Approved consultations happen over a secure Google Meet link.",
  },
  {
    icon: MessagesSquare,
    title: "Continue Your Nutrition Journey",
    description: "Ongoing guidance, follow-ups, and support for as long as you stay a member.",
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

        {/* Vertical journey on mobile, connected horizontal journey on desktop */}
        <div className="mt-14 flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-0">
          {STEPS.map((step, index) => (
            <Reveal
              key={step.title}
              direction="up"
              delay={index * 0.06}
              className="relative flex flex-1 gap-4 lg:flex-col lg:items-center lg:gap-3 lg:text-center"
            >
              {index < STEPS.length - 1 && (
                <span
                  className="absolute left-6 top-14 h-[calc(100%+1.5rem)] w-px bg-border lg:left-1/2 lg:top-6 lg:h-px lg:w-full lg:-translate-x-0 lg:translate-x-1/2"
                  aria-hidden="true"
                />
              )}
              <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-bold text-white shadow-md">
                {index + 1}
              </span>
              <div className="lg:px-2">
                <div className="flex items-center gap-2 lg:flex-col lg:gap-2">
                  <step.icon className="h-5 w-5 text-primary lg:h-6 lg:w-6" />
                  <h3 className="font-display text-sm font-bold text-navy sm:text-base">
                    {step.title}
                  </h3>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {step.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

import { CalendarCheck, ClipboardCheck, Lock, Sparkles, UserPlus, Video } from "lucide-react";

import { Reveal } from "@/components/common/Reveal";
import { Photo } from "@/components/common/Photo";

const STEPS = [
  {
    icon: Sparkles,
    title: "Choose Your Program",
    description: "Pick a Treatment program, and a tier based on how many consultations you need.",
  },
  {
    icon: Lock,
    title: "Complete Secure Payment",
    description:
      "A one-time payment, handled securely by Stripe — your card details never touch our servers.",
  },
  {
    icon: UserPlus,
    title: "Activate Your Account",
    description: "Once payment is confirmed, your account activates and you set your password.",
  },
  {
    icon: ClipboardCheck,
    title: "Access Your Consultation Credits",
    description: "Your program's consultation credits are ready as soon as your account is active.",
  },
  {
    icon: CalendarCheck,
    title: "Request an Online Consultation",
    description:
      "Use a credit to request a session directly from your dashboard, whenever you need it.",
  },
  {
    icon: Video,
    title: "Meet Through Google Meet",
    description: "Approved consultations happen over a secure Google Meet link.",
  },
];

export function HowProgramsWork() {
  return (
    <section
      id="how-it-works"
      className="relative isolate overflow-hidden bg-navy py-20 text-white sm:py-28"
      aria-labelledby="how-it-works-heading"
    >
      {/* Decorative background: capsules on one side dissolving into seeds,
          herbs and olive oil on the other. alt="" and aria-hidden because the
          heading beside it already carries the meaning.

          MIRRORED IN RTL. The photograph runs medication-to-food left to
          right; in Arabic the eye travels right to left, so unmirrored it
          states the reverse of what it means. The overlay gradient is
          mirrored with it so the dark end stays over the medication end.

          NOTE: nothing sets dir="rtl" yet — Phase 8 has not landed — so the
          rtl: rules below are inert today and correct the moment it does. */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <Photo
          base="/images/not-medication-1920"
          width={1920}
          height={1280}
          alt=""
          decorative
          mobileSource={{ base: "/images/not-medication-mobile", media: "(max-width: 700px)" }}
          className="block h-full w-full"
          imgClassName="h-full w-full object-cover rtl:-scale-x-100"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy/95 via-navy/85 to-navy/70 rtl:bg-gradient-to-l" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-6 sm:px-10">
        {/* SectionHeading is built for light sections (navy title, muted
            description). Rather than add a variant to a component used in a
            dozen places, this band states its own heading in light type. */}
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-turquoise">
            Programs
          </p>
          <h2
            id="how-it-works-heading"
            className="mx-auto mt-3 max-w-2xl font-display text-3xl font-extrabold leading-[1.15] tracking-tight text-white sm:text-4xl"
          >
            How It Works
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/75">
            From choosing a program to your first consultation — a simple, transparent, one-time
            process.
          </p>
        </div>

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
                  className="absolute left-6 top-14 h-[calc(100%+1.5rem)] w-px bg-white/25 lg:left-1/2 lg:top-6 lg:h-px lg:w-full lg:-translate-x-0 lg:translate-x-1/2"
                  aria-hidden="true"
                />
              )}
              <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-turquoise text-sm font-bold text-navy shadow-md">
                {index + 1}
              </span>
              <div className="lg:px-2">
                <div className="flex items-center gap-2 lg:flex-col lg:gap-2">
                  <step.icon className="h-5 w-5 text-primary lg:h-6 lg:w-6" />
                  <h3 className="font-display text-sm font-bold text-white sm:text-base">
                    {step.title}
                  </h3>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-white/70 sm:text-sm">
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

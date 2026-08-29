import { CalendarCheck, ClipboardCheck, Lock, Sparkles, UserPlus, Video } from "lucide-react";

import { Reveal } from "@/components/common/Reveal";
import { Photo } from "@/components/common/Photo";
import { useTranslate } from "@/i18n";

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
  const t = useTranslate();
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
        {/* Uniform, not a gradient. The old overlay ran navy/95 -> navy/70
            left to right, which put the LEAST cover over the right-hand side
            where the olive oil and figs are brightest — worst contrast exactly
            where the photograph is lightest — while burying the capsules on
            the left under 95% navy so the still life was invisible.
            A flat value is both more legible and more even. */}
        <div className="absolute inset-0 bg-navy/70" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-6 sm:px-10">
        {/* SectionHeading is built for light sections (navy title, muted
            description). Rather than add a variant to a component used in a
            dozen places, this band states its own heading in light type. */}
        <div className="text-center">
          {/* dir="auto" on the text-bearing leaves only, never on the wrapper:
              `dir` sets direction for an element's CHILDREN, so putting it on a
              layout container reorders that layout from whatever its first
              strong character happens to be. The page-level dir stays the
              authority for layout; these just stop a Latin run's trailing
              punctuation landing on the wrong side. */}
          <p
            dir="auto"
            className="text-xs font-semibold uppercase tracking-[0.28em] text-turquoise-light"
          >
            {t("howItWorks.eyebrow")}
          </p>
          <h2
            id="how-it-works-heading"
            dir="auto"
            className="mx-auto mt-3 max-w-2xl font-display text-3xl font-extrabold leading-[1.15] tracking-tight text-white sm:text-4xl"
          >
            {t("howItWorks.title")}
          </h2>
          <p dir="auto" className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/75">
            {t("howItWorks.description")}
          </p>
        </div>

        {/* Three columns wrapping to two rows, not six in a single row. At
            1440px six columns are 200px each, which wraps every title and
            leaves the copy as cramped centred fragments; three gives ~373px
            and the text reads as sentences.

            The connector line went with it: a rule joining six items in a row
            described the sequence, but drawn across a grid that wraps it would
            imply the wrong order. The numbers carry the sequence now.

            Left-aligned, because centred text at this width fragments on
            every wrap. */}
        <div className="mt-14 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((step, index) => (
            <Reveal
              key={step.title}
              direction="up"
              delay={index * 0.06}
              className="flex gap-4 text-start"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-turquoise text-sm font-bold text-navy shadow-md">
                {index + 1}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <step.icon className="h-5 w-5 shrink-0 text-turquoise-light" />
                  <h3 className="font-display text-base font-bold text-white">{step.title}</h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-white/85">{step.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

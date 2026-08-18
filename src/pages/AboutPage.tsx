import { Link } from "react-router-dom";
import { CalendarCheck, Compass, Sparkles, Target } from "lucide-react";

import { Seo } from "@/components/seo/Seo";
import { Reveal } from "@/components/common/Reveal";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { bio, credentials } from "@/data/about";
import { services } from "@/data/services";
import { business } from "@/data/business";
import { breadcrumbSchema, personSchema } from "@/lib/schema";

export default function AboutPage() {
  const jsonLd = [
    personSchema(),
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "About", path: "/about" },
    ]),
  ];

  return (
    <div>
      <Seo
        title={`About ${business.doctorName}`}
        description={`The story, philosophy, and professional background behind ${business.doctorName}, ${business.professionalTitle}.`}
        path="/about"
        jsonLd={jsonLd}
      />

      <div className="mx-auto w-full max-w-7xl px-6 pt-10 sm:px-10">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>About</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Page hero — photo-led editorial */}
      <section className="relative overflow-hidden py-16 sm:py-20">
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-secondary/60 via-background to-turquoise/10"
          aria-hidden="true"
        />
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 px-6 sm:px-10 lg:grid-cols-[0.85fr_1.15fr]">
          <Reveal direction="right">
            <div className="relative mx-auto max-w-md">
              <div
                className="pointer-events-none absolute -inset-6 -z-10 rounded-[2.5rem] bg-turquoise/15 blur-3xl"
                aria-hidden="true"
              />
              <div className="overflow-hidden rounded-[2rem] ring-1 ring-secondary shadow-[0_40px_80px_-30px_rgba(23,35,59,0.4)]">
                <img
                  src="/monzer-portrait.jpg"
                  alt={`${business.doctorName}, ${business.professionalTitle}`}
                  width={720}
                  height={900}
                  className="aspect-[4/5] w-full object-cover object-top"
                />
              </div>
            </div>
          </Reveal>
          <div>
            <Reveal direction="up">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                About {business.doctorName}
              </p>
            </Reveal>
            <Reveal direction="up" delay={0.08}>
              <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-navy sm:text-5xl">
                A Clinical Approach To Nutrition, Built Around Real Life
              </h1>
            </Reveal>
            <Reveal direction="up" delay={0.16}>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                {business.doctorName} is a {business.professionalTitle.toLowerCase()} helping
                clients build lasting, evidence-based habits — not restrictive, short-lived diets.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Personal introduction */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto w-full max-w-3xl px-6 sm:px-10">
          <Reveal direction="up" className="space-y-5">
            {bio.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-base leading-relaxed text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Philosophy of care */}
      <section className="border-y border-border/60 bg-secondary/30 py-16 sm:py-20">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-6 sm:px-10 lg:grid-cols-2 lg:gap-16">
          <Reveal direction="right">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
              Philosophy of Care
            </p>
            <h2 className="mt-4 font-display text-2xl font-extrabold leading-tight tracking-tight text-navy sm:text-3xl">
              Guidance That Starts With Your Actual Life
            </h2>
          </Reveal>
          <Reveal direction="left" delay={0.08}>
            <p className="text-base leading-relaxed text-muted-foreground">
              Every plan begins with what a client is already eating, not a template imposed from
              the outside. By combining a pharmacist&apos;s clinical training with specialized
              nutrition science, the goal is always the same: guidance that respects a person&apos;s
              schedule, culture, and preferences while still being grounded in evidence. Change that
              lasts comes from small, realistic adjustments — not dramatic overhauls that are hard
              to sustain.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Mission, vision, professional background */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto w-full max-w-6xl px-6 sm:px-10">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Reveal direction="up">
              <div className="h-full rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                  <Target className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-navy">Mission</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{bio.mission}</p>
              </div>
            </Reveal>
            <Reveal direction="up" delay={0.08}>
              <div className="h-full rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-turquoise">
                  <Compass className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-navy">Vision</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{bio.vision}</p>
              </div>
            </Reveal>
          </div>

          <div className="mt-14">
            <Reveal direction="up">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                Professional Background
              </p>
              <h3 className="mt-3 font-display text-xl font-bold text-navy">
                Verified Credentials
              </h3>
            </Reveal>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {credentials.map((credential, index) => (
                <Reveal key={credential.title} direction="up" delay={index * 0.06}>
                  <div className="flex items-start gap-3.5 rounded-xl border border-border/60 bg-card p-4 transition-colors hover:border-turquoise/60">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                      <credential.icon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-navy">{credential.title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        {credential.description}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Areas of focus */}
      <section className="border-t border-border/60 bg-secondary/20 py-16 sm:py-20">
        <div className="mx-auto w-full max-w-6xl px-6 sm:px-10">
          <Reveal direction="up" className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
              Areas of Focus
            </p>
            <h2 className="mx-auto mt-3 max-w-xl font-display text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
              Specialized Support Across Every Stage of Life
            </h2>
          </Reveal>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {services.map((service, index) => (
              <Reveal key={service.slug} direction="up" delay={(index % 6) * 0.05}>
                <Link
                  to={`/booking?service=${service.slug}`}
                  className="group inline-flex cursor-pointer items-center gap-2 rounded-full border border-border/70 bg-card px-4 py-2.5 text-sm font-semibold text-navy/80 transition-colors hover:border-turquoise hover:text-turquoise"
                >
                  <service.icon className="h-4 w-4 text-primary transition-colors group-hover:text-turquoise" />
                  {service.title}
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto w-full max-w-3xl px-6 text-center sm:px-10">
          <Reveal
            direction="up"
            className="rounded-3xl border border-border/70 bg-gradient-to-br from-navy to-primary p-10 text-white shadow-[0_30px_70px_-30px_rgba(23,35,59,0.5)] sm:p-14"
          >
            <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
              Start Your Nutrition Journey
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-white/80 sm:text-base">
              Choose a program for guided support, or reach out to ask a question before you begin.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/packages"
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-turquoise px-6 py-3 text-sm font-semibold text-navy transition-all duration-300 hover:-translate-y-0.5 hover:bg-turquoise/90"
              >
                <Sparkles className="h-4 w-4" /> Explore Programs
              </Link>
              <Link
                to="/contact"
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/10"
              >
                <CalendarCheck className="h-4 w-4" /> Request Consultation
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

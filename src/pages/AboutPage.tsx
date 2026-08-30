import { Link } from "react-router-dom";
import { CalendarCheck, Compass, Sparkles, Target } from "lucide-react";

import { Seo } from "@/components/seo/Seo";
import { Reveal } from "@/components/common/Reveal";
import { Photo } from "@/components/common/Photo";
import { PHOTO_FRAME } from "@/components/common/photoFrame";
import { CredentialChip } from "@/components/common/CredentialChip";
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
import { cn } from "@/lib/utils";
import { useTranslate, CREDENTIAL_LABELS, serviceTitle } from "@/i18n";

export default function AboutPage() {
  const t = useTranslate();
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
              <BreadcrumbLink href="/">{t("common.home")}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t("nav.about")}</BreadcrumbPage>
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
          <div>
            <div className="relative mx-auto max-w-md">
              <div
                className="pointer-events-none absolute -inset-6 -z-10 rounded-[2.5rem] bg-turquoise/15 blur-3xl"
                aria-hidden="true"
              />
              {/* Same frame as every other non-full-bleed photograph on the
                  site, and the LCP image for this page: eager, high priority.
                  max-w-md above caps it at 448px, well inside the 960px file. */}
              {/* max-h keeps the 4:5 frame inside the 62vh ceiling: at 448px
                  wide it would otherwise stand 560px tall on a 900px screen. */}
              <div className={cn(PHOTO_FRAME, "aspect-[4/5] max-h-[62vh]")}>
                <Photo
                  base="/monzer-portrait"
                  width={960}
                  height={1280}
                  alt={`${business.doctorName}, ${business.professionalTitle}`}
                  hasWebp={false}
                  priority
                  className="block h-full w-full"
                  imgClassName="h-full w-full object-cover object-top"
                  sizes="(min-width: 1024px) 448px, 100vw"
                />
              </div>
            </div>
          </div>
          <div>
            <div>
              <p
                dir="auto"
                className="text-xs font-semibold uppercase tracking-[0.28em] text-primary"
              >
                {t("aboutPage.eyebrow", { name: business.doctorName })}
              </p>
            </div>
            <div>
              <h1
                dir="auto"
                className="mt-4 font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-navy sm:text-5xl"
              >
                {t("aboutPage.title")}
              </h1>
            </div>
            <div>
              <p dir="auto" className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                {t("aboutPage.lede", {
                  name: business.doctorName,
                  title: business.professionalTitle.toLowerCase(),
                })}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Personal introduction */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto w-full max-w-3xl px-6 sm:px-10">
          <div className="space-y-5">
            {/* Keys, not bio.paragraphs: this is the doctor's own account of
                his practice and it has to exist in both languages. The English
                in the dictionary is identical to about.ts — that file stays the
                source for anything not rendered here (schema.org, the app). */}
            {(["aboutPage.bio1", "aboutPage.bio2", "aboutPage.bio3"] as const).map((paragraph) => (
              <p
                dir="auto"
                key={paragraph}
                className="text-base leading-relaxed text-muted-foreground"
              >
                {t(paragraph)}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy of care */}
      <section className="border-y border-border/60 bg-secondary/30 py-16 sm:py-20">
        <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-10 px-6 sm:px-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p
              dir="auto"
              className="text-xs font-semibold uppercase tracking-[0.28em] text-primary"
            >
              {t("aboutPage.philosophyEyebrow")}
            </p>
            <h2
              dir="auto"
              className="mt-4 font-display text-2xl font-extrabold leading-tight tracking-tight text-navy sm:text-3xl"
            >
              {t("aboutPage.philosophyTitle")}
            </h2>
          </div>
          <div>
            <p dir="auto" className="text-base leading-relaxed text-muted-foreground">
              {t("aboutPage.philosophyBody")}
            </p>
          </div>
        </div>
      </section>

      {/* Mission, vision, professional background */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto w-full max-w-5xl px-6 sm:px-10">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <div className="h-full rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                  <Target className="h-5 w-5" />
                </div>
                <h3 dir="auto" className="mt-4 font-display text-lg font-bold text-navy">
                  {t("aboutPage.mission")}
                </h3>
                <p dir="auto" className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t("aboutPage.missionBody")}
                </p>
              </div>
            </div>
            <div>
              <div className="h-full rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-turquoise">
                  <Compass className="h-5 w-5" />
                </div>
                <h3 dir="auto" className="mt-4 font-display text-lg font-bold text-navy">
                  {t("aboutPage.vision")}
                </h3>
                <p dir="auto" className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t("aboutPage.visionBody")}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-14">
            <div>
              <p
                dir="auto"
                className="text-xs font-semibold uppercase tracking-[0.28em] text-primary"
              >
                {t("aboutPage.backgroundEyebrow")}
              </p>
              <h3 dir="auto" className="mt-3 font-display text-xl font-bold text-navy">
                {t("aboutPage.backgroundTitle")}
              </h3>
            </div>
            {/* Stagger kept: this is a list revealing in order, which is the
                one motion this phase still allows. */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {credentials.map((credential, index) => (
                <Reveal key={credential.title} direction="up" delay={index * 0.06}>
                  <CredentialChip
                    credential={credential}
                    variant="card"
                    className="h-full"
                    titleKey={CREDENTIAL_LABELS[credential.title]?.title}
                    descriptionKey={CREDENTIAL_LABELS[credential.title]?.description}
                  />
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Areas of focus */}
      <section className="border-t border-border/60 bg-secondary/20 py-16 sm:py-20">
        <div className="mx-auto w-full max-w-5xl px-6 sm:px-10">
          <div className="text-center">
            <p
              dir="auto"
              className="text-xs font-semibold uppercase tracking-[0.28em] text-primary"
            >
              {t("aboutPage.focusEyebrow")}
            </p>
            <h2
              dir="auto"
              className="mx-auto mt-3 max-w-xl font-display text-2xl font-extrabold tracking-tight text-navy sm:text-3xl"
            >
              {t("aboutPage.focusTitle")}
            </h2>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {services.map((service, index) => (
              <div key={service.slug}>
                <Link
                  to={`/booking?service=${service.slug}`}
                  className="group inline-flex cursor-pointer items-center gap-2 rounded-full border border-border/70 bg-card px-4 py-2.5 text-sm font-semibold text-navy/80 transition-colors hover:border-turquoise hover:text-turquoise"
                >
                  <service.icon className="h-4 w-4 text-primary transition-colors group-hover:text-turquoise" />
                  {serviceTitle(service, t)}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto w-full max-w-3xl px-6 text-center sm:px-10">
          <div className="rounded-3xl border border-border/70 bg-gradient-to-br from-navy to-primary p-10 text-white shadow-[0_30px_70px_-30px_rgba(23,35,59,0.5)] sm:p-14">
            <h2
              dir="auto"
              className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl"
            >
              {t("aboutPage.ctaTitle")}
            </h2>
            <p
              dir="auto"
              className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-white/80 sm:text-base"
            >
              {t("aboutPage.ctaBody")}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/packages"
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-turquoise px-6 py-3 text-sm font-semibold text-navy transition-all duration-300 hover:-translate-y-0.5 hover:bg-turquoise/90"
              >
                <Sparkles className="h-4 w-4" /> {t("cta.explorePrograms")}
              </Link>
              <Link
                to="/contact"
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/10"
              >
                <CalendarCheck className="h-4 w-4" /> {t("cta.requestConsultation")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

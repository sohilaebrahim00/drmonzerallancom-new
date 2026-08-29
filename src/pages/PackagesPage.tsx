import { Link } from "react-router-dom";
import { CalendarCheck, MessageCircle, ShieldCheck, Video } from "lucide-react";

import { Seo } from "@/components/seo/Seo";
import { ProgramPackages } from "@/components/sections/ProgramPackages";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { faqs } from "@/data/faqs";
import { breadcrumbSchema } from "@/lib/schema";
import { useTranslate } from "@/i18n";

const RELEVANT_CATEGORIES = new Set(["Consultation Credits", "Online Meetings"]);
const relevantFaqs = faqs.filter((faq) => RELEVANT_CATEGORIES.has(faq.category));

export default function PackagesPage() {
  const t = useTranslate();
  const jsonLd = breadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Packages", path: "/packages" },
  ]);

  return (
    <div>
      <Seo
        title="Programs & Pricing"
        description="Choose a one-time Treatment program — pricing, doctor consultations, and everything included, with no recurring billing."
        path="/packages"
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
              <BreadcrumbPage>{t("nav.packages")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Page hero — one-time program pricing */}
      <section className="relative py-14 sm:py-16">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-full bg-gradient-to-b from-secondary/50 via-transparent to-transparent"
          aria-hidden="true"
        />
        <div className="mx-auto max-w-3xl px-6 text-center sm:px-10">
          <div>
            <p
              dir="auto"
              className="text-xs font-semibold uppercase tracking-[0.28em] text-primary"
            >
              {t("packagesPage.eyebrow")}
            </p>
            <h1
              dir="auto"
              className="mt-4 font-display text-4xl font-extrabold tracking-tight text-navy sm:text-5xl"
            >
              {t("packagesPage.title")}
            </h1>
            <p
              dir="auto"
              className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground"
            >
              {t("packagesPage.lede")}
            </p>
          </div>
        </div>
      </section>

      <ProgramPackages hideHeading />

      {/* How credits work */}
      <section className="border-t border-border/60 bg-secondary/20 py-16 sm:py-24">
        <div className="mx-auto w-full max-w-5xl px-6 sm:px-10">
          <div className="mx-auto max-w-2xl text-center">
            <p
              dir="auto"
              className="text-xs font-semibold uppercase tracking-[0.28em] text-primary"
            >
              {t("packagesPage.detailsEyebrow")}
            </p>
            <h2
              dir="auto"
              className="mt-3 font-display text-2xl font-extrabold tracking-tight text-navy sm:text-3xl"
            >
              {t("packagesPage.detailsTitle")}
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <div className="h-full rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                  <CalendarCheck className="h-5 w-5" />
                </div>
                <h3 dir="auto" className="mt-4 font-display text-base font-bold text-navy">
                  {t("packagesPage.creditsTitle")}
                </h3>
                <p dir="auto" className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Each program includes a fixed number of consultation credits, granted once at
                  purchase. Request a consultation from your account, and one credit is used per
                  confirmed session.
                </p>
              </div>
            </div>
            <div>
              <div className="h-full rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                  <Video className="h-5 w-5" />
                </div>
                <h3 dir="auto" className="mt-4 font-display text-base font-bold text-navy">
                  Google Meet
                </h3>
                <p dir="auto" className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Approved consultations are conducted online over Google Meet. Once confirmed, your
                  meeting link appears with the appointment in your account.
                </p>
              </div>
            </div>
            <div>
              <div className="h-full rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 dir="auto" className="mt-4 font-display text-base font-bold text-navy">
                  No Recurring Billing
                </h3>
                <p dir="auto" className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Every program is a single, one-time payment. There is nothing to cancel and
                  nothing that renews automatically.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      {relevantFaqs.length > 0 && (
        <section className="py-16 sm:py-24">
          <div className="mx-auto w-full max-w-3xl px-6 sm:px-10">
            <div className="text-center">
              <p
                dir="auto"
                className="text-xs font-semibold uppercase tracking-[0.28em] text-primary"
              >
                FAQ
              </p>
              <h2
                dir="auto"
                className="mt-3 font-display text-2xl font-extrabold tracking-tight text-navy sm:text-3xl"
              >
                Program Questions
              </h2>
            </div>
            <div className="mt-10">
              <Accordion
                type="single"
                collapsible
                className="rounded-2xl border border-border/70 bg-card px-2 shadow-sm sm:px-4"
              >
                {relevantFaqs.map((faq) => (
                  <AccordionItem
                    key={faq.question}
                    value={faq.question}
                    className="border-border/60"
                  >
                    <AccordionTrigger className="py-5 text-start font-display text-base font-bold text-navy hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
            <div className="mt-6 text-center">
              <Link to="/faq" className="text-sm font-semibold text-primary hover:text-turquoise">
                View All FAQs
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Questions CTA */}
      <section className="pb-16 sm:pb-24">
        <div className="mx-auto w-full max-w-3xl px-6 text-center sm:px-10">
          <div className="rounded-3xl border border-border/70 bg-gradient-to-br from-navy to-primary p-10 text-white shadow-[0_30px_70px_-30px_rgba(23,35,59,0.5)] sm:p-14">
            <h2
              dir="auto"
              className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl"
            >
              Not Sure Which Program Fits?
            </h2>
            <p
              dir="auto"
              className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-white/80 sm:text-base"
            >
              Choose your program above, or reach out and we&apos;ll help you pick the right one.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/contact"
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-turquoise px-6 py-3 text-sm font-semibold text-navy transition-all duration-300 hover:-translate-y-0.5 hover:bg-turquoise/90"
              >
                <MessageCircle className="h-4 w-4" /> Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

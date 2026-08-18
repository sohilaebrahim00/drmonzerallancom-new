import { Link } from "react-router-dom";
import { CalendarCheck, PhoneCall, UserPlus, Video } from "lucide-react";

import { Seo } from "@/components/seo/Seo";
import { Reveal } from "@/components/common/Reveal";
import { Packages } from "@/components/sections/Packages";
import { ConsultationPackages } from "@/components/sections/ConsultationPackages";
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

const RELEVANT_CATEGORIES = new Set(["Membership", "Consultation Credits", "Online Meetings"]);
const relevantFaqs = faqs.filter((faq) => RELEVANT_CATEGORIES.has(faq.category));

export default function PackagesPage() {
  const jsonLd = breadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Packages", path: "/packages" },
  ]);

  return (
    <div>
      <Seo
        title="Membership Packages"
        description="Compare Basic, Premium, and VIP Elite membership packages, or book a single pay-per-consultation session — consultation credits, pricing, and everything included."
        path="/packages"
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
              <BreadcrumbPage>Packages</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Page hero — pricing/membership-led */}
      <section className="relative py-14 sm:py-16">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-full bg-gradient-to-b from-secondary/50 via-transparent to-transparent"
          aria-hidden="true"
        />
        <div className="mx-auto max-w-3xl px-6 text-center sm:px-10">
          <Reveal direction="up">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
              Membership
            </p>
            <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-navy sm:text-5xl">
              Find Your Level of Support
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              Every plan includes monthly consultation credits, a member account, and ongoing
              nutrition guidance — the difference is how much support fits your goals.
            </p>
          </Reveal>
        </div>
      </section>

      <Packages />

      {/* How credits work + hotline */}
      <section className="border-t border-border/60 bg-secondary/20 py-16 sm:py-24">
        <div className="mx-auto w-full max-w-5xl px-6 sm:px-10">
          <Reveal direction="up" className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
              The Details
            </p>
            <h2 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
              How Consultation Credits &amp; Meetings Work
            </h2>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <Reveal direction="up" delay={0.05}>
              <div className="h-full rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                  <CalendarCheck className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-base font-bold text-navy">Monthly Credits</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Each membership includes a fixed number of consultation credits every month.
                  Request a consultation from your member account, and one credit is used per
                  confirmed session.
                </p>
              </div>
            </Reveal>
            <Reveal direction="up" delay={0.1}>
              <div className="h-full rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                  <Video className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-base font-bold text-navy">Google Meet</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Approved consultations are conducted online over Google Meet. Once confirmed, your
                  meeting link appears with the appointment in your account.
                </p>
              </div>
            </Reveal>
            <Reveal direction="up" delay={0.15}>
              <div className="h-full rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                  <PhoneCall className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-base font-bold text-navy">
                  VIP Priority Hotline
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  VIP Elite members get a private priority contact channel for faster response —
                  shared directly with active VIP members after joining.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <ConsultationPackages />

      {/* FAQ */}
      {relevantFaqs.length > 0 && (
        <section className="py-16 sm:py-24">
          <div className="mx-auto w-full max-w-3xl px-6 sm:px-10">
            <Reveal direction="up" className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">FAQ</p>
              <h2 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
                Membership Questions
              </h2>
            </Reveal>
            <Reveal direction="up" delay={0.1} className="mt-10">
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
                    <AccordionTrigger className="py-5 text-left font-display text-base font-bold text-navy hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Reveal>
            <Reveal direction="up" delay={0.15} className="mt-6 text-center">
              <Link to="/faq" className="text-sm font-semibold text-primary hover:text-turquoise">
                View All FAQs
              </Link>
            </Reveal>
          </div>
        </section>
      )}

      {/* Join CTA */}
      <section className="pb-16 sm:pb-24">
        <div className="mx-auto w-full max-w-3xl px-6 text-center sm:px-10">
          <Reveal
            direction="up"
            className="rounded-3xl border border-border/70 bg-gradient-to-br from-navy to-primary p-10 text-white shadow-[0_30px_70px_-30px_rgba(23,35,59,0.5)] sm:p-14"
          >
            <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
              Ready to Join?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-white/80 sm:text-base">
              Choose your package above, or create your account now to get started.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/join"
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-turquoise px-6 py-3 text-sm font-semibold text-navy transition-all duration-300 hover:-translate-y-0.5 hover:bg-turquoise/90"
              >
                <UserPlus className="h-4 w-4" /> Create Account
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

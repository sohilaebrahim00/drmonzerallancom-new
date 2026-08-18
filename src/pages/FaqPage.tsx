import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, MessageCircle, Search } from "lucide-react";

import { Seo } from "@/components/seo/Seo";
import { Reveal } from "@/components/common/Reveal";
import { Input } from "@/components/ui/input";
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
import { faqCategories, faqs, type FaqCategory } from "@/data/faqs";
import { breadcrumbSchema, faqSchema } from "@/lib/schema";
import { cn } from "@/lib/utils";

export default function FaqPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<FaqCategory | "All">("All");

  const filtered = useMemo(() => {
    return faqs.filter((faq) => {
      const matchesCategory = activeCategory === "All" || faq.category === activeCategory;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q || faq.question.toLowerCase().includes(q) || faq.answer.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, activeCategory]);

  const jsonLd = [
    faqSchema(faqs),
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "FAQ", path: "/faq" },
    ]),
  ];

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16 sm:px-10 sm:py-20">
      <Seo
        title="Frequently Asked Questions"
        description="Answers about programs, consultation credits, online meetings, account & billing, products, and nutrition services."
        path="/faq"
        jsonLd={jsonLd}
      />

      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>FAQ</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Reveal direction="up" className="mx-auto mt-6 max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
          Knowledge Center
        </p>
        <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
          Frequently Asked Questions
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Search or filter by topic to find answers about programs, consultations, billing, and
          more.
        </p>
      </Reveal>

      <Reveal direction="up" delay={0.1} className="mx-auto mt-10 max-w-xl">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions…"
            aria-label="Search FAQs"
            className="pl-10"
          />
        </div>
      </Reveal>

      <Reveal direction="up" delay={0.15} className="mt-6 flex flex-wrap justify-center gap-2">
        {(["All", ...faqCategories] as const).map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveCategory(category)}
            aria-pressed={activeCategory === category}
            className={cn(
              "cursor-pointer rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors",
              activeCategory === category
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-navy/70 hover:border-turquoise hover:text-turquoise",
            )}
          >
            {category}
          </button>
        ))}
      </Reveal>

      <p className="mt-6 text-center text-xs font-medium text-muted-foreground" role="status">
        {filtered.length} {filtered.length === 1 ? "question" : "questions"} found
      </p>

      <Reveal direction="up" delay={0.2} className="mt-8">
        {filtered.length > 0 ? (
          <Accordion
            type="single"
            collapsible
            className="rounded-2xl border border-border/70 bg-card px-2 shadow-sm sm:px-4"
          >
            {filtered.map((faq) => (
              <AccordionItem key={faq.question} value={faq.question} className="border-border/60">
                <AccordionTrigger className="py-5 text-left font-display text-base font-bold text-navy hover:no-underline">
                  <span className="flex flex-col items-start gap-1.5">
                    <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-primary">
                      {faq.category}
                    </span>
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <p className="py-16 text-center text-sm text-muted-foreground">
            No questions match your search. Try another keyword or category.
          </p>
        )}
      </Reveal>

      <Reveal
        direction="up"
        delay={0.25}
        className="mx-auto mt-14 max-w-xl rounded-2xl border border-border/70 bg-card p-6 text-center shadow-sm sm:p-8"
      >
        <h2 className="font-display text-lg font-bold text-navy">Still Have a Question?</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Ask directly, or explore programs to see what's included in each package.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link
            to="/packages"
            className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-turquoise"
          >
            <CalendarCheck className="h-4 w-4" /> Explore Programs
          </Link>
          <Link
            to="/contact"
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-navy transition-colors hover:border-turquoise hover:text-turquoise"
          >
            <MessageCircle className="h-4 w-4" /> Contact Us
          </Link>
        </div>
      </Reveal>
    </div>
  );
}

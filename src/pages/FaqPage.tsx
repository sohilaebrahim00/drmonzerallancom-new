import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, MessageCircle, Search } from "lucide-react";

import { Seo } from "@/components/seo/Seo";
import { SectionHeading } from "@/components/common/SectionHeading";
import { PhotoBackdrop } from "@/components/common/PhotoBackdrop";
import { FaqAccordion } from "@/components/common/FaqAccordion";
import { PHOTO_FRAME } from "@/components/common/photoFrame";
import { SECTION_PADDING, SECTION_WIDTHS } from "@/components/common/sectionWidths";
import { Input } from "@/components/ui/input";
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
    <>
      <Seo
        title="Frequently Asked Questions"
        description="Answers about programs, consultation credits, online meetings, account & billing, products, and nutrition services."
        path="/faq"
        jsonLd={jsonLd}
      />

      {/* Same treatment as the home FAQ section, from the same component:
          consult-desk full-bleed behind a solid inset panel. Reading width
          throughout — every answer here is prose. */}
      <PhotoBackdrop
        base="/images/consult-desk"
        width={1600}
        height={730}
        className="py-12 sm:py-16"
      >
        <div className={cn("mx-auto w-full", SECTION_WIDTHS.reading, SECTION_PADDING)}>
          <div className="mb-8 [&_a]:text-white/80 [&_li]:text-white/80 [&_svg]:text-white/60">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-white">FAQ</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div>
            <div className={cn(PHOTO_FRAME, "bg-card p-6 sm:p-10")}>
              <SectionHeading
                eyebrow="Knowledge Center"
                title="Frequently Asked Questions"
                description="Search or filter by topic to find answers about programs, consultations, billing, and more."
                id="faq-page-heading"
                level="h1"
              />

              {/* Search and category filtering are functionality, not
                  decoration — restyled in place, not removed. */}
              <div className="mx-auto mt-10 max-w-xl">
                <div className="relative">
                  <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search questions…"
                    aria-label="Search FAQs"
                    className="ps-10"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap justify-center gap-2">
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
              </div>

              <p
                className="mt-6 text-center text-xs font-medium text-muted-foreground"
                role="status"
              >
                {filtered.length} {filtered.length === 1 ? "question" : "questions"} found
              </p>

              {filtered.length > 0 ? (
                <FaqAccordion items={filtered} showCategory className="mt-6" />
              ) : (
                <p className="py-16 text-center text-sm text-muted-foreground">
                  No questions match your search. Try another keyword or category.
                </p>
              )}
            </div>
          </div>

          <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-border/70 bg-card p-6 text-center shadow-sm sm:p-8">
            <h2 className="font-display text-lg font-bold text-navy">Still Have a Question?</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Ask directly, or explore programs to see what&apos;s included in each package.
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
          </div>
        </div>
      </PhotoBackdrop>
    </>
  );
}

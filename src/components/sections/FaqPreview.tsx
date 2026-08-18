import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqs } from "@/data/faqs";

const PREVIEW_QUESTIONS = [
  "What's included in a program?",
  "How do consultation credits work?",
  "Do you offer online consultations?",
  "How soon will I see results?",
  "Is my payment information secure?",
  "What is your cancellation policy?",
];

export function FaqPreview() {
  const featured = PREVIEW_QUESTIONS.map((q) => faqs.find((faq) => faq.question === q)).filter(
    (faq): faq is (typeof faqs)[number] => Boolean(faq),
  );

  return (
    <section id="faq" className="relative py-20 sm:py-28" aria-labelledby="faq-preview-heading">
      <div className="mx-auto w-full max-w-3xl px-6 sm:px-10">
        <SectionHeading eyebrow="FAQ" title="Frequently Asked Questions" />

        <Reveal direction="up" delay={0.1} className="mt-12">
          <Accordion
            type="single"
            collapsible
            className="rounded-2xl border border-border/70 bg-card px-2 shadow-sm sm:px-4"
          >
            {featured.map((faq) => (
              <AccordionItem key={faq.question} value={faq.question} className="border-border/60">
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

        <Reveal direction="up" delay={0.2} className="mt-8 flex justify-center">
          <Link
            to="/faq"
            className="group inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-navy transition-all duration-300 hover:border-turquoise hover:text-turquoise"
          >
            View All FAQs
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

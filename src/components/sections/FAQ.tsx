import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqs } from "@/data/faqs";

export function FAQ() {
  return (
    <section id="faq" className="relative py-20 sm:py-28" aria-labelledby="faq-heading">
      <div className="mx-auto w-full max-w-3xl px-6 sm:px-10">
        <SectionHeading eyebrow="FAQ" title="Frequently Asked Questions" />

        <Reveal direction="up" delay={0.1} className="mt-12">
          <Accordion
            type="single"
            collapsible
            className="rounded-2xl border border-border/70 bg-card px-2 shadow-sm sm:px-4"
          >
            {faqs.map((faq) => (
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
      </div>
    </section>
  );
}

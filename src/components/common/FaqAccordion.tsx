import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

export interface FaqAccordionItem {
  question: string;
  answer: string;
  category?: string;
}

interface FaqAccordionProps {
  items: FaqAccordionItem[];
  /** The full page groups by topic and shows the tag; the home preview does not. */
  showCategory?: boolean;
  className?: string;
}

/**
 * The question row, shared by the home-page preview and the FAQ page.
 *
 * These were two separate implementations of the same list, which is exactly
 * why restyling the home page never reached /faq. A preview showing six
 * questions and a page showing forty are still the same ROW.
 *
 * Answers are prose, so the content sits at the reading measure wherever this
 * is used — the container decides that, not this component.
 */
export function FaqAccordion({ items, showCategory = false, className }: FaqAccordionProps) {
  return (
    <Accordion type="single" collapsible className={cn(className)}>
      {items.map((faq) => (
        <AccordionItem key={faq.question} value={faq.question} className="border-border/60">
          <AccordionTrigger className="py-5 text-start font-display text-base font-bold text-navy hover:no-underline">
            {showCategory && faq.category ? (
              <span className="flex flex-col items-start gap-1.5">
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-primary">
                  {faq.category}
                </span>
                {faq.question}
              </span>
            ) : (
              faq.question
            )}
          </AccordionTrigger>
          <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
            {faq.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

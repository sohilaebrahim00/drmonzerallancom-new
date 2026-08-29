import type { Faq } from "@/data/faqs";
import type { FaqAccordionItem } from "@/components/common/FaqAccordion";
import type { TranslateFn } from "./translate";
import { FAQ_LABELS } from "./faqLabels";

/**
 * Maps FAQ data to what the accordion renders: English question as the stable
 * `id`, translated text as the display.
 */
export function toDisplay(items: Faq[], t: TranslateFn): FaqAccordionItem[] {
  return items.map((faq) => {
    const keys = FAQ_LABELS[faq.question];
    return {
      id: faq.question,
      question: keys ? t(keys.question) : faq.question,
      answer: keys ? t(keys.answer) : faq.answer,
      category: faq.category,
    };
  });
}

/**
 * Search haystack covering BOTH languages.
 *
 * Searching only the English would return nothing for an Arabic reader typing
 * Arabic; searching only the translation would break a reader who types a
 * Latin term — "Stripe", "Google Meet" — while reading Arabic. Both are real,
 * so both are searchable, and the cost is a slightly longer string to scan.
 */
export function faqHaystack(faq: Faq, t: TranslateFn): string {
  const keys = FAQ_LABELS[faq.question];
  const parts = [faq.question, faq.answer];
  if (keys) parts.push(t(keys.question), t(keys.answer));
  return parts.join(" ").toLowerCase();
}

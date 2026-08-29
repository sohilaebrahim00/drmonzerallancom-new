import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";
import { PhotoBackdrop } from "@/components/common/PhotoBackdrop";
import { FaqAccordion } from "@/components/common/FaqAccordion";
import { PHOTO_FRAME } from "@/components/common/photoFrame";
import { SECTION_PADDING, SECTION_WIDTHS } from "@/components/common/sectionWidths";
import { faqs } from "@/data/faqs";
import { cn } from "@/lib/utils";

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
    /* consult-desk as the section background. It is a warm, DARK photograph,
       so the questions do not sit on it directly — they sit in a solid panel
       inset from the edges, with the photograph visible around it. The band
       itself, and its sizing rules, now live in PhotoBackdrop, which /faq uses
       too rather than reimplementing it. */
    <PhotoBackdrop base="/images/consult-desk" width={1600} height={730} className="py-20 sm:py-28">
      <section id="faq" aria-labelledby="faq-preview-heading">
        {/* reading width: the answers are prose. */}
        <div className={cn("mx-auto w-full", SECTION_WIDTHS.reading, SECTION_PADDING)}>
          {/* Heading lives INSIDE the panel with the questions. On the
              photograph it would be a second contrast problem to solve for no
              gain; on the solid surface it keeps the same navy type as every
              other section heading. */}
          <Reveal direction="up">
            <div className={cn(PHOTO_FRAME, "bg-card p-6 sm:p-10")}>
              <SectionHeading
                eyebrow="FAQ"
                title="Frequently Asked Questions"
                id="faq-preview-heading"
              />
              <FaqAccordion items={featured} className="mt-8" />
            </div>
          </Reveal>

          <div className="mt-8 flex justify-center">
            <Link
              to="/faq"
              className="group inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-navy transition-all duration-300 hover:border-turquoise hover:text-turquoise"
            >
              View All FAQs
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </div>
      </section>
    </PhotoBackdrop>
  );
}

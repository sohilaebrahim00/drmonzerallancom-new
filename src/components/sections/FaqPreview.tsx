import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Photo } from "@/components/common/Photo";
import { PHOTO_FRAME } from "@/components/common/photoFrame";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
    <section
      id="faq"
      className="relative isolate overflow-hidden py-20 sm:py-28"
      aria-labelledby="faq-preview-heading"
    >
      {/* consult-desk as the section background rather than a standalone band.
          It is a warm, DARK photograph, so the questions do not sit on it
          directly — they sit in a solid `bg-card` panel inset from the edges,
          with the photograph visible around it. Legible, and the picture is
          still doing work instead of being downloaded for nothing.

          The section is capped at the file's native 1600px and never
          stretched past its native 1600x730 ratio: `max-w-[1600px]` on the
          image wrapper, and a max-height equal to 730/1600 of that width. */}
      {/* Top-anchored band at the file's NATIVE 1600x730, not a full-section
          background. Stretched over the whole section the box is 877px tall at
          a 1440px viewport — a 1.64:1 box for a 2.19:1 file — and `object-cover`
          answers that by scaling the 1600px file up 1.2x and cropping the sides.
          Held to its own ratio it is never upscaled and never re-cropped, and
          the panel simply overlaps its lower edge. */}
      <div className="absolute inset-x-0 top-0 -z-10 bg-navy" aria-hidden="true">
        {/* aspect-ratio holds it to the native 1600x730 and max-h keeps it
            inside the 62vh ceiling from the previous pass — at 1440x900 the
            native ratio alone would be 657px (73vh). Capping the height makes
            the band SHORTER than its native ratio, never taller, so both rules
            hold at once and `cover` still samples the file below 1:1. */}
        <div className="relative mx-auto aspect-[1600/730] max-h-[62vh] w-full max-w-[1600px]">
          <Photo
            base="/images/consult-desk"
            width={1600}
            height={730}
            alt=""
            decorative
            className="block h-full w-full"
            imgClassName="h-full w-full object-cover object-center"
            sizes="(min-width: 1600px) 1600px, 100vw"
          />
          {/* Darkens the frame so the panel's edges read against it, and fades
              into the page surface at the bottom so the band has no hard seam
              where the photograph stops. */}
          <div className="absolute inset-0 bg-navy/45" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-background" />
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl px-6 sm:px-10">
        {/* Heading lives INSIDE the panel with the questions. Sitting it on the
            photograph would mean a second contrast problem to solve for no
            gain; on the solid surface it keeps the same navy type as every
            other section heading on the page. */}
        <Reveal direction="up" delay={0.1}>
          <div className={cn(PHOTO_FRAME, "bg-card p-6 sm:p-10")}>
            <SectionHeading eyebrow="FAQ" title="Frequently Asked Questions" />

            <Accordion type="single" collapsible className="mt-8">
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
          </div>
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

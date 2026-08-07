import { Images } from "lucide-react";

import { Seo } from "@/components/seo/Seo";
import { Reveal } from "@/components/common/Reveal";
import { BookingButton } from "@/components/booking/BookingButton";

export default function GalleryPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-16 text-center sm:px-10 sm:py-20">
      <Seo
        title="Gallery"
        description="Photos from Dr. Monzer Allan's practice, events, and educational activity."
        path="/gallery"
      />
      <Reveal direction="up">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Gallery</p>
        <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
          A Look Inside the Practice
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
          Photos from consultations, events, and everyday practice life will appear here.
        </p>
      </Reveal>

      <Reveal
        direction="up"
        delay={0.1}
        className="mx-auto mt-14 flex max-w-md flex-col items-center gap-3 rounded-2xl border border-dashed border-border/70 bg-secondary/30 px-6 py-16"
      >
        <Images className="h-8 w-8 text-primary/60" />
        <p className="font-display text-lg font-bold text-navy">Gallery Coming Soon</p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          We&apos;re preparing approved photography to share here. Before-and-after content is only
          ever published with a client&apos;s explicit consent.
        </p>
        <BookingButton label="Book a Consultation" className="mt-2" />
      </Reveal>
    </div>
  );
}

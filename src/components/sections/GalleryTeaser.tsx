import { Link } from "react-router-dom";
import { ArrowUpRight, Images } from "lucide-react";

import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";

export function GalleryTeaser() {
  return (
    <section
      id="gallery-preview"
      className="relative py-20 sm:py-28"
      aria-labelledby="gallery-preview-heading"
    >
      <div className="mx-auto w-full max-w-3xl px-6 text-center sm:px-10">
        <SectionHeading eyebrow="Gallery" title="A Look Inside the Practice" />
        <Reveal direction="up" delay={0.1} className="mt-8">
          <Link
            to="/gallery"
            className="group inline-flex cursor-pointer items-center gap-3 rounded-2xl border border-border/70 bg-card px-6 py-4 text-sm font-semibold text-navy shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-turquoise/50"
          >
            <Images className="h-5 w-5 text-primary" />
            View the Gallery
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

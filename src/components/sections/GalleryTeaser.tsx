import { Link } from "react-router-dom";
import { ArrowUpRight, Images } from "lucide-react";

import { SectionHeading } from "@/components/common/SectionHeading";
import { useTranslate } from "@/i18n";

export function GalleryTeaser() {
  const t = useTranslate();
  return (
    <section
      id="gallery-preview"
      className="relative py-20 sm:py-28"
      aria-labelledby="gallery-preview-heading"
    >
      <div className="mx-auto w-full max-w-3xl px-6 text-center sm:px-10">
        <SectionHeading eyebrow={t("gallery.eyebrow")} title={t("gallery.title")} />
        <div className="mt-8">
          <Link
            to="/gallery"
            className="group inline-flex cursor-pointer items-center gap-3 rounded-2xl border border-border/70 bg-card px-6 py-4 text-sm font-semibold text-navy shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-turquoise/50"
          >
            <Images className="h-5 w-5 text-primary" />
            {t("galleryTeaser.view")}
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:-scale-x-100" />
          </Link>
        </div>
      </div>
    </section>
  );
}

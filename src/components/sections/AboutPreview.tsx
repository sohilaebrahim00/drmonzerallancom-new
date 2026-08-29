import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

import { Photo } from "@/components/common/Photo";
import { PHOTO_FRAME } from "@/components/common/photoFrame";
import { CredentialChip } from "@/components/common/CredentialChip";
import { bio, credentials } from "@/data/about";
import { cn } from "@/lib/utils";

export function AboutPreview() {
  return (
    <section id="about" className="relative py-20 sm:py-28" aria-labelledby="about-preview-heading">
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-10">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <div className="relative mx-auto max-w-sm">
              <div
                className="pointer-events-none absolute -inset-4 -z-10 rounded-[2rem] bg-secondary/70 blur-2xl"
                aria-hidden="true"
              />
              <div className={cn(PHOTO_FRAME, "aspect-[4/5]")}>
                <Photo
                  base="/monzer-portrait"
                  width={960}
                  height={1280}
                  alt="Monzer Allan, Nutrition Specialist and Pharmacist"
                  hasWebp={false}
                  className="block h-full w-full"
                  imgClassName="h-full w-full object-cover object-top"
                  sizes="(min-width: 1024px) 384px, 100vw"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
              About Monzer
            </p>
            <h2
              id="about-preview-heading"
              className="max-w-xl font-display text-3xl font-extrabold leading-[1.15] tracking-tight text-navy sm:text-4xl"
            >
              Nutrition Guidance Rooted In Real Clinical Expertise
            </h2>
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
              {bio.paragraphs[0]}
            </p>
            <div className="flex flex-wrap gap-3">
              {credentials.map((credential) => (
                <CredentialChip key={credential.title} credential={credential} />
              ))}
            </div>
            <div>
              <Link
                to="/about"
                className="group inline-flex w-fit cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-navy transition-all duration-300 hover:-translate-y-1 hover:border-turquoise/50"
              >
                Discover My Story
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Paired with copy rather than given a full-width row of its own. A
            photograph this size with nothing beside it reads as a screensaver:
            it has to support content, not be content. The image column is
            capped at 560px — well inside the file's native 1600px — so it is
            never upscaled, and it is cropped to 3:2 inside a fixed aspect box
            rather than by re-cutting the file. */}
        <div className="mt-16">
          {/* ALTERNATION: the portrait block above puts its image on the left,
              so this one puts its image on the RIGHT. Two consecutive sections
              with the image on the same side stack into one long left rail and
              the page loses its rhythm.

              Done with lg:order, not by reordering the markup. On mobile both
              columns stack and the DOM order is what a screen reader follows —
              the figure must stay before the copy it belongs to, so only the
              desktop grid flips. */}
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,52fr)_minmax(0,48fr)] lg:gap-14">
            <figure className="w-full lg:order-2">
              {/* max-h caps the stacked mobile case, where a 3:2 box at the
                  full column width would otherwise be 373px tall above the
                  copy it belongs to. */}
              <div
                className={cn(
                  PHOTO_FRAME,
                  "mx-auto aspect-[3/2] w-full max-w-[560px] max-h-[260px] lg:max-h-none",
                )}
              >
                <Photo
                  base="/images/pharmacy-counter"
                  width={1600}
                  height={1066}
                  alt="A plate of cherry tomatoes, sliced cucumber and olives on a wooden counter, with a handwritten notepad beside it and shelves of medicine boxes behind."
                  className="block h-full w-full"
                  imgClassName="h-full w-full object-cover"
                  sizes="(min-width: 1024px) 560px, 100vw"
                />
              </div>
              <figcaption className="mx-auto mt-3 max-w-[560px] text-center text-xs text-muted-foreground">
                Nutrition first, with a pharmacist&apos;s understanding of medicine behind it.
              </figcaption>
            </figure>

            <div className="flex flex-col gap-4 lg:order-1">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                The Approach
              </p>
              <h3 className="max-w-xl font-display text-2xl font-bold leading-tight tracking-tight text-navy sm:text-3xl">
                Built around your life, not a template
              </h3>
              <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
                {bio.paragraphs[1]}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

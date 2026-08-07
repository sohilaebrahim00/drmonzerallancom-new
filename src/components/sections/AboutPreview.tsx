import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

import { Reveal } from "@/components/common/Reveal";
import { bio, credentials } from "@/data/about";

export function AboutPreview() {
  return (
    <section id="about" className="relative py-20 sm:py-28" aria-labelledby="about-preview-heading">
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-10">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <Reveal direction="right">
            <div className="relative mx-auto max-w-sm">
              <div
                className="pointer-events-none absolute -inset-4 -z-10 rounded-[2rem] bg-secondary/70 blur-2xl"
                aria-hidden="true"
              />
              <div className="overflow-hidden rounded-[1.75rem] ring-1 ring-secondary shadow-[0_30px_70px_-30px_rgba(23,35,59,0.35)]">
                <img
                  src="/monzer-portrait.jpg"
                  alt="Monzer Allan, Nutrition Specialist and Pharmacist"
                  width={640}
                  height={800}
                  loading="lazy"
                  className="aspect-[4/5] w-full object-cover object-top"
                />
              </div>
            </div>
          </Reveal>

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
                <span
                  key={credential.title}
                  className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-4 py-2 text-xs font-semibold text-navy/80"
                >
                  <credential.icon className="h-3.5 w-3.5 text-primary" />
                  {credential.title}
                </span>
              ))}
            </div>
            <Reveal direction="up" delay={0.1}>
              <Link
                to="/about"
                className="group inline-flex w-fit cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-navy transition-all duration-300 hover:-translate-y-1 hover:border-turquoise/50"
              >
                Discover My Story
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

import { SectionHeading } from "@/components/common/SectionHeading";
import { services } from "@/data/services";
import { useTranslate } from "@/i18n";

export function Services() {
  const t = useTranslate();
  const [featured, ...rest] = services;

  return (
    <section id="services" className="relative py-20 sm:py-28" aria-labelledby="services-heading">
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-10">
        <SectionHeading
          eyebrow={t("services.eyebrow")}
          title={t("services.title")}
          description={t("services.description")}
        />

        <div className="mt-14 grid grid-cols-1 gap-5 lg:grid-cols-[1.1fr_1fr]">
          {/* Spotlight: the foundational service gets an editorial feature treatment */}
          <div>
            <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-navy to-primary p-8 text-white shadow-[0_30px_60px_-30px_rgba(23,35,59,0.5)] sm:p-10">
              <span className="w-fit rounded-full bg-white/15 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-turquoise">
                Where Every Plan Starts
              </span>
              <div className="mt-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-turquoise">
                <featured.icon className="h-7 w-7" />
              </div>
              <h3 className="mt-6 font-display text-2xl font-bold sm:text-3xl">{featured.title}</h3>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-white/80">
                {featured.description}
              </p>
              <ul className="mt-6 space-y-2">
                {featured.highlights.map((highlight) => (
                  <li key={highlight} className="flex items-center gap-2 text-sm text-white/90">
                    <span className="h-1 w-1 shrink-0 rounded-full bg-turquoise" />
                    {highlight}
                  </li>
                ))}
              </ul>
              <Link
                to={`/booking?service=${featured.slug}`}
                className="mt-8 inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-full bg-turquoise px-5 py-2.5 text-sm font-semibold text-navy transition-all duration-300 hover:-translate-y-0.5 hover:bg-turquoise/90"
              >
                Book this service
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:-scale-x-100" />
              </Link>
            </article>
          </div>

          {/* Remaining programs: compact editorial list, not a repeated card grid */}
          <div>
            <div className="grid h-full grid-cols-1 gap-3 rounded-2xl border border-border/70 bg-card p-3 shadow-sm sm:grid-cols-2">
              {rest.map((service) => (
                <Link
                  key={service.slug}
                  to={`/booking?service=${service.slug}`}
                  className="group flex items-start gap-3 rounded-xl p-3.5 transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <service.icon className="h-4.5 w-4.5" />
                  </span>
                  <span>
                    <span className="flex items-center gap-1 text-sm font-semibold text-navy">
                      {service.title}
                      <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100 rtl:-scale-x-100" />
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                      {service.highlights[0]}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

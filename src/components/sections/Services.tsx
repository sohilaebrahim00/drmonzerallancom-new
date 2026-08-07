import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";
import { services } from "@/data/services";

export function Services() {
  return (
    <section id="services" className="relative py-20 sm:py-28" aria-labelledby="services-heading">
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-10">
        <SectionHeading
          eyebrow="Services"
          title="Specialized Nutrition Care For Every Stage Of Life"
          description="Twelve focused programs, each tailored to your body, your goals, and your medical needs."
        />

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <Reveal key={service.slug} direction="up" delay={(index % 3) * 0.08}>
              <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-turquoise/50 hover:shadow-[0_24px_50px_-24px_rgba(23,35,59,0.35)]">
                <div
                  className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-turquoise/0 blur-2xl transition-colors duration-500 group-hover:bg-turquoise/15"
                  aria-hidden="true"
                />
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-primary transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
                  <service.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-display text-lg font-bold text-navy">{service.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {service.description}
                </p>
                <ul className="mt-4 space-y-1.5">
                  {service.highlights.map((highlight) => (
                    <li key={highlight} className="flex items-center gap-2 text-xs text-navy/70">
                      <span className="h-1 w-1 shrink-0 rounded-full bg-turquoise" />
                      {highlight}
                    </li>
                  ))}
                </ul>
                <Link
                  to={`/booking?service=${service.slug}`}
                  className="mt-6 inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-turquoise focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Book this service
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

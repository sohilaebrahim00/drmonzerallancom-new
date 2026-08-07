import { Link } from "react-router-dom";
import { Check, Crown, PhoneCall, Sparkles } from "lucide-react";

import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";
import { PackageComparison } from "@/components/sections/PackageComparison";
import { packages, packageDisclaimer } from "@/data/packages";
import { cn } from "@/lib/utils";

export function Packages() {
  return (
    <section id="packages" className="relative py-20 sm:py-28" aria-labelledby="packages-heading">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-full bg-gradient-to-b from-secondary/40 via-transparent to-transparent"
        aria-hidden="true"
      />
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-10">
        <SectionHeading
          eyebrow="Packages"
          title="Choose The Level Of Support That Fits You"
          description="Transparent monthly plans, delivered through online consultations — pause or change your plan anytime."
        />

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg, index) => {
            const joinHref = `/join?package=${pkg.slug}`;
            const emphasized = pkg.popular || pkg.slug === "vip-elite";

            return (
              <Reveal key={pkg.slug} direction="up" delay={index * 0.08} className="h-full">
                <div
                  className={cn(
                    "relative flex h-full flex-col rounded-2xl border p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5",
                    emphasized
                      ? "border-primary bg-navy text-white shadow-[0_30px_60px_-24px_rgba(37,63,164,0.55)]"
                      : "border-border/70 bg-card hover:border-turquoise/50 hover:shadow-[0_24px_50px_-24px_rgba(23,35,59,0.3)]",
                  )}
                >
                  {pkg.badge && (
                    <span
                      className={cn(
                        "absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide shadow-md",
                        pkg.slug === "vip-elite"
                          ? "bg-navy text-turquoise ring-1 ring-turquoise"
                          : "bg-turquoise text-navy",
                      )}
                    >
                      {pkg.slug === "vip-elite" ? (
                        <Crown className="h-3 w-3" />
                      ) : (
                        <Sparkles className="h-3 w-3" />
                      )}
                      {pkg.badge}
                    </span>
                  )}

                  <h3
                    className={cn(
                      "font-display text-xl font-bold",
                      emphasized ? "text-white" : "text-navy",
                    )}
                  >
                    {pkg.name}
                  </h3>
                  <p
                    className={cn(
                      "mt-1 text-sm",
                      emphasized ? "text-white/70" : "text-muted-foreground",
                    )}
                  >
                    {pkg.tagline}
                  </p>

                  <div className="mt-5 flex flex-wrap items-baseline gap-2">
                    <span
                      className={cn(
                        "text-sm line-through",
                        emphasized ? "text-white/50" : "text-muted-foreground",
                      )}
                    >
                      ${pkg.originalPrice}
                    </span>
                    <span
                      className={cn(
                        "font-display text-3xl font-extrabold",
                        emphasized ? "text-white" : "text-navy",
                      )}
                    >
                      {pkg.priceLabel}
                    </span>
                  </div>

                  <span
                    className={cn(
                      "mt-3 inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
                      emphasized ? "bg-white/15 text-white" : "bg-secondary text-primary",
                    )}
                  >
                    {pkg.consultationCredits} Consultation{" "}
                    {pkg.consultationCredits === 1 ? "Credit" : "Credits"} / Month
                  </span>

                  {pkg.hotline && (
                    <span
                      className={cn(
                        "mt-2 inline-flex w-fit items-center gap-1.5 text-xs font-semibold",
                        emphasized ? "text-turquoise" : "text-primary",
                      )}
                    >
                      <PhoneCall className="h-3.5 w-3.5" /> Priority Hotline included
                    </span>
                  )}

                  <ul className="mt-6 flex-1 space-y-2.5">
                    {pkg.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-turquoise" />
                        <span className={emphasized ? "text-white/85" : "text-navy/80"}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    to={joinHref}
                    className={cn(
                      "mt-7 inline-flex w-full cursor-pointer items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold shadow transition-colors",
                      emphasized
                        ? "bg-turquoise text-navy hover:bg-turquoise/90"
                        : "bg-primary text-primary-foreground hover:bg-turquoise",
                    )}
                  >
                    {pkg.cta}
                  </Link>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal direction="up" delay={0.15} className="mt-16">
          <PackageComparison />
        </Reveal>

        <Reveal direction="up" delay={0.2} className="mt-8">
          <p className="mx-auto max-w-3xl rounded-xl border border-border/70 bg-secondary/40 p-4 text-center text-xs leading-relaxed text-muted-foreground">
            {packageDisclaimer}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

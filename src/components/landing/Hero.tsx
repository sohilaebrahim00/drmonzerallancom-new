import { Link } from "react-router-dom";
import { ArrowUpRight, CalendarCheck } from "lucide-react";

import { HeroBackground } from "@/components/landing/HeroBackground";
import { Portrait } from "@/components/landing/Portrait";
import { InstagramIcon } from "@/components/landing/instagram";
import { business } from "@/data/business";
import { credentials } from "@/data/about";

export function Hero() {
  return (
    <section id="hero" className="relative" aria-label="Introduction">
      <HeroBackground />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col px-6 sm:px-10">
        <div className="grid min-h-[calc(100svh-6rem)] grid-cols-1 items-center gap-10 py-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:py-8">
          {/* Left: editorial content */}
          <div className="order-1 max-w-xl">
            <p
              dir="auto"
              className="animate-fade-up text-xs font-semibold uppercase tracking-[0.28em] text-primary"
              style={{ animationDelay: "0.05s" }}
            >
              Nutrition <span className="text-green">•</span> Health{" "}
              <span className="text-green">•</span> Wellness
            </p>

            <h1
              dir="auto"
              className="animate-fade-up mt-5 max-w-[16ch] font-display text-[2.25rem] font-extrabold leading-[1.1] tracking-tight text-navy sm:text-5xl lg:text-[3.25rem]"
              style={{ animationDelay: "0.15s" }}
            >
              Healthier Choices Start With <span className="text-turquoise">Better Knowledge.</span>
            </h1>

            <p
              dir="auto"
              className="animate-fade-up mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg"
              style={{ animationDelay: "0.25s" }}
            >
              Personalized nutrition programs and one-to-one online consultations from{" "}
              {business.doctorName}, {business.professionalTitle} — grounded in clinical expertise,
              delivered with real accountability.
            </p>

            <div
              className="animate-fade-up mt-6 flex flex-wrap gap-2.5"
              style={{ animationDelay: "0.3s" }}
            >
              {credentials.map((credential) => (
                <span
                  key={credential.title}
                  className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-4 py-2 text-xs font-semibold text-navy/80 backdrop-blur-sm"
                >
                  <credential.icon className="h-3.5 w-3.5 text-primary" />
                  {credential.title}
                </span>
              ))}
              <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-4 py-2 text-xs font-semibold text-navy/80 backdrop-blur-sm">
                <CalendarCheck className="h-3.5 w-3.5 text-primary" />
                Secure Video Consultations
              </span>
            </div>

            <div
              className="animate-fade-up mt-8 flex flex-col items-start gap-4"
              style={{ animationDelay: "0.42s" }}
            >
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to="/booking"
                  className="group relative z-30 inline-flex cursor-pointer items-center gap-2.5 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_14px_30px_-12px_rgba(37,63,164,0.55)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-turquoise hover:shadow-[0_20px_40px_-14px_rgba(56,183,199,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <CalendarCheck className="h-[1.15rem] w-[1.15rem] transition-transform duration-300 group-hover:scale-110" />
                  Book a Consultation
                </Link>
                <Link
                  to="/packages"
                  className="group inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-card/70 px-6 py-3.5 text-sm font-semibold text-navy backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-turquoise/60"
                >
                  View Packages
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:-scale-x-100" />
                </Link>
              </div>
              <a
                href={business.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-navy/55 transition-colors hover:text-primary"
              >
                <InstagramIcon className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                Follow along on Instagram
              </a>
            </div>
          </div>

          {/* Right: portrait composition */}
          <div className="order-2">
            <Portrait />
          </div>
        </div>
      </div>
    </section>
  );
}

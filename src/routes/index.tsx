import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/landing/Header";
import { Portrait } from "@/components/landing/Portrait";
import { HeroBackground } from "@/components/landing/HeroBackground";
import { INSTAGRAM_URL, InstagramIcon } from "@/components/landing/instagram";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Monzer Allan | Nutrition, Health & Wellness" },
      {
        name: "description",
        content:
          "Trusted nutrition, health, and wellness guidance from Monzer Allan, Nutrition Specialist and Pharmacist.",
      },
      { property: "og:title", content: "Monzer Allan | Nutrition, Health & Wellness" },
      {
        property: "og:description",
        content:
          "Trusted nutrition, health, and wellness guidance from Monzer Allan, Nutrition Specialist and Pharmacist.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background">
      <HeroBackground />

      <Header />

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 sm:px-10">
        <section className="grid flex-1 grid-cols-1 items-center gap-12 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-16">
          {/* Left: editorial content */}
          <div className="order-1 max-w-xl">
            <p
              className="animate-fade-up text-xs font-semibold uppercase tracking-[0.28em] text-primary"
              style={{ animationDelay: "0.05s" }}
            >
              Nutrition <span className="text-gold">•</span> Health{" "}
              <span className="text-gold">•</span> Wellness
            </p>

            <h1
              className="animate-fade-up mt-6 font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-6xl"
              style={{ animationDelay: "0.15s" }}
            >
              Better Health Starts With{" "}
              <span className="text-primary">Better Understanding.</span>
            </h1>

            <p
              className="animate-fade-up mt-6 text-base leading-relaxed text-muted-foreground sm:text-lg"
              style={{ animationDelay: "0.25s" }}
            >
              Trusted nutrition, health, and wellness guidance by Monzer Allan —
              Nutrition Specialist &amp; Pharmacist.
            </p>

            <p
              className="animate-fade-up mt-4 text-sm font-medium text-foreground/70"
              style={{ animationDelay: "0.32s" }}
            >
              A healthier digital experience is on the way.
            </p>

            <div
              className="animate-fade-up mt-9 flex flex-col items-start gap-3"
              style={{ animationDelay: "0.42s" }}
            >
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2.5 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_14px_30px_-12px_rgba(74,90,43,0.6)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-14px_rgba(74,90,43,0.7)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <InstagramIcon className="h-[1.15rem] w-[1.15rem] transition-transform duration-300 group-hover:scale-110" />
                Follow on Instagram
              </a>
              <p className="text-sm italic text-muted-foreground">
                Simple knowledge. Smarter choices. Better health.
              </p>
            </div>
          </div>

          {/* Right: portrait composition */}
          <div className="order-2">
            <Portrait />
          </div>

        </section>

        <footer className="animate-fade-in relative z-10 mt-auto border-t border-border/60 py-7 text-center sm:text-left">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              © 2026 Monzer Allan. All rights reserved.
            </p>
            <p className="max-w-md text-xs leading-relaxed text-muted-foreground/80">
              Educational content only and is not a substitute for professional
              medical consultation.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

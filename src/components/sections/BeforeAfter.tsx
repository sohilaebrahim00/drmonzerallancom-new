import { Quote, TrendingDown, TrendingUp } from "lucide-react";

import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";
import { CompareSlider } from "@/components/common/CompareSlider";
import { transformations } from "@/data/transformations";
import { cn } from "@/lib/utils";

const beforeGradients: Record<string, string> = {
  processed: "from-navy/70 via-navy/50 to-navy/30",
  irregular: "from-[#5b3a29]/70 via-[#5b3a29]/45 to-[#5b3a29]/25",
  "low-energy": "from-slate-500/70 via-slate-500/45 to-slate-500/25",
};

const afterGradients: Record<string, string> = {
  balanced: "from-turquoise/80 via-turquoise/55 to-secondary",
  structured: "from-primary/80 via-primary/55 to-secondary",
  energized: "from-green/70 via-turquoise/50 to-secondary",
};

function Panel({
  tone,
  gradientMap,
  value,
  label,
  trendDown,
}: {
  tone: string;
  gradientMap: Record<string, string>;
  value: string;
  label: string;
  trendDown: boolean;
}) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-end gap-2 bg-gradient-to-br p-6 pb-9 text-center",
        gradientMap[tone],
      )}
    >
      {trendDown ? (
        <TrendingDown className="h-7 w-7 text-white/90" />
      ) : (
        <TrendingUp className="h-7 w-7 text-white/90" />
      )}
      <p className="font-display text-3xl font-extrabold text-white sm:text-4xl">{value}</p>
      <p className="text-xs font-medium uppercase tracking-wide text-white/80">{label}</p>
    </div>
  );
}

export function BeforeAfter() {
  // Hides automatically until real, explicitly consented before/after
  // content exists — see src/data/transformations.ts.
  if (transformations.length === 0) return null;

  return (
    <section
      id="transformations"
      className="relative py-20 sm:py-28"
      aria-labelledby="transformations-heading"
    >
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-10">
        <SectionHeading
          eyebrow="Real Progress"
          title="Transformation Stories"
          description="Illustrative snapshots of client progress. Drag the slider to compare before and after results."
        />

        <div className="mt-14 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {transformations.map((story, index) => (
            <Reveal key={story.name} direction="up" delay={index * 0.1}>
              <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-shadow duration-300 hover:shadow-[0_24px_50px_-24px_rgba(23,35,59,0.35)]">
                <CompareSlider
                  before={
                    <Panel
                      tone={story.beforeTone}
                      gradientMap={beforeGradients}
                      value={story.before}
                      label={story.metricLabel}
                      trendDown={false}
                    />
                  }
                  after={
                    <Panel
                      tone={story.afterTone}
                      gradientMap={afterGradients}
                      value={story.after}
                      label={story.metricLabel}
                      trendDown
                    />
                  }
                />
                <div className="flex flex-1 flex-col gap-3 p-6">
                  <Quote className="h-5 w-5 text-turquoise" aria-hidden="true" />
                  <p className="flex-1 text-sm leading-relaxed text-navy/80">
                    &ldquo;{story.quote}&rdquo;
                  </p>
                  <div className="flex items-center justify-between border-t border-border/60 pt-3">
                    <div>
                      <p className="text-sm font-semibold text-navy">{story.name}</p>
                      <p className="text-xs text-muted-foreground">{story.service}</p>
                    </div>
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-primary">
                      {story.duration}
                    </span>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

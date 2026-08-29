import { Quote, TrendingDown, TrendingUp } from "lucide-react";

import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";
import { CompareSlider } from "@/components/common/CompareSlider";
import { Photo } from "@/components/common/Photo";
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
  // The CLIENT STORIES below stay hidden until real, explicitly consented
  // before/after content exists (src/data/transformations.ts is deliberately
  // empty). That gate used to return null for the whole section; it now
  // guards only the stories grid, because the plate comparison added in
  // Phase 9 is staged photography of a table, needs no patient consent, and
  // would otherwise never render.
  const hasConsentedStories = transformations.length > 0;

  return (
    <section
      id="transformations"
      className="relative py-20 sm:py-28"
      aria-labelledby="transformations-heading"
    >
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-10">
        {/* Two staged photographs of the SAME table. Deliberately given their
            own heading and caption rather than being dropped into the client
            stories grid below: a compare slider on a doctor's site is read as
            a patient's result unless it says otherwise, and this is a plate,
            not a person.

            Not mirrored in RTL — these are overhead shots with no
            left-to-right narrative, and the handle position belongs to the
            reader. (Contrast the not-medication band, which does mirror.) */}
        <SectionHeading
          eyebrow="What Changes"
          title="The same table, two different evenings"
          description="Drag the slider to compare. This is about what is on the plate — not about anyone's body."
        />

        <Reveal direction="up" className="mt-12">
          <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
            <CompareSlider
              before={
                <Photo
                  base="/images/plate-before"
                  width={1400}
                  height={1050}
                  alt="A dimly lit table at night: an open takeaway box of fried chicken and chips, a bottle of cola, a half-used blister pack of pills, a crumpled napkin and a phone."
                  imgClassName="h-full w-full object-cover"
                />
              }
              after={
                <Photo
                  base="/images/plate-after"
                  width={1400}
                  height={1050}
                  alt="The same table in daylight: a whole grilled fish with a green salad, black olives and lemon slices, beside a glass of water."
                  imgClassName="h-full w-full object-cover"
                />
              }
            />
          </div>
          <p className="mx-auto mt-4 max-w-3xl text-center text-xs leading-relaxed text-muted-foreground">
            An illustration of a change in eating, photographed for this website. It is not a client
            photograph and does not show anyone&apos;s results.
          </p>
        </Reveal>

        {hasConsentedStories && (
          <div className="mt-20">
            <SectionHeading
              eyebrow="Real Progress"
              title="Transformation Stories"
              description="Illustrative snapshots of client progress. Drag the slider to compare before and after results."
            />
          </div>
        )}

        <div className="mt-14 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {(hasConsentedStories ? transformations : []).map((story, index) => (
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

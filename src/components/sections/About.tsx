import { Compass, Target } from "lucide-react";

import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";
import { bio, credentials } from "@/data/about";

export function About() {
  return (
    <section id="about" className="relative py-20 sm:py-28" aria-labelledby="about-heading">
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-10">
        <SectionHeading
          eyebrow="About Monzer"
          title="Nutrition Guidance Rooted In Real Clinical Expertise"
          description="A closer look at the philosophy and credentials behind the practice."
        />

        <div className="mt-14 grid grid-cols-1 items-start gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <Reveal direction="right" className="lg:sticky lg:top-28">
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

          <div className="flex flex-col gap-10">
            <Reveal direction="up" className="space-y-4">
              {bio.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-base leading-relaxed text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </Reveal>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Reveal direction="up" delay={0.05}>
                <div className="h-full rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                    <Target className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold text-navy">Mission</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {bio.mission}
                  </p>
                </div>
              </Reveal>
              <Reveal direction="up" delay={0.12}>
                <div className="h-full rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-turquoise">
                    <Compass className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold text-navy">Vision</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{bio.vision}</p>
                </div>
              </Reveal>
            </div>

            <div>
              <Reveal direction="up">
                <h3 className="font-display text-lg font-bold text-navy">Credentials</h3>
              </Reveal>
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {credentials.map((credential, index) => (
                  <Reveal key={credential.title} direction="up" delay={index * 0.06}>
                    <div className="flex items-start gap-3.5 rounded-xl border border-border/60 bg-background p-4 transition-colors hover:border-turquoise/60">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                        <credential.icon className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-navy">{credential.title}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                          {credential.description}
                        </p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

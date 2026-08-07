import { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";

import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { testimonials } from "@/data/testimonials";

function GoogleG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.69 28.18A13.96 13.96 0 0 1 10.94 24c0-1.45.25-2.86.7-4.18v-5.7H4.34A21.99 21.99 0 0 0 2 24c0 3.55.85 6.91 2.34 9.88z"
      />
      <path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </svg>
  );
}

export function Testimonials() {
  const [api, setApi] = useState<CarouselApi>();
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const hasTestimonials = testimonials.length > 0;

  useEffect(() => {
    if (!hasTestimonials) return;
    if (!api || paused) {
      window.clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext();
      } else {
        api.scrollTo(0);
      }
    }, 4500);
    return () => window.clearInterval(intervalRef.current);
  }, [api, paused, hasTestimonials]);

  // Hides automatically until real, consented client testimonials exist —
  // see src/data/testimonials.ts.
  if (!hasTestimonials) return null;

  return (
    <section
      id="testimonials"
      className="relative py-20 sm:py-28"
      aria-labelledby="testimonials-heading"
    >
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-10">
        <SectionHeading eyebrow="Client Reviews" title="What Clients Are Saying" />

        <Reveal direction="up" delay={0.1} className="mt-14">
          <Carousel
            setApi={setApi}
            opts={{ align: "start", loop: true }}
            className="mx-auto"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <CarouselContent>
              {testimonials.map((testimonial) => (
                <CarouselItem key={testimonial.name} className="sm:basis-1/2 lg:basis-1/3">
                  <div className="flex h-full flex-col gap-4 rounded-2xl border border-border/70 bg-card p-6 shadow-sm transition-shadow duration-300 hover:shadow-[0_20px_45px_-24px_rgba(23,35,59,0.3)]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-secondary font-display font-bold text-primary">
                            {testimonial.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold text-navy">{testimonial.name}</p>
                          <p className="text-xs text-muted-foreground">{testimonial.date}</p>
                        </div>
                      </div>
                      <GoogleG className="h-5 w-5" />
                    </div>
                    <div
                      className="flex items-center gap-0.5"
                      aria-label={`${testimonial.rating} out of 5 stars`}
                    >
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={
                            i < testimonial.rating
                              ? "h-4 w-4 fill-amber-400 text-amber-400"
                              : "h-4 w-4 text-muted-foreground/30"
                          }
                        />
                      ))}
                    </div>
                    <p className="flex-1 text-sm leading-relaxed text-navy/80">
                      {testimonial.review}
                    </p>
                    <span className="w-fit rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-primary">
                      {testimonial.service}
                    </span>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="mt-8 flex items-center justify-center gap-3">
              <CarouselPrevious className="static translate-y-0" />
              <CarouselNext className="static translate-y-0" />
            </div>
          </Carousel>
        </Reveal>
      </div>
    </section>
  );
}

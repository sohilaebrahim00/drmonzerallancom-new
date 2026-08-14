import { useState } from "react";
import { Bot, HeartPulse, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { hapticTap } from "@/lib/haptics";
import { cn } from "@/lib/utils";

const SLIDES = [
  {
    icon: Sparkles,
    title: "Your Nutrition, Tracked",
    body: "Scan meals, see your calories, and follow a program built around your goals.",
  },
  {
    icon: HeartPulse,
    title: "A Real Doctor Behind It",
    body: "Dr. Monzer Allan can assign a personalized 30-day nutrition program and review your progress.",
  },
  {
    icon: Bot,
    title: "Friends & Support",
    body: "Connect with friends, share progress if you choose, and get help from the AI Concierge.",
  },
] as const;

/**
 * Purely local slide position — this never gates routing by itself (that's
 * entirely AppBootContext's job, see the orchestrator), so it can't
 * reintroduce the stale-state class of bug even though it's local state.
 */
export function WelcomeStep({
  onContinue,
  onSkipToApp,
}: {
  onContinue: () => void;
  onSkipToApp: () => void;
}) {
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  return (
    <div className="native-safe-top native-safe-bottom flex h-dvh flex-col bg-background px-6">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-navy to-primary text-white shadow-[0_20px_44px_-20px_rgba(23,35,59,0.5)]">
          <slide.icon className="h-9 w-9" />
        </span>
        <p className="mt-6 font-display text-2xl font-extrabold tracking-tight text-navy">
          {slide.title}
        </p>
        <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
          {slide.body}
        </p>
      </div>

      <div className="flex justify-center gap-1.5 pb-6">
        {SLIDES.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === index ? "w-6 bg-primary" : "w-1.5 bg-border",
            )}
          />
        ))}
      </div>

      <div className="flex flex-col gap-2.5 pb-6">
        {isLast ? (
          <>
            <Button
              onClick={() => {
                hapticTap();
                onContinue();
              }}
              className="w-full cursor-pointer"
            >
              Get Started — It&apos;s Free
            </Button>
            <button
              type="button"
              onClick={onSkipToApp}
              className="cursor-pointer text-center text-xs font-semibold text-muted-foreground"
            >
              Continue as guest
            </button>
          </>
        ) : (
          <>
            <Button
              onClick={() => {
                hapticTap();
                setIndex((i) => i + 1);
              }}
              className="w-full cursor-pointer"
            >
              Next
            </Button>
            <button
              type="button"
              onClick={onSkipToApp}
              className="cursor-pointer text-center text-xs font-semibold text-muted-foreground"
            >
              Skip
            </button>
          </>
        )}
      </div>
    </div>
  );
}

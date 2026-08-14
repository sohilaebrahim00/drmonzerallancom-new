import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const ONBOARDING_STEPS = [
  "welcome",
  "account",
  "basics",
  "body_health",
  "privacy",
  "connect_doctor",
  "ready",
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

interface OnboardingStepShellProps {
  step: OnboardingStep;
  title: string;
  subtitle?: string;
  children: ReactNode;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  saving?: boolean;
  onBack?: () => void;
  onSkip?: () => void;
  skipLabel?: string;
  hideProgress?: boolean;
}

/**
 * Shared chrome for every onboarding step — progress dots + a single
 * Next/primary action, always disabled while `saving` so one tap can never
 * fire two mutations (see the "button reliability" requirement in the
 * implementation report — this is the one place that rule is enforced for
 * the whole onboarding flow, rather than re-implemented per step).
 */
export function OnboardingStepShell({
  step,
  title,
  subtitle,
  children,
  onNext,
  nextLabel = "Next",
  nextDisabled = false,
  saving = false,
  onBack,
  onSkip,
  skipLabel = "Skip for now",
  hideProgress = false,
}: OnboardingStepShellProps) {
  const stepIndex = ONBOARDING_STEPS.indexOf(step);

  return (
    <div className="native-safe-top native-safe-bottom flex h-dvh flex-col bg-background px-6">
      {!hideProgress && (
        <div className="flex justify-center gap-1.5 pt-4 pb-2">
          {ONBOARDING_STEPS.map((s, i) => (
            <span
              key={s}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === stepIndex
                  ? "w-6 bg-primary"
                  : i < stepIndex
                    ? "w-1.5 bg-primary/40"
                    : "w-1.5 bg-border",
              )}
            />
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-4">
        <p className="font-display text-xl font-extrabold tracking-tight text-navy">{title}</p>
        {subtitle && (
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
        )}
        <div className="mt-5">{children}</div>
      </div>

      <div className="flex flex-col gap-2 pb-6 pt-2">
        {onNext && (
          <Button
            onClick={onNext}
            disabled={nextDisabled || saving}
            className="w-full cursor-pointer justify-center"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : nextLabel}
          </Button>
        )}
        <div className="flex items-center justify-between">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              disabled={saving}
              className="cursor-pointer text-xs font-semibold text-muted-foreground disabled:opacity-50"
            >
              Back
            </button>
          ) : (
            <span />
          )}
          {onSkip && (
            <button
              type="button"
              onClick={onSkip}
              disabled={saving}
              className="cursor-pointer text-xs font-semibold text-muted-foreground disabled:opacity-50"
            >
              {skipLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

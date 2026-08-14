import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ReadyStep({ onFinish }: { onFinish: () => Promise<void> }) {
  return (
    <div className="native-safe-top native-safe-bottom flex h-dvh flex-col items-center justify-center bg-background px-6 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-navy to-primary text-white shadow-[0_20px_44px_-20px_rgba(23,35,59,0.5)]">
        <CheckCircle2 className="h-9 w-9" />
      </span>
      <p className="mt-6 font-display text-2xl font-extrabold tracking-tight text-navy">
        You&apos;re all set
      </p>
      <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
        Scan your first meal, or explore your dashboard.
      </p>
      <Button onClick={onFinish} className="mt-8 w-full max-w-xs cursor-pointer justify-center">
        Go to My Dashboard
      </Button>
    </div>
  );
}

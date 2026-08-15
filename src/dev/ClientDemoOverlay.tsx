import { useState } from "react";
import { CaretDown, Flask, Stethoscope, User } from "@phosphor-icons/react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { isClientDemoBuild, setClientDemoMode, type DemoMode } from "@/dev/demoMode";
import { cn } from "@/lib/utils";

/**
 * The client-demo build's single subtle indicator — a small floating pill
 * (never a wide bar spanning the viewport) fixed just below the header, so
 * it can never sit on top of a screen's own primary buttons (Program CTAs,
 * Daily Log, Scan actions, the message composer, bottom navigation — see
 * §31/§92). Bottom-corner placement was tried first and rejected: every
 * screen with a bottom CTA/composer/Skip button or a mobile tab bar ends up
 * with real content scrolling directly underneath a bottom-fixed element,
 * since page content has no reason to reserve clearance for it. The header
 * band, by contrast, is reserved chrome no screen ever renders CTAs into,
 * so anchoring just beneath it is collision-free by construction. Everything
 * else (the "sample data" disclaimer, the User/Doctor switch) lives inside a
 * popover that only appears on tap, not permanently on screen. Self-guards
 * on isClientDemoBuild() so it can never render in the real production
 * builds even if imported by mistake somewhere.
 */
export function ClientDemoOverlay({ mode }: { mode: DemoMode }) {
  const [open, setOpen] = useState(false);
  if (!isClientDemoBuild() || !mode) return null;

  function switchTo(next: "user" | "doctor") {
    setClientDemoMode(next);
    window.location.href = "/";
  }

  return (
    <div className="native-safe-x fixed right-3 top-[calc(3.75rem+env(safe-area-inset-top))] z-[9999] lg:right-4 lg:top-[4.75rem]">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-full bg-navy/90 py-2 pl-3 pr-2.5 text-[0.65rem] font-semibold text-white shadow-lg backdrop-blur transition-transform hover:scale-105 active:scale-95"
          >
            <Flask className="h-3.5 w-3.5 text-turquoise" />
            Client Preview
            <CaretDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="bottom"
          align="end"
          sideOffset={10}
          className="w-64 rounded-2xl border-border/60 bg-white p-3.5 shadow-xl"
        >
          <p className="text-xs font-bold text-navy">Client Preview</p>
          <p className="mt-1 text-[0.7rem] leading-relaxed text-muted-foreground">
            Sample data only. Live account and health data are not connected.
          </p>

          <div className="mt-3 space-y-1.5">
            <button
              type="button"
              onClick={() => switchTo("user")}
              className={cn(
                "flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition-colors",
                mode === "user" ? "bg-secondary text-primary" : "text-navy hover:bg-secondary/60",
              )}
            >
              <User className="h-4 w-4" /> User Experience
            </button>
            <button
              type="button"
              onClick={() => switchTo("doctor")}
              className={cn(
                "flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition-colors",
                mode === "doctor" ? "bg-secondary text-primary" : "text-navy hover:bg-secondary/60",
              )}
            >
              <Stethoscope className="h-4 w-4" /> Doctor Experience
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

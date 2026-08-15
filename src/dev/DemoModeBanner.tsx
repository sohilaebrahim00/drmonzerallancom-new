import { Flask, X } from "@phosphor-icons/react";

import { clearDemoMode, getDemoMode } from "@/dev/demoMode";

/**
 * The one subtle development indicator required by the demo-preview spec —
 * not a "DEMO" badge on every screen, just a single small fixed pill so
 * whoever is looking never mistakes fixture data for a real account.
 * Renders nothing outside DEV or when no demo mode is active (both the
 * import.meta.env.DEV guard AND the getDemoMode() === null guard have to
 * pass), so it's inert in every production build.
 */
export function DemoModeBanner() {
  if (!import.meta.env.DEV) return null;
  const mode = getDemoMode();
  if (!mode) return null;

  return (
    <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-1/2 z-[9999] -translate-x-1/2 lg:bottom-3">
      <div className="flex items-center gap-1.5 rounded-full bg-navy/90 px-3 py-1.5 text-[0.65rem] font-semibold text-white shadow-lg backdrop-blur">
        <Flask className="h-3 w-3 text-turquoise" />
        <span>
          {mode === "doctor" ? "Demo Doctor Preview" : "Demo User Preview"} — local fixture data
        </span>
        <button
          type="button"
          onClick={() => {
            clearDemoMode();
            window.location.href = "/?app-preview=true";
          }}
          aria-label="Exit demo preview"
          className="ml-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/15 hover:bg-white/25"
        >
          <X className="h-2.5 w-2.5" />
        </button>
      </div>
    </div>
  );
}

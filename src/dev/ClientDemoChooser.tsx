import { Stethoscope, UserCircle } from "@phosphor-icons/react";

import { setClientDemoMode } from "@/dev/demoMode";

/**
 * Landing screen for the client-demo build (`demo.monzerallan.com`) when no
 * view has been chosen yet — reached at `/` before `/user` or `/doctor` has
 * ever been visited. Never rendered in the real production builds (only
 * mounted from ClientDemoApp, itself only mounted when isClientDemoBuild()
 * is true — see App.tsx).
 */
export function ClientDemoChooser() {
  function choose(mode: "user" | "doctor") {
    setClientDemoMode(mode);
    // Full navigation (not client-side) — the app hasn't mounted
    // AppExperience yet at this point, so a plain reload into "/" is the
    // simplest correct way to boot straight into the chosen fixture state.
    window.location.href = "/";
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-app-shell px-6 py-12">
      <div className="w-full max-w-sm text-center">
        <img
          src="/ma-logo.png"
          alt=""
          className="mx-auto h-14 w-14 rounded-full border border-border/70 object-contain p-1.5"
        />
        <p className="mt-4 font-display text-2xl font-extrabold tracking-tight text-navy">
          Dr. Monzer Allan
        </p>
        <p className="mt-1 text-sm font-semibold text-primary">Client Preview</p>
        <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
          Explore the application from both perspectives.
        </p>

        <div className="mt-7 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => choose("user")}
            className="flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-turquoise"
          >
            <UserCircle className="h-4.5 w-4.5" weight="fill" /> User Experience
          </button>
          <button
            type="button"
            onClick={() => choose("doctor")}
            className="flex items-center justify-center gap-2 rounded-full border border-border px-5 py-3.5 text-sm font-semibold text-navy transition-colors hover:border-turquoise"
          >
            <Stethoscope className="h-4.5 w-4.5" weight="duotone" /> Doctor Experience
          </button>
        </div>

        <p className="mx-auto mt-8 max-w-xs text-xs leading-relaxed text-muted-foreground/80">
          Sample data only. Live account and health data are not connected.
        </p>
      </div>
    </div>
  );
}

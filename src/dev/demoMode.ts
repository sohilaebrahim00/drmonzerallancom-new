/**
 * Demo-user/demo-doctor preview mode — active in TWO distinct contexts:
 *
 *  1. DEV-ONLY dev-preview (unchanged from before): `import.meta.env.DEV`
 *     is true only under `vite`/`vite --mode app`, never in a real build.
 *  2. The dedicated CLIENT DEMO build (`vite build --mode client-demo`,
 *     `npm run build:demo`, output `dist-demo/`) — a completely separate
 *     deployment target (`demo.monzerallan.com`) built specifically to let
 *     a client explore the app with fixture data. See
 *     CLIENT_DEMO_DEPLOYMENT.md and src/dev/ClientDemoApp.tsx.
 *
 * It is NEVER active in the real production builds (`npm run build:web` →
 * dist/, `npm run build:app` → dist-app/) — those are the exact two
 * outputs that ever reach monzerallan.com / app.monzerallan.com.
 *
 * SAFETY — why this cannot leak into monzerallan.com / app.monzerallan.com:
 *  1. Every entry point below starts with a guard that is `false` whenever
 *     neither DEV nor the client-demo build mode applies.
 *     `import.meta.env.DEV` and `import.meta.env.VITE_APP_MODE` are both
 *     replaced by Vite/Rolldown with literal values at build time — for
 *     `npm run build:web`/`build:app` that literal is always
 *     `DEV=false` and `VITE_APP_MODE` is `undefined`/`"pwa"`, never
 *     `"client-demo"`, so the guard is a compile-time-provable `false`
 *     there. Same mechanism the pre-existing `?app-preview=true`
 *     dev-preview flag already relies on (see
 *     src/hooks/use-native-platform.ts's isAppPreviewForced()).
 *  2. Belt-and-suspenders: vite.config.ts additionally swaps this whole
 *     module (and demoFixtures.ts) for an empty production stub via a
 *     resolver alias for `npm run build:web`/`build:app` specifically
 *     (never for `build:demo`) — so even dead/unreachable code in those
 *     two builds contains no real fixture data. Verified by grepping
 *     dist/dist-app for fixture strings after every build.
 *  3. Nothing in this file or its guards ever imports or calls the
 *     Supabase client. Demo state is 100% in-memory fixture data — no
 *     network request is made, so nothing can be "written" anywhere. The
 *     client-demo build additionally ships with blank Supabase env vars
 *     (see .env.client-demo), so `supabase` is structurally `null` there
 *     even if a guard were ever missed.
 *  4. Demo mode never touches real Supabase auth. AuthContext still runs
 *     its real supabase.auth.getSession()/onAuthStateChange() wiring in
 *     every build; demo mode only ever *substitutes* the resulting
 *     user/session value it hands to the rest of the app when active.
 *
 * Activation:
 *  - Dev preview: `?app-preview=true&demo-user=true` or
 *    `?app-preview=true&demo-doctor=true`, persisted to localStorage the
 *    same way `__force_app_preview` is, so it survives client-side
 *    navigation (the query string itself doesn't).
 *  - Client demo build: visiting `/user` or `/doctor` (see
 *    ClientDemoApp.tsx) calls setClientDemoMode() directly — no query
 *    parameters needed, so a client never has to type one.
 */

export type DemoMode = "user" | "doctor" | null;

const DEMO_USER_KEY = "__demo_user_mode";
const DEMO_DOCTOR_KEY = "__demo_doctor_mode";

/**
 * True only for the dedicated client-demo build
 * (`vite build --mode client-demo`, see vite.config.ts / .env.client-demo).
 * A public, non-secret build-mode flag only — mirrors isAppBuildMode() in
 * src/hooks/use-native-platform.ts. Always false for `build:web`/`build:app`.
 */
export function isClientDemoBuild(): boolean {
  return import.meta.env.VITE_APP_MODE === "client-demo";
}

function demoModeAllowed(): boolean {
  return Boolean(import.meta.env.DEV || isClientDemoBuild());
}

/**
 * Reads and latches the current demo mode. Safe to call from anywhere
 * (services, contexts, components) — always `null` outside DEV/client-demo,
 * always `null` on the server/build step (no `window`).
 */
export function getDemoMode(): DemoMode {
  if (!demoModeAllowed() || typeof window === "undefined") return null;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("demo-doctor") === "true") localStorage.setItem(DEMO_DOCTOR_KEY, "1");
    if (params.get("demo-user") === "true") localStorage.setItem(DEMO_USER_KEY, "1");

    // demo-doctor takes precedence if a link/back-nav somehow carries both.
    if (localStorage.getItem(DEMO_DOCTOR_KEY) === "1") return "doctor";
    if (localStorage.getItem(DEMO_USER_KEY) === "1") return "user";
    return null;
  } catch {
    return null;
  }
}

/** Convenience boolean for guard clauses: `if (isDemoModeActive()) return DEMO_X;` */
export function isDemoModeActive(): boolean {
  return getDemoMode() !== null;
}

/**
 * Explicitly switches to one mode, clearing the other — used by
 * ClientDemoApp's `/user`/`/doctor` entry routes and the in-app
 * "Switch to User/Doctor View" control. Guarded the same as everything
 * else here; a no-op in the two real production builds.
 */
export function setClientDemoMode(mode: "user" | "doctor"): void {
  if (!demoModeAllowed() || typeof window === "undefined") return;
  try {
    if (mode === "user") {
      localStorage.setItem(DEMO_USER_KEY, "1");
      localStorage.removeItem(DEMO_DOCTOR_KEY);
    } else {
      localStorage.setItem(DEMO_DOCTOR_KEY, "1");
      localStorage.removeItem(DEMO_USER_KEY);
    }
  } catch {
    /* ignore */
  }
}

/** Clears both flags — used by the "Exit Demo Mode" control in the dev banner and the client-demo chooser link. */
export function clearDemoMode(): void {
  if (!demoModeAllowed() || typeof window === "undefined") return;
  try {
    localStorage.removeItem(DEMO_USER_KEY);
    localStorage.removeItem(DEMO_DOCTOR_KEY);
  } catch {
    /* ignore */
  }
}

/** Fixed, obviously-fake ids so any code that logs/keys on an id is never confused with a real UUID. */
export const DEMO_USER_ID = "demo-user-sarah-ahmed";
export const DEMO_DOCTOR_ID = "demo-doctor-monzer-allan";
export const DEMO_FRIEND_AHMED_ID = "demo-friend-ahmed-youssef";
export const DEMO_FRIEND_MONA_ID = "demo-friend-mona-saeed";
export const DEMO_PROGRAM_ID = "demo-program-30day";
export const DEMO_CONVERSATION_ID = "demo-conversation-ahmed";

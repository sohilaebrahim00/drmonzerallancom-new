/**
 * PRODUCTION STUB for src/dev/demoMode.ts — see demoFixtures.prod-stub.ts
 * for the full rationale. Swapped in only for the two real production
 * builds (`npm run build:web` / `build:app`, see vite.config.ts's
 * `isProdBuild` — explicitly excludes `--mode client-demo`). The dev
 * server and the client-demo build always resolve the real file. Every
 * function here is unconditionally inert; there is no code path in this
 * stub that could ever activate demo mode.
 */

export type DemoMode = "user" | "doctor" | null;

export function isClientDemoBuild(): boolean {
  return false;
}

export function getDemoMode(): DemoMode {
  return null;
}

export function isDemoModeActive(): boolean {
  return false;
}

export function setClientDemoMode(_mode: "user" | "doctor"): void {
  /* no-op in production */
}

export function clearDemoMode(): void {
  /* no-op in production */
}

export const DEMO_USER_ID = "";
export const DEMO_DOCTOR_ID = "";
export const DEMO_FRIEND_AHMED_ID = "";
export const DEMO_FRIEND_MONA_ID = "";
export const DEMO_PROGRAM_ID = "";
export const DEMO_CONVERSATION_ID = "";

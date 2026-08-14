import { Capacitor } from "@capacitor/core";

const APP_PREVIEW_STORAGE_KEY = "__force_app_preview";

/**
 * True only inside the Capacitor-wrapped Android/iOS app — false for the
 * regular website (including mobile browsers) and for the PWA/Web App.
 * Read once; Capacitor.isNativePlatform() can't change during a running
 * session, so this needs no state/effect.
 */
export function isNativePlatform() {
  if (import.meta.env.DEV && localStorage.getItem("__force_native_preview") === "1") return true;
  return Capacitor.isNativePlatform();
}

export function useNativePlatform() {
  return isNativePlatform();
}

export function nativePlatformName() {
  return Capacitor.getPlatform();
}

/**
 * The three environments this codebase actually presents a UI for:
 *  - MARKETING_WEB: the public website (monzerallan.com) — Header/Footer/long pages.
 *  - PWA_WEB_APP: the installable member app running in a regular browser
 *    (app.monzerallan.com) — same app-style screens as native, no marketing chrome.
 *  - CAPACITOR_NATIVE: the Android/iOS app shell.
 * This is the ONE place that decides which of the three applies — nothing
 * else should branch on hostname or Capacitor directly.
 */
export type AppMode = "MARKETING_WEB" | "PWA_WEB_APP" | "CAPACITOR_NATIVE";

/** Hostnames whose first label marks them as the Web App property rather than the marketing site. */
function isAppHostname(hostname: string): boolean {
  return hostname === "app.monzerallan.com" || hostname.startsWith("app.");
}

/**
 * Dev-only escape hatch to preview the PWA/Web App tree from a normal
 * localhost browser tab without touching hostname or Capacitor: visiting
 * `?app-preview=true` once flips a localStorage flag (mirroring the existing
 * `__force_native_preview` convention) that persists across in-app
 * client-side navigation, where the query string itself would otherwise be
 * dropped. Dead code in production builds (import.meta.env.DEV is
 * statically false there).
 */
function isAppPreviewForced(): boolean {
  if (!import.meta.env.DEV || typeof window === "undefined") return false;
  try {
    if (new URLSearchParams(window.location.search).get("app-preview") === "true") {
      localStorage.setItem(APP_PREVIEW_STORAGE_KEY, "1");
    }
    return localStorage.getItem(APP_PREVIEW_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * True when this build was produced by `npm run build:app` (see
 * vite.config.ts / .env.app) — a public, non-secret presentation-mode flag
 * only, baked in at build time so a `dist-app/` bundle previewed on any
 * hostname (e.g. `vite preview` on localhost) still renders as the Web App.
 * Never used for anything security-relevant.
 */
function isAppBuildMode(): boolean {
  return import.meta.env.VITE_APP_MODE === "pwa";
}

export function getAppMode(): AppMode {
  if (isNativePlatform()) return "CAPACITOR_NATIVE";
  if (isAppBuildMode()) return "PWA_WEB_APP";
  if (typeof window !== "undefined" && isAppHostname(window.location.hostname))
    return "PWA_WEB_APP";
  if (isAppPreviewForced()) return "PWA_WEB_APP";
  return "MARKETING_WEB";
}

/** True for either app-style surface (PWA or native) — the two share the exact same screen set. */
export function isAppExperience(): boolean {
  return getAppMode() !== "MARKETING_WEB";
}

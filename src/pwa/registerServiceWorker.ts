import { getAppMode } from "@/hooks/use-native-platform";

// Hand-rolled registration (not vite-plugin-pwa's `virtual:pwa-register`
// helper) so this file can be imported unconditionally from main.tsx in
// BOTH the marketing build and the app build — `virtual:pwa-register` only
// resolves when the VitePWA plugin is active (app build only, see
// vite.config.ts), so importing it here would break the marketing build.
// The generated dist-app/sw.js still supports the standard Workbox
// "waiting for SKIP_WAITING" pattern this relies on.

type UpdateListener = () => void;
let updateListener: UpdateListener | null = null;

/** Called once, from UpdateAvailableBanner, to be notified when a new version has finished installing in the background. */
export function onServiceWorkerUpdateAvailable(listener: UpdateListener) {
  updateListener = listener;
}

/** Activates the waiting service worker and reloads — only call from an explicit "Update" tap, never automatically mid-session. */
export function applyServiceWorkerUpdate() {
  navigator.serviceWorker?.getRegistration().then((registration) => {
    registration?.waiting?.postMessage({ type: "SKIP_WAITING" });
  });
}

/**
 * Registers the PWA service worker — a no-op everywhere except
 * PWA_WEB_APP in production (no sw.js exists in dev, and native/marketing
 * never need one). Deliberately skips the aggressive auto-refresh some
 * templates default to: the new version sits "waiting" until the visitor
 * taps Update (see UpdateAvailableBanner), so a mid-form or mid-chat session
 * is never interrupted.
 */
export function registerServiceWorker() {
  if (getAppMode() !== "PWA_WEB_APP") return;
  if (import.meta.env.DEV) return;
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        if (registration.waiting && registration.active) {
          updateListener?.();
        }
        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              updateListener?.();
            }
          });
        });
      })
      .catch(() => {
        // Offline support is a progressive enhancement — a failed registration shouldn't block the app.
      });
  });

  let reloadedOnce = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloadedOnce) return;
    reloadedOnce = true;
    window.location.reload();
  });
}

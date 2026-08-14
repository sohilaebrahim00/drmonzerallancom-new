import { isNativePlatform } from "@/hooks/use-native-platform";

/**
 * Central, real feature-detection for the handful of device capabilities
 * that behave differently across CAPACITOR_NATIVE and PWA_WEB_APP/browser —
 * no scattered user-agent sniffing. Every screen that touches camera,
 * geolocation, orientation, notifications, install prompts, or haptics
 * should branch on one of these rather than re-deriving platform checks.
 */

/** A photo-capture UI (Take Photo / Choose From Gallery) can always be offered — native uses the Camera plugin, browsers fall back to a file input. */
export function supportsCamera(): boolean {
  return isNativePlatform() || typeof document !== "undefined";
}

export function supportsGeolocation(): boolean {
  if (isNativePlatform()) return true;
  return typeof navigator !== "undefined" && "geolocation" in navigator;
}

export function supportsDeviceOrientation(): boolean {
  return typeof window !== "undefined" && "DeviceOrientationEvent" in window;
}

/** Whether ANY notification mechanism exists at all (native local notifications, or the browser Notification API). */
export function supportsNotifications(): boolean {
  if (isNativePlatform()) return true;
  return typeof window !== "undefined" && "Notification" in window;
}

/**
 * Whether a notification scheduled now can reliably fire later even if the
 * app/tab is closed. True only on native (Capacitor Local Notifications is
 * OS-scheduled). The browser Notification API has no equivalent without a
 * push subscription + server push infrastructure, which this app does not
 * have — so PWA/browser mode must not present a reminder toggle that implies
 * this behavior. See prayerNotificationService.ts.
 */
export function supportsScheduledBackgroundNotifications(): boolean {
  return isNativePlatform();
}

/**
 * Broad capability check — "can this environment ever install a PWA" — not
 * "will the install prompt fire right now" (that's a transient browser
 * event, see use-pwa-install.ts). Always false on native (already installed
 * as an app, no meta-install concept applies).
 */
export function supportsPWAInstall(): boolean {
  if (isNativePlatform()) return false;
  return typeof navigator !== "undefined" && "serviceWorker" in navigator;
}

/** Native Capacitor Haptics only — hapticTap()/hapticSuccess() already no-op safely elsewhere, this is for UI that wants to know in advance. */
export function supportsNativeHaptics(): boolean {
  return isNativePlatform();
}

export function isIOSDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return (
    /iphone|ipad|ipod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

/** True once the page is actually running as an installed standalone app (PWA) rather than a normal browser tab. */
export function isStandaloneDisplayMode(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  // iOS Safari never sets display-mode: standalone reliably; it exposes this instead.
  return Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
}

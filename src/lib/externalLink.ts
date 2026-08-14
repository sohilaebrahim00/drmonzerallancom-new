import { Browser } from "@capacitor/browser";

import { getAppMode, isNativePlatform } from "@/hooks/use-native-platform";

/**
 * Opens an external URL (Stripe Checkout, WhatsApp, etc.) appropriately per
 * platform:
 *  - CAPACITOR_NATIVE: an in-app browser tab (SFSafariViewController /
 *    Chrome Custom Tabs), so the visitor never leaves the app shell.
 *  - PWA_WEB_APP: a new tab, so an installed standalone app instance isn't
 *    replaced/lost by navigating its one tab away to an external site.
 *  - MARKETING_WEB: unchanged same-tab navigation — this is the existing,
 *    already-correct behavior for the live website's Stripe checkout flow
 *    (Stripe redirects back to our own success page), left exactly as-is.
 * Never navigate a native WebView's own location to an external domain
 * directly — Capacitor doesn't intercept that, and losing the app shell
 * mid-checkout is a poor, easily avoidable experience.
 */
export async function openExternal(url: string): Promise<void> {
  if (isNativePlatform()) {
    await Browser.open({ url });
    return;
  }
  if (getAppMode() === "PWA_WEB_APP") {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }
  window.location.href = url;
}

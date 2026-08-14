import { getAppMode } from "@/hooks/use-native-platform";

/**
 * index.html is one shared file for both the marketing build and the app
 * build (see vite.config.ts) — so PWA-specific `<head>` tags (manifest link,
 * iOS Add-to-Home-Screen metadata) are injected here at runtime instead of
 * baked into the static HTML, guarded strictly to PWA_WEB_APP. Never runs on
 * MARKETING_WEB (no PWA leakage onto monzerallan.com) or CAPACITOR_NATIVE
 * (irrelevant inside the app shell, and Capacitor ships its own manifest
 * story if it ever needs one).
 */
export function injectAppHtmlMeta() {
  if (getAppMode() !== "PWA_WEB_APP") return;
  if (typeof document === "undefined") return;

  const head = document.head;

  function addLink(rel: string, href: string, extra?: Record<string, string>) {
    const link = document.createElement("link");
    link.rel = rel;
    link.href = href;
    if (extra) Object.entries(extra).forEach(([k, v]) => link.setAttribute(k, v));
    head.appendChild(link);
  }

  function addMeta(name: string, content: string) {
    const meta = document.createElement("meta");
    meta.name = name;
    meta.content = content;
    head.appendChild(meta);
  }

  addLink("manifest", "/manifest.webmanifest");
  addLink("apple-touch-icon", "/icons/apple-touch-icon.png");

  // iOS Safari ignores the Web App Manifest for "Add to Home Screen" chrome
  // and needs these specific meta tags instead.
  addMeta("apple-mobile-web-app-capable", "yes");
  addMeta("apple-mobile-web-app-status-bar-style", "default");
  addMeta("apple-mobile-web-app-title", "Dr. Monzer");
  addMeta("mobile-web-app-capable", "yes");

  document.title = "Dr. Monzer Allan";

  // The Web App is a member utility surface, not public SEO content — the
  // marketing website (monzerallan.com) stays the one indexed property.
  // Keeps the static index.html's default "index, follow" intact for the
  // marketing build; only overridden here at runtime for PWA_WEB_APP.
  const robotsMeta = head.querySelector('meta[name="robots"]');
  if (robotsMeta) robotsMeta.setAttribute("content", "noindex, nofollow");
  else addMeta("robots", "noindex, nofollow");
  head.querySelector('link[rel="canonical"]')?.remove();
}

import { getAppMode } from "@/hooks/use-native-platform";
import { isClientDemoBuild } from "@/dev/demoMode";
import { injectClientDemoHtmlMeta } from "@/dev/injectClientDemoHtmlMeta";

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
  if (typeof document === "undefined") return;

  // The client-demo build (demo.monzerallan.com) is a separate deployment
  // target from the real Web App — checked first and returns early, so it
  // never falls through to the PWA_WEB_APP branch below (which would add a
  // manifest link/apple-touch-icon meant for app.monzerallan.com). Its only
  // needs here are: a distinct tab title, and noindex/nofollow so it's
  // never picked up by a search engine (see also public robots.txt handling
  // in scripts/write-client-demo-assets.cjs — this is the runtime layer for
  // crawlers that execute JS; that script is the authoritative layer for
  // ones that don't).
  if (isClientDemoBuild()) {
    injectClientDemoHtmlMeta();
    return;
  }

  if (getAppMode() !== "PWA_WEB_APP") return;

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

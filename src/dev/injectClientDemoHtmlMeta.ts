/**
 * Client-demo-build-only `<head>` adjustments (distinct tab title,
 * noindex/nofollow, drop the marketing canonical link) — split out of
 * src/pwa/injectAppHtmlMeta.ts specifically so this file (and its literal
 * "Client Preview" string) can be swapped for an empty production stub in
 * the two real builds via vite.config.ts's resolver alias. Only ever
 * called when isClientDemoBuild() is true — see injectAppHtmlMeta.ts.
 */
export function injectClientDemoHtmlMeta() {
  document.title = "Dr. Monzer Allan — Client Preview";
  const head = document.head;
  const robotsMeta = head.querySelector('meta[name="robots"]');
  if (robotsMeta) robotsMeta.setAttribute("content", "noindex, nofollow");
  else {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    head.appendChild(meta);
  }
  head.querySelector('link[rel="canonical"]')?.remove();
}

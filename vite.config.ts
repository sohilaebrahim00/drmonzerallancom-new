import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// `vite build` (default mode "production") builds the unchanged marketing
// website into dist/ — exactly as before, Capacitor's `webDir: "dist"` still
// points at it, and no PWA plugin ever runs for it.
//
// `vite build --mode app` (see package.json's build:app script, and
// .env.app) builds the same source into dist-app/ instead, with the PWA
// plugin active — this is the only build that ever gets a manifest/service
// worker. Marketing and app builds never share an output folder, so there's
// no risk of uploading the wrong one to the wrong Hostinger subdomain.
export default defineConfig(({ mode, command }) => {
  const isAppBuild = mode === "app";
  // The dedicated client-demo build (`vite build --mode client-demo`, see
  // package.json's build:demo script and .env.client-demo) — a completely
  // separate deployment target (demo.monzerallan.com) that DELIBERATELY
  // ships the real demo fixtures. Never true for build:web/build:app.
  const isClientDemoBuild = mode === "client-demo";
  // DEV-ONLY demo preview (see src/dev/demoMode.ts): the runtime
  // `import.meta.env.DEV` guard already makes every demo code path
  // unreachable in a production build, but that alone still leaves the
  // fixture DATA (names, sample health numbers) physically present in the
  // bundle, since minifiers don't eliminate dead code across a function
  // call boundary. The two REAL production builds (dist/ and dist-app/)
  // swap the real fixture/mode modules for empty production stubs at the
  // resolver level — the dev server AND the client-demo build always get
  // the real ones (client-demo needs the real fixtures; that's its whole
  // purpose). Belt-and-suspenders: verified empty by grepping dist/dist-app
  // for the real fixture strings after every build, and verified PRESENT in
  // dist-demo the same way.
  const isProdBuild = command === "build" && !isClientDemoBuild;

  return {
    plugins: [
      react(),
      tailwindcss(),
      isAppBuild &&
        VitePWA({
          // Manual registration (see src/pwa/registerServiceWorker.ts) — keeps
          // the update flow explicit ("Update Available" UI) instead of
          // auto-injecting a script that could refresh mid-form/mid-chat.
          injectRegister: false,
          registerType: "prompt",
          manifest: {
            name: "Dr. Monzer Allan",
            short_name: "Dr. Monzer",
            description:
              "Manage your membership, book consultations, and access your nutrition tools.",
            start_url: "/",
            scope: "/",
            display: "standalone",
            orientation: "portrait",
            theme_color: "#17233b",
            background_color: "#fcfdfd",
            icons: [
              { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
              { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
              {
                src: "/icons/icon-maskable-512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "maskable",
              },
            ],
          },
          workbox: {
            // App-shell precache only (JS/CSS/HTML/icons/fonts) — small and
            // static. Deliberately narrow: product photos etc. are handled
            // by the runtime cache below instead of bloating the install step.
            globPatterns: ["**/*.{js,css,html,ico,svg,png,woff2}"],
            navigateFallback: "/index.html",
            // Never precache or runtime-cache anything under /functions/ or
            // Supabase's own domain — auth, membership, consultation
            // availability, Stripe, and Gemini responses must always hit the
            // network. No runtimeCaching entry below matches them, which
            // means the service worker never intercepts those requests at all.
            runtimeCaching: [
              {
                // Same-origin static images (product photos, generated icons)
                // — safe to serve stale-while-revalidate offline.
                urlPattern: ({ request, sameOrigin }) =>
                  sameOrigin && request.destination === "image",
                handler: "StaleWhileRevalidate",
                options: {
                  cacheName: "app-images",
                  expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 },
                },
              },
              {
                urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                handler: "StaleWhileRevalidate",
                options: { cacheName: "google-fonts-stylesheets" },
              },
              {
                urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                handler: "CacheFirst",
                options: {
                  cacheName: "google-fonts-webfonts",
                  expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
                },
              },
            ],
          },
        }),
    ],
    resolve: {
      tsconfigPaths: true,
      alias: isProdBuild
        ? [
            {
              find: "@/dev/demoFixtures",
              replacement: fileURLToPath(
                new URL("./src/dev/demoFixtures.prod-stub.ts", import.meta.url),
              ),
            },
            {
              find: "@/dev/demoMode",
              replacement: fileURLToPath(
                new URL("./src/dev/demoMode.prod-stub.ts", import.meta.url),
              ),
            },
            {
              find: "@/dev/ClientDemoApp",
              replacement: fileURLToPath(
                new URL("./src/dev/ClientDemoApp.prod-stub.tsx", import.meta.url),
              ),
            },
            {
              find: "@/dev/injectClientDemoHtmlMeta",
              replacement: fileURLToPath(
                new URL("./src/dev/injectClientDemoHtmlMeta.prod-stub.ts", import.meta.url),
              ),
            },
          ]
        : [],
    },
    // VITE_APP_MODE itself comes from .env.app / .env.client-demo (loaded
    // automatically because this is Vite's built-in `mode`, via
    // `vite build --mode app` / `--mode client-demo`) — read at runtime by
    // getAppMode() / isClientDemoBuild(). Three distinct output folders,
    // never shared, so there is no risk of uploading the wrong one to the
    // wrong Hostinger subdomain.
    build: {
      outDir: isClientDemoBuild ? "dist-demo" : isAppBuild ? "dist-app" : "dist",
    },
  };
});

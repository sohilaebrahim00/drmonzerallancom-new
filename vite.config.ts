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
export default defineConfig(({ mode }) => {
  const isAppBuild = mode === "app";

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
    },
    // VITE_APP_MODE itself comes from .env.app (loaded automatically because
    // this is Vite's built-in `mode`, via `vite build --mode app") — read at
    // runtime by getAppMode() in src/hooks/use-native-platform.ts.
    build: {
      outDir: isAppBuild ? "dist-app" : "dist",
    },
  };
});

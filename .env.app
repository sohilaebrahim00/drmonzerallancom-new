# Loaded automatically by Vite when building with `--mode app` (see
# package.json's build:app script and vite.config.ts). This is a public,
# non-secret presentation-mode flag ONLY — it selects the app-style UI at
# runtime (getAppMode() in src/hooks/use-native-platform.ts); it must never
# gate auth or any security decision. Real secrets never go in a VITE_*
# variable regardless of file — see .env.example.
VITE_APP_MODE=pwa

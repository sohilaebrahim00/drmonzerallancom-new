/**
 * PRODUCTION STUB for src/dev/ClientDemoApp.tsx — see
 * demoFixtures.prod-stub.ts for the full rationale. Swapped in only for the
 * two real production builds (`npm run build:web` / `build:app`, see
 * vite.config.ts's `isProdBuild`). App.tsx never actually reaches the
 * component this replaces there (isClientDemoBuild() is always false), but
 * this stub additionally guarantees the real ClientDemoChooser/
 * ClientDemoOverlay copy ("Client Preview — Sample Data", button labels,
 * etc.) is never physically present in the dist/dist-app bundles either —
 * without this, those two files would still be pulled in by App.tsx's
 * top-level import and bundled as dead code.
 */
export function ClientDemoApp() {
  return null;
}

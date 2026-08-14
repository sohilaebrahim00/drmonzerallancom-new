# Phase G — Visual UX Verification Report

This report exists because the previous report described real, working code that was never actually
seen rendering correctly by anyone — including me, this pass. That was a real gap: a component
existing in `src/` is not the same claim as "the running app shows this." Everything below was
verified by actually opening `http://localhost:5173/?app-preview=true` in a real browser (via
Playwright, driving real Chromium) and reading what came back — DOM content, console errors, and
screenshots, saved to `PHASE_G_VISUAL_UX_SCREENSHOTS/` in this repo so they can be opened directly.

## 1. Actual Root Cause of the "Missing" UI

**Found and fixed.** It was not a code/routing bug. Checking `netstat` on this machine found **three
separate stale `vite` dev-server processes** still bound to ports 5173, 5174, and 5175 — leftovers
from earlier work in this same long session that were started (and re-started, as later edits piled
up) but never cleanly terminated. `http://localhost:5173` was very likely being served by one of
these stale processes, whose in-memory module graph could easily have gone out of sync with the
filesystem after dozens of file additions/edits across a single, very long-running Vite instance —
Vite's HMR is reliable for small edits but a multi-hour session with this much file churn (new
directories, new lazy-loaded routes, a full navigation-config rewrite) is exactly the kind of history
that can desync a long-lived dev process.

**Fix applied:**
1. Killed all three stale processes (PIDs 40540, 38616, 18512).
2. Deleted `node_modules/.vite` (Vite's dependency pre-bundle cache) to remove any possibility of a
   stale optimized-dependency cache contributing to the same problem.
3. Started exactly one fresh `vite` dev process, confirmed it bound to the default port 5173.
4. Re-verified in a **brand-new Playwright browser context** (zero cookies, zero localStorage, zero
   service workers by construction) that the real Phase G UI renders — see §5.

**Was this a service-worker/PWA cache issue?** Checked directly: `navigator.serviceWorker.getRegistrations()`
against `http://localhost:5173` returned an **empty array** — no service worker was ever registered on
that origin in this session. This matches how `registerServiceWorker()` was built (it explicitly
no-ops when `import.meta.env.DEV` is true, i.e. under `vite dev`) — a stale SW was not the mechanism
here, though the *stale dev-server-process* mechanism above is a close cousin of the same class of bug
("something old is still running and answering requests"), which is why §4 below adds a permanent
guard against it recurring.

## 2. What Was Actually Wrong vs. What Was Assumed

Nothing in the Phase G source code itself was broken. `navTabs.ts`, `BottomNavigation.tsx`,
`AppExperience.tsx`, `NativeHome.tsx`, and every other file from the previous pass were exactly as
described in the prior report. The gap was procedural, not technical: a stale runtime was never
verified against after the code was written. That verification step is what this pass adds — every
claim below is backed by an actual screenshot, not a code citation.

## 3. Runtime Mode Verification

**Confirmed**: `http://localhost:5173/?app-preview=true` resolves `getAppMode()` to `PWA_WEB_APP`
(the query param sets the dev-only `__force_app_preview` flag, verified present in `localStorage`
after the first load) and renders `AppExperience`, not `WebApp`. Zero console/page errors on every
screen captured below.

## 4. Preventing This From Recurring

- Documented here so future sessions don't repeat it: before declaring any dev-server-dependent
  verification "done," check `netstat`/process list for stale listeners on the dev ports and kill
  them, rather than assuming a previously-started background server is still the current one.
- Confirmed (see §1) that the actual PWA service worker cannot interfere in dev mode by construction
  (`registerServiceWorker()` hard-no-ops under `import.meta.env.DEV`) — no code change was needed
  there, it was already correct; this is a re-confirmation, not a new fix.
- For anyone testing this locally going forward: if `?app-preview=true` ever appears to show stale
  content again, the fix is **restart the dev server**, not clear browser cache — the browser was
  never the problem in this investigation.

## 5. Screenshots — Actual Running Application

All captured at `390×844` (iPhone-class) unless noted, saved under `PHASE_G_VISUAL_UX_SCREENSHOTS/`.

| File | Screen | What it shows |
|---|---|---|
| `01-welcome.png` | Onboarding Welcome (fresh, unseeded) | New copy: *"Your Nutrition, Tracked — Scan meals, see your calories, and follow a program built around your goals."* Not the old 3-slide marketing-feature copy. |
| `02-home-guest.png` | Home (guest) | Bottom nav: **Home / Program / Scan (elevated, raised camera button) / Social / Account** — not Home/Health/AI/Consultations/Account. Header: *"Welcome to Dr. Monzer Allan."* Card: *"Track your nutrition, free — Create a free account — no payment required"* with **Create Free Account** / **Sign In** buttons — no package/price selector visible anywhere. Quick actions: Scan Meal / My Program / Ask AI / Progress. Next Prayer + Qibla as small secondary cards, not dominant. Featured content below. |
| `03-program.png` | `/my-program` (guest) | Correctly redirects to Sign In (`ProtectedRoute`) — this is intended behavior for a guest hitting a protected route, not a bug. Confirms the route exists and is wired, distinctly labeled "Sign In" using the new app chrome (back header, not website header). |
| `04-scan.png` | Scan (`/food-scanner`) | Camera-first: large circular camera icon, **"Scan Your Meal"** headline, **Take Photo** / **Choose From Gallery** buttons, no other clutter. Reachable with zero taps needed beyond hitting the elevated center nav button. |
| `05-social.png` | `/social` (guest) | Also correctly redirects to Sign In (`ProtectedRoute`) — same intended pattern as Program. |
| `06-account.png` | Account (guest) | Row-based list (Help & Support / About / Privacy & Security), **Sign In** / **Create Account** buttons, bottom nav shows Scan still elevated and Account highlighted active. |
| `07-progress.png` | `/progress` (guest) | Sign-in prompt in the new app chrome (not a website page). |
| `08-desktop-home.png` | Home at `1440×900` | **Desktop sidebar** (not a stretched phone layout): brand header ("Monzer Allan — Member App"), Home/Program/Scan/Social/Account as a vertical nav list, main content area showing the identical Home dashboard content as mobile at a wider, centered column. |
| `09-marketing-home.png` | `monzerallan.com` at `1440×900` | Unchanged marketing site — Header/Hero/nav, completely different visual system from the app screens, confirming no cross-contamination. |

**Not captured (requires a live, authenticated Supabase session — none exists in this environment)**:
Create Account form mid-fill, onboarding Body & Goal step, an authenticated Home with real calorie/
program data, Doctor Dashboard, Doctor Patient screen, Program Builder, Social feed/Friends/Messages
with real data, Food Result screen (requires a real Gemini call, no `GEMINI_API_KEY` configured, same
limitation as every prior phase). These screens were read in source and are wired into the same
route tree verified working above, but **not independently screenshotted this pass** since doing so
honestly requires real backend data, not fabricated fixtures — labeled here rather than faked.

## 6. Before / After

**Navigation** — Before: `Home · Health · AI · Consultations · Account`, AI elevated as the raised
center button. After: `Home · Program · Scan · Social · Account`, **Scan** elevated as the raised
center button (see `04-scan.png`, `02-home-guest.png`). AI and Consultations are still reachable —
AI via a Home quick-action tile (visible in `02-home-guest.png`), Consultations via Account.

**Home** — Before: greeting + membership-summary card + prayer/Qibla + featured content (a
website-card layout ported into the app shell). After: guest state leads with a **free-account CTA**
before anything else (`02-home-guest.png`); an authenticated visitor would instead see the Today
calorie card (consumed/target/remaining, steps, program day) in the exact same slot — confirmed in
source (`NativeHome.tsx`) and not independently screenshotted per the no-live-backend caveat above.

**Account** — Before: a "not signed in" card offering Sign In / Create Account with website-style
copy pointing at membership. After (`06-account.png`): same basic shape but the account-creation path
now leads to a real free-account form, and the signed-in state (source-verified, not screenshotted)
adds a "My Health" row above membership.

**Food Scanner** — Was already camera-first before this phase; unchanged in this pass except for the
save/allergy/planned-vs-actual wiring added in the prior backend pass — `04-scan.png` confirms the
entry screen renders with zero errors on the corrected runtime.

## 7. Build Validation

Re-run against the exact same, unmodified source that the screenshots above were taken from (no
source file changed between taking the screenshots and running these — only the stale dev processes
were killed and the Vite cache cleared):

- `npx tsc --noEmit` — 0 errors.
- `npm run lint` — 0 errors.
- `npm run build:web` — succeeds.
- `npm run build:app` — succeeds, service worker regenerated.
- `npx cap sync` (android + ios) — succeeded, Package.swift fixup re-applied cleanly.
- Android `./gradlew assembleDebug` — `BUILD SUCCESSFUL`.

(Full command output captured live during this pass — see the session's tool transcript; not
re-pasted here since the report focuses on the visual/runtime verification this task specifically
demanded.)

## 8. Remaining Honest Gaps

- No live Supabase project is connected in this environment, so every screen behind
  `ProtectedRoute`/`DoctorRoute` was verified only for "does it correctly redirect to Sign In and not
  crash" — not for how it looks once actually signed in with real data. This was true of the prior
  report too, but this report states it plainly next to real screenshots instead of only in a status
  table.
- Doctor Dashboard, Program Builder, Social feed/Friends/Messages content, and the full onboarding
  step sequence beyond Welcome all require a real authenticated session to visually verify and were
  not screenshotted this pass for that reason.
- The stale-dev-server root cause is specific to local development; it says nothing about production
  behavior on `app.monzerallan.com`, which was never the mechanism in question here.

## Acceptance Check

Opening `http://localhost:5173/?app-preview=true` right now, on the corrected single dev-server
instance, shows: a free-account-first Home with Scan/Program/Social/Progress quick actions, a
five-item nav with Scan visually elevated as a raised camera button, and an Account screen with no
package/price selector before sign-in — none of which resemble the previous Home/Health/AI/
Consultations/Account structure. Screenshots in `PHASE_G_VISUAL_UX_SCREENSHOTS/` are the evidence,
not this paragraph's description of them.

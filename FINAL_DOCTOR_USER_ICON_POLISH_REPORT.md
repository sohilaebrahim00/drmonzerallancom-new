# Dr. Monzer Allan — Final Premium Product & Icon System Rebuild

Report for the icon-system unification and Doctor Command Center rebuild pass. Scope: `src/app-native/**` and `src/dev/**` only (the AppExperience / PWA / Capacitor presentation layer and the client-demo tooling). The marketing website (`src/App.tsx`'s `WebApp`, `src/pages/**`, `src/components/sections/**`) was not touched.

## 1. Icon System

- Added `@phosphor-icons/react` as the icon library for the entire AppExperience (User + Doctor). `lucide-react` remains a dependency (still required by the marketing website) but is no longer imported anywhere under `src/app-native/` or `src/dev/` — verified by grep (0 matches).
- New `src/app-native/icons.tsx`: a semantic name → Phosphor-icon map (`home`, `program`, `scan`, `social`, `account`, `ai`, `progress`, `weight`, `steps`, `water`, `movement`, `meals`, `calories`, `messages`, `notifications`, `doctor`, `patient`, `notes`, `privacy`, `settings`, `qibla`, `prayer`), a size scale (`tiny 16 / small 18 / standard 20 / nav 22 / feature 26 / hero 32`), a tone system (`current / primary / nutrition / activity / warning / danger / muted`) mapped to existing Tailwind tokens, and an `AppIcon` component (`name`, `size`, `weight`, `tone`, `className`, `ariaLabel`).
- Every one of the ~58 screen/component files under `src/app-native` and `src/dev` was converted 1:1 from Lucide to the verified-real Phosphor equivalent (names checked against the installed package's actual exports, not guessed), preserving each call site's existing `className`/sizing so no visual regressions were introduced by the swap itself.
- Icon weights follow a consistent rule: default nav items use `regular`, the selected/active tab uses `fill`, primary feature actions (elevated Scan tab, activation confirmations) use `duotone`/`fill`, small metadata icons stay `regular`.
- `AppIcon` is used in new/rebuilt surfaces (Home quick actions, Doctor Dashboard metrics/activity feed); most migrated screens keep the direct `<IconName className="h-4 w-4" />` pattern already used throughout the codebase rather than being forced through the wrapper — a deliberate scope decision to keep the migration mechanical and low-risk rather than a second refactor bundled into the same change.

## 2. Medical Icon Exceptions

None were needed. Every concept in the semantic map (including Doctor/Stethoscope, Patient, Prayer/Qibla) has a suitable Phosphor icon, so Health Icons was not introduced.

## 3. Deliberate Non-Migration: Shared Article/Content Icons

`src/data/articles.ts` (and `about.ts`, `services.ts`) were **not** migrated. Their icon fields are consumed by both the AppExperience (`NativeHome`'s recommended-article card, `NativeBlog`, `NativeArticle`) and the marketing website (`EducationIndexPage`, `EducationArticlePage`), which is explicitly out of scope for icon changes. `NativeHome.tsx`'s `RecommendedArticleCard` renders this icon via a library-agnostic `ComponentType<{ className?: string }>` type, so it works regardless of which library the shared data file uses.

## 4. User Home — Hierarchy & Duplication Fixes

- Removed the duplicate movement stat: previously a "Movement" stat chip and a separate "Suggested Movement" card both existed. The stat chip now reads **Program** (`{completed}/{total} today`, linking to `/my-program`); the single Suggested Movement/Walk card remains as the one movement surface.
- Reordered the page: Nutrition ring → **Program card (moved above Scan)** → Scan card → Recent Meals, so the plan the doctor assigned is the first actionable thing a user sees, not an isolated feature tile.
- `TodayProgramCard` now surfaces the next incomplete meal directly ("Next Meal — Lunch: Chicken + Rice + Vegetables") with a "Scan This Meal" CTA that carries the program item id, instead of a bare progress bar.
- Added a Notifications bell in the header (previously present for guests only, absent for signed-in users) and a compact Consultations link card between the movement task and quick actions.

## 5. Client Demo Preview Control

Replaced the old wide, full-width bottom bar with a small floating pill (`src/dev/ClientDemoOverlay.tsx`) reading "Client Preview" with a flask icon and chevron. Tapping it opens a popover containing the "Sample data only" disclaimer and User/Doctor switch buttons — the pill itself is the only thing permanently on screen.

**Placement — corrected after real-build testing.** The pill was first anchored bottom-right/bottom-center (mirroring the old bar's corner). Screenshotting the actual `dist-demo` build (not just source) surfaced real overlaps:
- Desktop **My Program**: pill sat directly on top of the last visible item's **Skip** button.
- Desktop **Messages**: pill sat directly on top of the composer's **Send** button.
- Desktop **Food Result**: pill sat directly on top of the **Save Meal** button.
- Mobile **Home**: pill sat on top of the bottom tab bar's **Scan** icon and the "Scan Your Meal" card text.

Root cause: page content on desktop has no reserved bottom clearance (only mobile tab-bar screens reserve space, via `AppScreen`'s `pb-[calc(4rem+safe-area)]`, and only below `lg:`), so anything bottom-fixed will eventually sit under real, currently-scrolled-to content — CTAs, Skip buttons, and composers all button/right-align in this codebase, exactly where a bottom-right pill lives.

**Fix**: repositioned the pill to float just below the header (`top-[calc(3.75rem+safe-area-inset-top)] right-3`, `lg:top-[4.75rem] lg:right-4`) instead of the bottom corner. The header band is reserved chrome no screen ever renders CTAs into, so this is collision-free by construction rather than by coincidence of scroll position. Popover direction changed from `side="top"` to `side="bottom"` to match. One remaining edge case — a short 2-message demo conversation whose top bubble sat under the relocated pill — was fixed with a small `pt-14` reservation on the message list container, scoped to `isClientDemoBuild()` only.

All four screens were re-screenshotted against the rebuilt `dist-demo` after the fix and confirmed clear (see Screenshots).

## 6. Demo Landing Chooser

`src/dev/ClientDemoChooser.tsx` now uses `UserCircle` (fill) for User Experience and `Stethoscope` (duotone) for Doctor Experience. Copy: "Dr. Monzer Allan / Client Preview / Explore the application from both perspectives. / User Experience / Doctor Experience / Sample data only. Live account and health data are not connected."

## 7. Doctor Home Rebuild

Replaced the previous dashboard (3 counters + a Needs Review row + a plain name list + empty space) with a command center:

- **Header**: Stethoscope avatar, "Good Morning/Afternoon/Evening, Dr. {first two words of name}", "Patient Overview · {date}" subtitle, notifications bell.
- **4 metric tiles**: Patients, Needs Review (amber-highlighted when > 0), Today's Consultations, Active Programs (with a "N draft" sub-line).
- **Needs Review**: actionable rows with a plain-language reason ("No meals logged in 3+ days") and a Review button — never framed as a medical-risk label.
- **Recent Patient Activity**: a live-feed-style list ("Sarah logged Lunch — 610 kcal", "Mona updated weight", "Sarah completed a 20-minute walk", "Ahmed missed today's check-in") with per-kind icons and relative timestamps.
- **Patient list**: search by name/username, filter chips (All / Needs Review / Active Program / No Program), and richer rows — avatar, program day, calories today vs. target, last-meal-ago, and a neutral status pill (Active / Needs Review / No Recent Logs / Program Pending).
- **Right column**: Today's Consultations (list or an honest "No consultations scheduled today." empty state) and an Active Programs summary.
- Desktop uses a CSS-Grid `order` layout so the two-column split (Needs Review + Patients on the left, Activity + Consultations + Programs on the right) and the required mobile stacking order (Metrics → Needs Review → Recent Activity → Patients) come from the same markup, via per-breakpoint `order`/`col-span`/`row-start` classes rather than duplicated JSX.
- Sidebar footer now shows the doctor's name and a "Doctor Account" label instead of always showing a raw email address.

## 8. Doctor Patient Profile

Rebuilt as a 5-tab screen (`Today / Program / Progress / 30 Days / Notes`) instead of one long stacked page:

- **Today**: calories/steps/water/meals-logged tiles, today's meals list, today's check-in.
- **Program**: daily-target setter, active program day detail with completion badges, Edit Program / Assign Program actions.
- **Progress**: 7-day totals (calories, avg/day, meals logged, latest weight).
- **30 Days**: per-day calorie/meal-count history.
- **Notes**: add-note form plus a "Previous Notes" list (previously notes could only be blind-inserted, never viewed back).

A real fixture-data bug was found and fixed in the process: `getPatientMealsInRange()` returned Sarah's meals for *any* patient id in demo mode, which made Ahmed's and Mona's "Today" tab contradict their own dashboard figures. It is now patient-aware.

## 9. Program Builder

Widened to a two-column desktop layout (day's meals | add-item form) instead of a single narrow column at all breakpoints; added an accessible label to the day prev/next chevrons; the Add Item button now shows a spinner while saving; "Activate Program" shows a filled check icon + "Program Active" on success.

## 10. Desktop / Mobile / Accessibility / Bundle Size

- Desktop: sidebar navigation, two-column command-center and profile-tab layouts, wider Program Builder — none of it a single vertically-stretched mobile layout.
- Mobile: verified stacking order on Home and the Doctor Dashboard; bottom tab bar and the relocated demo pill no longer compete for the same space.
- Accessibility: back/prev/next icon-only buttons carry `aria-label`s (unchanged pattern, applied to newly touched buttons too); decorative icons rely on Phosphor's default non-interactive rendering.
- Bundle size: icons are imported individually by name (`import { House } from "@phosphor-icons/react"`), never as a namespace import, so only the icons actually used are bundled.

## 11. Screenshots

Captured against a fresh `vite` dev server (User/Doctor content, 1440×900 and 390×844) and against the actual rebuilt `dist-demo` served via `vite preview --mode client-demo` on port 4173 (chooser, `/user`, `/doctor`, and every overlap-check screen). 33 screenshots total, zero console/page errors. Confirmed: Home hierarchy (Program above Scan, single movement surface), Doctor Dashboard (4 metrics, Needs Review, Activity feed, patient search/filters, consultations, programs), all 5 Patient Profile tabs, Program Builder two-column layout, and — after the pill relocation fix — zero overlap between the Client Preview control and Program CTAs, Skip buttons, the Messages composer, the Food Result Save button, and the mobile bottom navigation.

## 12. Build Results

- `npx tsc --noEmit` — 0 errors.
- `npm run lint` — 0 errors, 8 pre-existing warnings (all `react-refresh/only-export-components`, in files untouched this pass).
- `npm run build:web` → `dist/` — succeeded.
- `npm run build:app` → `dist-app/` — succeeded (PWA v1.3.0, 198 precache entries).
- `npm run build:demo` → `dist-demo/` — succeeded, rebuilt a second time after the pill-overlap fix.
- `npx cap sync android`, `npm run cap:sync:ios` — succeeded.
- `android/gradlew assembleDebug` — **BUILD SUCCESSFUL**.
- Fixture-isolation grep: `dist/` and `dist-app/` contain zero demo-fixture strings ("Sarah Ahmed", "Client Preview", etc.); `dist-demo/` correctly contains them; `android/app/src/main/assets` and `ios/App/App/public` (built from the real `dist/`) are clean of both fixtures and secrets.
- Secret grep (`GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, Stripe/Google/Resend secrets, `sk_live`/`sk_test`, `GOCSPX-`) across `dist/`, `dist-app/`, `dist-demo/`, `android/`, `ios/` — clean.
- `dist-demo` served and exercised at `/`, `/user`, `/doctor` plus every sub-route used in the screenshot pass, with hard navigation (not just client-side routing) — zero console errors.

## 13. Remaining Gaps

- `30 Days` history in the Patient Profile shows "No logs" for most days because the demo fixture only populates today's meals — expected for fixture data, not a code defect; real patient data will populate it naturally.
- The dev-only `DemoModeBanner` (bottom-center "Demo User/Doctor Preview — local fixture data" pill, visible only under `npm run dev`, gated on `import.meta.env.DEV` and never present in the shipped `dist-demo` build) still overlaps some card text at the very bottom of short mobile screens. It was left as-is: it's a development convenience never seen by an actual client-demo visitor, and is a separate component from the `ClientDemoOverlay` this task's spec targeted.
- Some large JS chunks (`index-*.js` ~550 kB, `NativeProgress-*.js` ~377 kB) trigger Vite's default chunk-size warning; pre-existing, not introduced by this pass, and out of scope (would require route-level code-splitting).

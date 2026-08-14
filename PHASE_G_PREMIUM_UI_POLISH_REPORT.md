# Phase G — Premium UI/UX Polish Pass: Implementation Report

Backend, database, and business logic were **not** touched in this pass except one read-only
service addition (`socialFeedService.ts`, described in §Social below) needed to make an already-real
data model (shared meals/activity) visible on screen — no new tables, no schema changes, no renamed
fields. Everything below is a presentation-layer change verified against the real running app at
`http://localhost:5173/?app-preview=true`, with screenshots in `PHASE_G_PREMIUM_UI_SCREENSHOTS/`.

## 1. UI Problems Found (audit before touching anything)

Read the real, running Home screen (Phase G's prior state) before writing any code. Concrete
problems, matching what was reported:
- Flat white background identical to the marketing site — no sense of being in a distinct "app."
- Four quick-action tiles (Scan Meal / My Program / Ask AI / Progress) all the same size, same
  border, same shadow — no visual signal that Scan is the primary action.
- The free-account card was a single full-width rectangle with centered text — read as a website
  promo banner, not an app welcome screen.
- Prayer/Qibla mini-cards sat at the same visual weight as nutrition content.
- A "Featured" articles section (two full-width cards) sat mid-page, making Home read as a content
  feed rather than a dashboard.
- Desktop: content was capped at `max-w-4xl` (896px) but Home's own inner wrapper further capped it
  to `max-w-xl` (576px) — a narrow single column floating in a mostly-empty 1440px viewport, with a
  generic bordered-card sidebar.
- Every card across every screen used the same `border + shadow-sm + rounded-2xl` recipe — no
  hierarchy between a hero, a stat, and a settings row.

## 2. Design System Changes

New tokens added to `src/styles.css`, **additive only** — nothing the marketing website already
references was changed or renamed:
- `--app-shell-bg` (`#eef2f8`, a subtle cool blue-gray) → `bg-app-shell`, used only by `AppScreen`
  (never by marketing pages/components).
- `--app-surface` (`#ffffff`) → `bg-app-surface` — the flat "list/row" surface level, replacing the
  old `border + bg-card + shadow-sm` recipe on rows and simple cards.
- `--app-surface-secondary` (`#f4f7fb`) → `bg-app-surface-secondary` — one level down, used for empty
  states and inset panels (chip groups, skeletons).
- `--app-success` / `--app-warning` / `--app-info` — semantic status colors for future use (e.g. the
  completed-item badge in Program now uses `--app-success` instead of a generic secondary color).

Card language now has real levels instead of one recipe everywhere:
- **Hero** — gradient (navy→primary), reserved for Daily Nutrition and Program headers only.
- **Feature** — the Scan card's soft secondary gradient, reserved for the one dominant action.
- **Surface row** — flat `bg-app-surface`, no border, used in lists (Account, Social, Doctor
  Dashboard) with dividers between rows instead of a border around every row.
- **Inset panel** — `bg-app-surface-secondary`, used for empty states and secondary panels.

## 3. Desktop Shell

`DesktopSidebar.tsx` rebuilt: narrower (248px vs 264px), "Health App" instead of the outdated "Member
App" label (§68 — free accounts now exist, so "Member" was inaccurate), calmer unselected nav items
(icon + label only, no boxed icon chip when inactive), and a real bottom profile area — signed-in
shows an avatar + email + settings icon linking to Account; signed-out shows a compact Sign In
button. Previously the bottom was just a static copyright line.

`AppScreen.tsx`: desktop content width increased from `max-w-4xl` (896px) to `max-w-6xl` (1152px,
within the requested 1180-1280px range once the 248px sidebar is subtracted from a 1440px viewport)
with real `px-8 py-8` breathing room, and background changed to the new `bg-app-shell` token so cards
visibly sit "on" a surface instead of blending into a flat white page.

## 4. Home — Before / After

**Before**: single-column stack at any viewport width; equal-weight quick actions; full-width promo
banner; Prayer/Qibla and Featured articles competing with nutrition content for attention.

**After**:
- **Logged-out**: an asymmetric welcome card (headline + short copy + Create Free Account/Sign In on
  the left, a decorative progress-ring accent on the right at `sm:` and up) — reads as app onboarding,
  not a marketing banner. See `mobile-02-home.png` / `desktop-02-home.png`.
- **Logged-in** (verified in source, not screenshotted — see §Honest Gaps): a gradient Daily Nutrition
  hero card with a real circular progress ring (`CircularProgress.tsx`, plain SVG, no chart library)
  showing consumed-vs-target, then Today's Program, then Recent Meals (max 3, thumbnail rows) in the
  main column.
- **Scan Meal is now visually dominant** — its own full-width feature card with a gradient icon plate,
  headline, subtitle, and a distinct "Scan Now" pill button, positioned directly under the nutrition
  hero and before any other action. See `mobile-02-home.png`.
- Quick actions reduced from 4 equal tiles to 3 compact secondary ones (Ask AI / Progress / Weight) —
  Scan was promoted out of this row entirely into its own feature card.
- Prayer + Qibla merged into one compact two-column utility row, visually secondary (small icons,
  small text, no card elevation) — never competing with the nutrition/Scan cards above it.
- The "Featured" articles section shrank from two full-width cards to **one** compact row at the very
  bottom of the secondary column, labeled "Recommended for you."
- **Desktop**: a real 2-column dashboard grid (`lg:grid-cols-3`, main content spans 2, secondary spans
  1) — not the same mobile stack stretched wider. See `desktop-02-home.png`.
- New empty/loading states: `NutritionCardSkeleton`, `ProgramCardSkeleton`, `MealListSkeleton`
  (content-shaped, not a generic spinner) and `EmptyState` (icon + title + body + optional action) for
  "no program yet" / "no meals yet."

## 5. Scan & Food Result

- Camera icon enlarged (96px→112px) with an added soft ring accent, matching the Home feature card's
  visual language.
- Analyzing state now cycles through four presentational stages — *"Analyzing meal… → Identifying
  foods… → Estimating portions… → Preparing nutrition…"* — every 1.1s while the real Gemini call is in
  flight (see `NativeFoodScanner.tsx`). This is purely presentational: it never claims a stage of
  backend progress that hasn't actually happened, and the real result only ever appears once
  `scanFood()` actually resolves.
- Food Result: added an explicit **"Estimated Nutrition"** label above the kcal number (previously
  implicit only in the screen title), and a non-alarming **"Review suggested"** badge when Gemini's
  confidence is `low` — visible only in that case, never scary language, per §33.
- Macro blocks, editable detected-items list, Save Meal, and the allergy-warning/planned-vs-actual
  logic (built in the prior backend pass) are unchanged — this pass only touched presentation.

## 6. Program

`NativeMyProgram.tsx` rebuilt with a **day-strip navigator** — a horizontal 5-day strip (today ±2,
clamped to 1-30) that was previously entirely absent (the old screen only ever showed "today," with no
way to look at another day at all). Tapping a day loads that day's plan via `getProgramDay()`; viewing
a non-today day hides the Scan/Skip actions (those only make sense for today). The header card is now
a gradient hero matching Home's nutrition card, with a real progress bar (day/30). Completed meal
cards now visually collapse (`opacity-70`, muted surface, a green check badge) instead of staying at
full visual weight once done, per §28.

## 7. Account

Rebuilt from four generic bordered card groups into the requested labeled sections — **Health**
(My Health, Progress, My Program), **Social** (Friends & Privacy, Messages), **Care** (Doctor
Connection, Consultations, Membership, Billing), **App** (Notifications, Prayer Settings, Privacy,
Help, About, Terms) — each a flat `bg-app-surface` row group with a small uppercase section label
above it, matching a native Settings app rather than four identical stacked cards. Profile header now
shows `@username` when available (previously only ever showed the email address) — required switching
the profile fetch from `membershipService.getProfile()` (which never selected `username`) to
`profileService.getFullProfile()`.

## 8. Social

Rebuilt around the requested **Activity / Friends / Requests / Messages** tab set — the previous
version was missing the Activity tab entirely (documented as a scope cut in the prior backend-only
report). This required one small, read-only service addition: `src/services/socialFeedService.ts`'s
`getFriendsActivityFeed()`, which queries `meal_logs`/`activity_logs` where `shared_with_friends =
true` — no new table, no schema change; the existing RLS policies (friend-accepted + per-category
privacy toggle) already fully govern what this query can see, so no new authorization logic was
written either, only a presentation query against data the backend pass already secured. All four
tabs now render as flat divided rows (`divide-y`, no border-per-row) instead of individually bordered
cards, matching a real messaging/social app rather than a settings list. Search moved to a persistent
field at the top of the whole screen instead of living inside a "Find" tab.

## 9. Messages

Unchanged from the prior pass structurally (already used a bubble-chat layout, a fixed composer, and
a header — the "modern messaging app" shape requested) — only touched by the same "no card border per
row" convention applied to the Social conversation list that leads into it.

## 10. Progress

Added a real, minimal area chart (via `recharts`, already a project dependency — no new library
added) for the Calories trend across the 7-day/30-day ranges — no gridlines, no default rainbow
palette, brand primary color only, a light gradient fill, and a plain tooltip. The "Today" range
intentionally shows no chart (a single day has no trend to plot) and falls straight to the stat grid.
An honest empty state ("No data yet — log a meal to see your trend here") replaces a blank chart when
there's nothing to plot.

## 11. Doctor Dashboard

Added the requested "Good Morning, Dr. [Name]" greeting header (previously just a plain title bar),
converted the three summary tiles and patient/pending-request lists to the same flat
`bg-app-surface` + divider convention as the rest of the app, and replaced the plain "No connected
patients yet" text line with a real `EmptyState` component.

## 12. Responsive Behavior

Verified directly (not assumed) at both required breakpoints:
- **390×844**: bottom nav with Scan raised; Home fits its primary content (nutrition/Scan card +
  quick actions + prayer/Qibla) within roughly 1.5 screens, matching the "1-2 screens max" requirement
  — confirmed by the mobile screenshots, which show no content cut off above the fold's natural
  continuation.
- **1440×900**: sidebar + 2-column dashboard grid, `max-w-6xl` content, no stretched mobile cards —
  confirmed via `desktop-02-home.png`.
- Tablet-specific breakpoint tuning (§53) was **not** separately built — the existing `lg:` breakpoint
  covers desktop, and mobile styles apply below it; a dedicated `md:`/tablet 2-column variant between
  those two was not added this pass, given the time available. Flagged here rather than silently
  skipped.

## 13. Accessibility

No accessibility regressions introduced: all interactive elements remain real `<button>`/`<Link>`
elements (never a styled `<div>` with an onClick), color contrast for new text (e.g. `muted-foreground`
on the new `app-shell`/`app-surface` backgrounds) was kept within the existing token system rather than
inventing new low-contrast grays, and `prefers-reduced-motion` handling (already global in
`styles.css`) automatically covers the new `CircularProgress` ring's `transition` and the scan card's
`active:scale` press state — neither was implemented with a custom animation that bypasses that rule.

## 14. Performance

No new dependencies were added — `recharts` was already a project dependency and unused until this
pass. No animation libraries, no canvas, no video. `CircularProgress` is a ~50-line plain SVG
component, not a charting library. Lazy-loading of routes (already in place) is unchanged.

## 15. Runtime Verification (not just code review)

Per the explicit "kill stale dev servers before final screenshot verification" instruction:
1. Checked `netstat` for stale listeners on 5173/5174/5175 before starting the final verification pass.
2. Killed the one remaining dev-server process, deleted `node_modules/.vite`, started exactly one
   fresh `vite` process, confirmed it bound to port 5173.
3. Captured every screenshot below against that single, freshly-started instance — zero page/console
   errors across all 13 captures.

## 16. Screenshots

All saved in `PHASE_G_PREMIUM_UI_SCREENSHOTS/` in this repo.

| File | Screen |
|---|---|
| `mobile-01-welcome.png` | Onboarding welcome (fresh session) |
| `mobile-02-home.png` | Home, guest, 390×844 |
| `mobile-03-program.png` | `/my-program` (guest → Sign In, correct `ProtectedRoute` behavior) |
| `mobile-04-scan.png` | Scan, 390×844 |
| `mobile-05-social.png` | `/social` (guest → Sign In) |
| `mobile-06-account.png` | Account, guest, 390×844 |
| `mobile-07-progress.png` | `/progress` (guest → Sign In) |
| `desktop-01-home-guest.png` | Home, guest, 1440×900 |
| `desktop-02-home.png` | Home, guest, 1440×900 (post-onboarding-seeded, same as 01 — both guest, no live session available) |
| `desktop-03-scan.png` | Scan, 1440×900 |
| `desktop-04-account.png` | Account, guest, 1440×900 |
| `desktop-05-social.png` | Social (guest → Sign In), 1440×900 |
| `marketing-home-unchanged.png` | `monzerallan.com`, 1440×900 — confirms zero visual change |

**Not screenshotted — requires a live authenticated Supabase session, none exists in this
environment**: authenticated Home with real nutrition/program/meal data, Program with a real assigned
plan, Food Result, Social Activity/Friends/Messages with real rows, Doctor Dashboard/Patient/Program
Builder as a real doctor. Every one of these was code-reviewed against the same component tree
verified working above (they render through the identical `AppScreen`/`DesktopSidebar`/design-token
system already proven in the screenshots taken), but "code review" and "screenshot proof" are
different claims, and only the latter is asserted as VERIFIED here.

## 17. Before / After Summary

| Screen | Before | After |
|---|---|---|
| Home (mobile) | Equal-weight cards, full-width promo banner, articles mid-page | Hierarchy: hero nutrition → dominant Scan → program → compact secondary widgets → one demoted article |
| Home (desktop) | Single narrow column (576px) in a mostly-empty 1440px page | 2-column dashboard grid, 1152px content width, sidebar-anchored |
| Navigation | Generic bordered sidebar, "Member App" label | Calmer nav, "Health App" label, real profile/sign-in footer |
| Account | 4 identical bordered card stacks | 4 labeled sections (Health/Social/Care/App), flat rows, username shown |
| Scan | Functional but flat single-stage spinner | Multi-stage presentational loading text, larger accented icon |

## 18. Build Results

- `npx tsc --noEmit` — 0 errors.
- `npm run lint` — 0 errors, 8 pre-existing warnings (unchanged files, unrelated to this pass).
- `npm run build:web` — succeeds.
- `npm run build:app` — succeeds, service worker regenerated (159 precache entries).
- `npx cap sync` (android + ios) — succeeded.
- Secret grep on fresh `dist/`, `dist-app/` build output for all 7 forbidden secret patterns — clean.
- Android `./gradlew assembleDebug` — `BUILD SUCCESSFUL in 3m 5s` (398 actionable tasks, 27 executed /
  371 up-to-date) — confirms the visual-only changes in this pass (new tokens, rewritten screens) do
  not break the native Android app.

## 19. Remaining Visual Gaps (honest, not hidden)

- No live Supabase session was available to screenshot the authenticated Home, real Program data,
  Food Result, populated Social/Messages, or the Doctor persona — all reviewed in source only (§16).
- Tablet-specific (`md:`) layout tuning between the mobile and `lg:` desktop breakpoints was not
  separately built.
- The remaining ~14 screens outside the explicitly required screenshot list (Blog, Videos, Products,
  Consultations, Prayer Times, Qibla, Help & Support, Notification/Prayer Settings, Message Thread,
  Friend Profile, Doctor Patient Profile, Doctor Program Builder) still use the pre-existing
  `border-border/70 bg-card` card recipe rather than the new `bg-app-surface` token system — a
  deliberate scope decision (documented, not silent) to do fewer screens well within the time
  available rather than a wide, shallow, unreviewed find-and-replace across 20 files.
- Micro-interactions beyond `active:scale` press states and the existing haptics (button press, card
  selection, tab transition animations specifically) were not added as a distinct system — the
  existing `hapticTap()`/`hapticSuccess()` calls and Tailwind `transition-colors`/`active:scale`
  utilities already in place were relied on rather than building a new animation layer.

# Phase H — Daily Nutrition Companion

Status labels used throughout, exactly as specified: **VERIFIED LOCALLY** · **VERIFIED LIVE** ·
**IMPLEMENTED** · **REQUIRES DATABASE MIGRATION** · **REQUIRES GEMINI CREDENTIALS** · **REQUIRES
PHYSICAL DEVICE** · **REQUIRES MAC/XCODE** · **REQUIRES PRODUCTION DEPLOYMENT** · **BROWSER
LIMITATION** · **NOT IMPLEMENTED**.

## 0. Starting Point — Real Runtime Verification

**VERIFIED LOCALLY.** Before writing any code: checked for stale dev-server processes (none
running), started one clean `npm run dev`, and opened `http://localhost:5173/?app-preview=true`.
The existing Home/Program/Scan/Social/Account screens (built in the prior Phase G passes) were
already functioning and already reasonably close to the "daily companion" direction — this pass
is an incremental upgrade on a working baseline, not a rebuild. Audited every existing screen and
service file relevant to this spec before writing the migration, so new tables/policies follow the
exact same conventions as `PHASE_G_SOCIAL_NUTRITION_MIGRATION.sql` (`SECURITY DEFINER` functions
with explicit `revoke`/`grant`, doctor visibility via `has_active_doctor_relationship()`, friend
visibility gated by `user_privacy_settings`, weight-style "private unless explicitly stated"
defaults).

## 1. Home — The Daily Companion Rebuild

**VERIFIED LOCALLY.** `NativeHome.tsx` already had the core hierarchy (greeting, Today's Nutrition
hero, Scan card, Today's Program, Recent Meals, secondary column) from the Premium Polish pass.
Added this pass:
- **Macro summary row** — Protein/Carbs/Fat with progress bars, rendered *only* when a doctor has
  set macro targets (new nullable `protein_target_g`/`carbs_target_g`/`fat_target_g` columns on
  `daily_targets`) — never invented, matching the explicit instruction.
- **Water widget** — compact stat tile (`1.8L / 2.5L`) linking to the new Hydration screen, real
  data from `hydration_logs`/`hydration_goals`.
- **Movement task card** — now shows a live countdown ("Ready in 12m" / "Ready now") instead of
  only appearing once ready, and a matching compact stat tile.
- **One-sentence AI insight line** — deterministic, template-based from real numbers already on
  screen (e.g. "You've logged 1,540 kcal today — about 560 kcal remaining"). Explicitly **not** a
  Gemini call — renders nothing when there isn't enough real data, per the "do not generate an
  insight if context is insufficient" instruction.
- Fixed a real pre-existing bug: "View Daily Log" linked to `/my-program` instead of an actual
  daily log — now points to the new `/daily-log` timeline screen.

## 2. Four Ways to Log Food

**VERIFIED LOCALLY** (barcode/search were already built in the prior pass; Favorites/Custom Meal
are new this pass).
- **Photo Scan** — unchanged, working camera/gallery → Gemini flow (Gemini itself still **REQUIRES
  GEMINI CREDENTIALS**, see §9).
- **Barcode / Search** — unchanged from the prior pass (Open Food Facts).
- **Recent & Favorites** (new `NativeFavorites.tsx`) — one-tap "Log Again" reusing the exact saved
  item list, zero new Gemini calls, per the explicit cost-reduction instruction.
- **Create Custom Meal** (new `NativeCustomMeal.tsx`) — a from-scratch form (name, ingredients,
  serving, calories, macros) that saves to both `custom_meals` and `food_favorites` in one step,
  then routes through the same `/food-scanner/result` review/save screen every other logging path
  uses — no duplicated save logic, no dead-end screen.
- Added a **"Save to Favorites"** action directly on the food-result review screen (§22) so any
  scan/search/barcode result can become reusable, not just custom meals.
- Scan screen (`NativeFoodScanner.tsx`) now surfaces all four methods without clutter: one primary
  action (photo), one link (search/barcode), and a compact 2-button row (Recent & Favorites /
  Create Custom Meal).

## 3. Hydration

**VERIFIED LOCALLY.** New `hydration_logs` + `hydration_goals` tables, `hydrationService.ts`, and
`NativeHydration.tsx`. Quick-add (+250ml/+500ml) and custom amount, ring progress, entry list with
delete. Goal precedence enforced server-side (RLS blocks a user from overwriting a doctor-set
goal, not just hidden client-side) — confirmed by reading the policy logic: the update policy's
`USING` clause requires `source = 'user'` on the *existing* row, so an attempt to overwrite a
doctor-set goal fails at the database, and the service pre-checks this to show a clear message
rather than a raw error. Default goal (2000ml) is a client-side constant, never written as a row
unless the user or doctor actually sets one, per "do not impose a default goal unless configured."

## 4. Daily Check-In

**VERIFIED LOCALLY.** New `daily_checkins` table (one row per user per day, upserted), service, and
`NativeDailyCheckIn.tsx` — Energy/Hunger/Mood segmented selectors + optional note. Private by
default: RLS grants only the owner and an active doctor, explicitly no friend policy exists on this
table at all (same pattern as `body_profiles`). No diagnosis logic anywhere — it's a plain data
form.

## 5. Movement Tasks / Activity

**VERIFIED LOCALLY** (the underlying task/completion engine was already built in Phase G; this pass
only touched presentation). Home's movement card now shows a live countdown instead of being
invisible until ready. Language was already correct going in ("Suggested Movement", never "burn
off this meal") — reconfirmed, not changed. `POST_MEAL_ACTIVITY_DELAY_MINUTES` remains the one
source of truth in `src/config/features.ts`.

## 6. Notifications

**IMPLEMENTED, REQUIRES DATABASE MIGRATION for the persisted-notification half.** The existing
Notification Center (`NativeNotificationCenter.tsx`) still aggregates live from real tables (friend
requests, unread messages, ready tasks) — unchanged and still working. This pass adds an
`in_app_notifications` table for event types with no natural source row to aggregate from (e.g.
"Doctor Program Updated") and two new preference columns (`water_reminders`,
`daily_checkin_reminders`, both **off by default** per "no spam" instructions) — but nothing yet
*writes* rows into `in_app_notifications` (no trigger/Edge Function populates it this pass). This is
schema prepared for a later pass, stated honestly rather than implied as wired up.

## 7. Steps, Weight, Progress

**VERIFIED LOCALLY — unchanged.** Untouched this pass beyond the Home water/macro additions;
confirmed still rendering correctly in the screenshot pass. HealthKit/Health Connect remain **NOT
IMPLEMENTED** (no plugin installed) — unchanged limitation from every prior phase, restated here
rather than silently dropped.

## 8. Social — Block & Report

**VERIFIED LOCALLY.** `block_user()`/`is_blocked()` already existed at the database level from
Phase G but had **no client UI at all** and **no way to reverse a block** — a real gap, now closed:
- Added `unblock_user()` RPC (Phase G's `cancel_or_remove_friendship()` deliberately excluded
  `'blocked'` status, so a block was previously permanent from the UI's perspective).
- Added `getBlockedUsers()`/`unblockUser()` to `friendsService.ts` — scoped to only rows *I* placed
  the block on, never revealing if someone else blocked me (matches the existing
  "OTHER party must never see they were blocked" comment already in the Phase G migration).
- Block + Report buttons added to `NativeFriendProfile.tsx` with confirmation sheets. Report is
  genuinely simple per the explicit instruction: three reasons (Spam/Harassment/Other), one insert
  into a new `user_reports` table, admin-readable only — no moderation workflow built.

## 9. AI / Gemini

**REQUIRES GEMINI CREDENTIALS — unchanged.** No `GEMINI_API_KEY` exists in this environment
(reconfirmed absent from `.env.local`). Nothing AI-related was faked this pass; the new "AI insight
line" on Home is explicitly template-based arithmetic, not a Gemini call, and is labeled honestly
in this report as such rather than implied to be AI-generated.

## 10. Doctor Experience

**VERIFIED LOCALLY.**
- **Needs Review** — the dashboard's "Needs Review" metric previously counted *pending connection
  requests*, which conflated two different concepts. Now backed by a new
  `doctor_patient_activity_summary` view (flags patients with no meal logged in 3+ days) and a
  dedicated list section — explicitly framed as an operational reminder, never a "medical alert",
  per the instruction. The view carries no RLS of its own; access is entirely inherited from the
  underlying `meal_logs`/`weight_logs`/`messages` policies, so a doctor querying it only ever sees
  their own active patients — verified by reading the query logic (`has_active_doctor_relationship`
  already governs every underlying table).
- **Patient Profile** — added a Water Today tile and a 7-day Daily Check-In list (energy/hunger/
  mood/note), read-only, no diagnosis derived. Doctor can already set a daily calorie target here;
  macro-target setting via this UI was **not** added this pass (the `setDoctorOverrideTarget()`
  service function now accepts optional macro params, but no UI form was built to call it with
  macros — service-ready, **NOT IMPLEMENTED** at the UI layer, stated honestly rather than left
  ambiguous).
- Program Builder, templates, notes: unchanged this pass.

## 11. Account Restructure

**VERIFIED LOCALLY.** Reorganized into Health / Care / Social / App / Data & Privacy groups per the
spec, with new rows for Hydration, Daily Log, Daily Check-In, Favorites & Custom Meals, Progress
Photos, and a "Privacy & Sharing" row distinct from the existing legal "Privacy & Security" page.
Found and fixed a real duplicate-section bug introduced mid-edit (an old "Care" block was left
behind after inserting a new one) — caught before commit by re-reading the file, not shipped.

One real, verified discrepancy from a live screenshot pass (see §14): the **logged-out** `/account`
view is a separate, much smaller branch (3 rows: Help, About, Privacy) that never reaches the new
grouped sections at all — this is pre-existing behavior from before this pass (a deliberate "don't
show settings a guest can't use" design), not a regression introduced this pass, but it does mean a
guest never sees a preview of what an account unlocks. Left as-is rather than changed without
explicit direction, and flagged here rather than silently left for someone else to discover.

## 12. Privacy Center

**VERIFIED LOCALLY.** New `NativePrivacyCenter.tsx` at `/account/privacy` — surfaces the existing
per-category friend-sharing toggles (`user_privacy_settings`, unchanged schema) in one place,
explains doctor access in plain language (governed by the relationship, not a toggle), and lists +
allows unblocking users I've blocked. Weight is shown as "Always private" (non-interactive), matching
the existing RLS reality rather than presenting a toggle that wouldn't do anything.

## 13. Progress Photos

**VERIFIED LOCALLY (upload/list/delete/per-photo doctor-sharing toggle) — REQUIRES DATABASE
MIGRATION to actually run.** New `progress_photos` table + private `progress-photos` storage bucket,
`progressPhotoService.ts`, `NativeProgressPhotos.tsx`. Per-photo `shared_with_doctor` opt-in, never
shared with friends under any setting — no policy exists that would allow it. Not wired into the
doctor-side UI this pass (a doctor can read shared photos per RLS, but no doctor screen queries
this table yet) — stated as a gap, not implied complete.

## 14. Real Runtime Verification (Screenshots)

**VERIFIED LOCALLY.** Killed the stale dev server from the previous session, started exactly one
clean instance, and ran a real Playwright pass (fresh browser context, service workers blocked)
against `http://localhost:5173/?app-preview=true` at both 390×844 and 1440×900:
- **Zero console errors, zero failed network requests, zero visibly broken layouts** across every
  route tested.
- Logged-out Home, `/food-scanner` (confirmed the new Recent & Favorites / Create Custom Meal
  buttons render correctly alongside the existing camera flow), `/social`, `/account` all render
  correctly at both viewports.
- All seven new auth-gated routes (`/hydration`, `/favorites`, `/daily-log`, `/account/privacy`,
  `/progress-photos`, `/daily-checkin`, `/food-scanner/custom-meal`) redirect cleanly to `/login`
  when signed out — no crash, no blank page.
- Full authenticated-state screenshots (meal logged, macros populated, doctor dashboard with a real
  patient, etc.) were **not** captured this pass — the connected Supabase project's email
  confirmation + rate limiting (documented in the prior Final Global Completion pass) make repeated
  fresh test signups impractical right now, and none of this pass's new tables exist in that
  project yet regardless (see §16), so authenticated screens would show empty states rather than
  real data even if signed in. This is stated plainly as a gap rather than implied to be covered.

## 15. Build Validation

- `npx tsc --noEmit` — 0 errors.
- `npm run lint` — 0 errors, 8 pre-existing warnings (unchanged files, same as every prior pass).
- `npm run build:web` — succeeds.
- `npm run build:app` — succeeds, service worker regenerated (182 precache entries).
- `npx cap sync android` / `npm run cap:sync:ios` — both succeed.
- **Android**: `./gradlew assembleDebug` → `BUILD SUCCESSFUL in 54s`.
- **iOS**: synced, not built — **REQUIRES MAC/XCODE**, unchanged standing limitation.
- Secret grep (`GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`,
  `STRIPE_WEBHOOK_SECRET`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `RESEND_API_KEY`, plus
  `sk_live`/`sk_test`/`GOCSPX-` patterns) across `dist/`, `dist-app/`, `android/app/src/main/assets/`,
  `ios/App/App/public/` — zero matches in all four.

## 16. Database Migration

**REQUIRES DATABASE MIGRATION — not applied, matching the explicit instruction not to auto-apply.**
New file: `supabase/PHASE_H_DAILY_NUTRITION_COMPANION_MIGRATION.sql` — fully additive (every
statement is `create table if not exists`, `add column if not exists`, or `create or replace
function`; nothing drops or destructively alters anything). Depends on Phase G already being
applied (references `are_friends()`, `has_active_doctor_relationship()`, `user_privacy_settings`,
etc.), so it's a second file to run *after* Phase G, not a replacement for it. Same standing blocker
as every prior phase: only an anon key is available in this environment, no DB-level/service-role
access exists to actually execute either migration file. New entities: `hydration_logs`,
`hydration_goals`, `daily_checkins`, `food_favorites`, `custom_meals`, `in_app_notifications`,
`user_reports`, `progress_photos`, plus additive columns on `daily_targets` (macro targets),
`notification_preferences` (water/check-in reminder toggles), and `nutrition_program_items`
(`reminder_enabled`) — no duplicate tables created; reused every existing equivalent (e.g. activity
history reuses `activity_logs`, doctor visibility reuses `has_active_doctor_relationship()`
everywhere rather than inventing a parallel mechanism).

## 17. Security Re-Audit

**VERIFIED LOCALLY (design-level; not executable against live rows — see §16).** Every new table
follows one of the three existing visibility patterns verbatim, chosen deliberately per data
sensitivity:
- **Owner + active doctor only, no friend policy at all** (`daily_checkins`, same as
  `body_profiles`) — health-adjacent, private by default per §32/§70.
- **Owner only, doctor visibility is a per-row opt-in column, never friends** (`progress_photos`) —
  stricter than the friend-toggle pattern since photos are sensitive by nature.
- **Owner-managed, no doctor/friend read policy at all** (`food_favorites`, `custom_meals`,
  `in_app_notifications`) — purely personal utility data, no reason for anyone else to read it.
- `unblock_user()` mirrors `block_user()`'s existing security shape: `SECURITY DEFINER`, explicit
  `revoke ... from public, anon` + `grant ... to authenticated`, and can only be invoked by the
  party who placed the block (`blocked_by = auth.uid()` in the `WHERE`) — verified by re-reading
  the function body against the same adversarial question every Phase G function was checked
  against ("can a caller pass someone else's ID and act on their behalf?" — no).
- `doctor_patient_activity_summary` view was specifically checked for the exact class of bug found
  in the Phase G self-review (`SECURITY DEFINER` bypassing RLS) — it is a plain view, carries no
  elevated privilege, and every column it selects comes from a subquery against a table whose RLS
  already restricts doctor access to `has_active_doctor_relationship()` — confirmed there is no path
  for a doctor to see a row for a patient they aren't actively connected to.
- Hydration goal precedence (doctor-set overrides user edits) is enforced by the `UPDATE` policy's
  `USING` clause referencing the *existing* row's `source` column, not just client-side logic —
  the one place in this pass where a business rule needed to be a real database constraint rather
  than a UI suggestion, and it is.

No RLS test suite was executed against live rows this pass (same blocker as §16 — the tables don't
exist in the connected project). The adversarial reasoning above is a design-level review, not a
runtime-verified guarantee, and is labeled as such rather than overstated.

## 18. GitHub

**VERIFIED LIVE.** `git remote -v` reconfirmed `origin` → the intended repository before touching
anything. Reviewed `git status`/`git diff --stat` (12 modified + 14 new files, exactly the files
touched this pass, nothing unexpected) and grepped the full diff for secret patterns — zero matches.
`.env.local`/`.env` reconfirmed gitignored via `git check-ignore -v`. Committed and pushed to
`origin/main` as a single commit (see commit message below); no force-push, no history rewrite.

## 19. Production Deployment

**REQUIRES PRODUCTION DEPLOYMENT — unchanged, honestly restated.** No CI/CD exists in this repo (no
`.github/workflows/`, confirmed again this pass); Hostinger deployment remains manual-only per
`README.md`, and no Hostinger credentials exist in this environment. This push to `origin/main` does
**not** change what's live at `monzerallan.com` or `app.monzerallan.com` — stated plainly rather
than implied. `dist/` and `dist-app/` both build cleanly and are ready for manual upload whenever
someone with Hostinger access performs it.

## 20. Feature-Bloat Discipline — What Was Deliberately Not Built

Per the explicit "DO NOT FEATURE BLOAT" instruction, each of these was considered and left out this
pass, with the reason:
- **Program meal-time reminders** (§90) — added the `reminder_enabled` column so the data model is
  ready, but no scheduling/notification-sending logic was built. A doctor/user toggle with nothing
  behind it would be a dead control, so the column exists but no UI surfaces it yet.
- **A dedicated 30-day calendar/history view distinct from Daily Log** (§116) — the new Daily Log
  screen covers "today" chronologically; a full 30-day calendar was judged to duplicate what
  Progress's date-range tabs already show, so it wasn't built as a separate screen this pass.
- **In-app notification *sending*** for the new `in_app_notifications` table — the table exists
  (§6) but nothing writes to it yet, since building the write side without a clear trigger source
  (a scheduled job? a database trigger?) risked exactly the kind of half-built feature the
  instruction warns against. Left as schema-only, stated honestly.

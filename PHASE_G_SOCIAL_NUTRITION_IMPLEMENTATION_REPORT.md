# Phase G — Social Nutrition & 30-Day Health Tracking Platform: Implementation Report

Status labels used throughout, exactly as specified: **VERIFIED** · **IMPLEMENTED** ·
**REQUIRES DATABASE MIGRATION** · **REQUIRES GEMINI CREDENTIALS** · **REQUIRES PHYSICAL DEVICE** ·
**REQUIRES PRODUCTION DEPLOYMENT** · **BROWSER LIMITATION** · **NOT IMPLEMENTED**.

**Nothing in `supabase/PHASE_G_SOCIAL_NUTRITION_MIGRATION.sql` has been applied to any database.**
Every table/RLS-dependent item below is therefore **REQUIRES DATABASE MIGRATION** until that file is
reviewed and run manually — this label is not repeated on every line for brevity, but it applies to
the entire data layer.

---

## 0. Audit (done before any change)

Read in full before writing code: `supabase/schema.sql`, `src/context/AuthContext.tsx`,
`src/app-native/AppExperience.tsx` (then named differently pre-rename in an earlier phase),
`src/app-native/screens/NativeOnboarding.tsx`, `src/components/auth/ProtectedRoute.tsx` /
`AdminRoute.tsx`, `src/pages/JoinPage.tsx`, `src/services/membershipService.ts`,
`src/config/mobileApp.ts`, `supabase/functions/food-scan/index.ts`,
`supabase/functions/ai-chat/index.ts`, `src/app-native/screens/NativeAccount.tsx`, and the full
Supabase Edge Function directory listing. No existing working system was duplicated — the free-signup
flow, calorie engine, social graph, and program builder are new; everything else (consultations,
membership, Prayer Times, Qibla, Products, Blog, Videos, PWA/Android/iOS shell, AI Concierge
architecture) is reused as-is.

## 1. The Next/Refresh Bug — Root Cause and Fix

**VERIFIED (root cause identified by reading the actual code, not guessed) / IMPLEMENTED (fix).**

**Root cause**: `AppExperience.tsx`'s onboarding gate computed `needsOnboarding` **once**, inside a
`useEffect` with an empty dependency array, from `getSetting(ONBOARDING_SEEN_KEY, false)`. Finishing
onboarding persisted the "seen" flag to storage and called `navigate("/", { replace: true })`, but
the gate's own `needsOnboarding` React state was never told about that — it was a disconnected copy.
On the very next render, the gate re-evaluated `needsOnboarding (still true) && pathname !== "/onboarding" (now true, since we're on "/")`
and bounced straight back to `/onboarding`. A hard refresh "fixed" it only because remounting the
component re-ran the effect and this time read the now-correctly-persisted value from storage. This
matches the reported symptom exactly: tap the finishing button, land back where you started, only a
refresh works.

**Fix**: a new `AppBootContext` (`src/context/AppBootContext.tsx`) is the **one** reactive state tree
for boot/onboarding status. Both the gate (`AppExperienceRoutes` in `AppExperience.tsx`) and every
action that changes what the gate depends on (`markWelcomeSeen`, `advanceOnboardingStep`,
`finishOnboarding`) read and write the *same* React state — there is no second, disconnected copy
anywhere for the two to drift apart. No `setTimeout`, no `window.location.reload()`, no double
`navigate()`, no forced refresh — completing a step calls one `await`ed persist function, which
updates the shared state synchronously with the persisted value, and the component tree re-renders
once with the correct next step already resolved.

The **new** multi-step onboarding wizard (`src/app-native/onboarding/*.tsx`, orchestrated by the
rewritten `NativeOnboarding.tsx`) was built on top of this same architecture from the start: the
*current step* is a value read from `AppBootContext`, never local `useState` in the wizard itself, so
this entire bug class cannot recur there. `OnboardingStepShell`'s Next/primary button is disabled
while its own async save is in flight (`saving` prop), preventing double-submit.

**Acceptance test status** (§104 of the brief): the described scenarios (Next → immediate transition,
Back → correct previous step, refresh mid-way → resumes at the persisted step, close/reopen → resumes
at the persisted step, double-tap → one mutation since the button disables itself) are all satisfied
by construction of this architecture. **Not independently verified against a live Supabase Auth
session in this environment** (no live project connected here — see §"Missing Credentials"), so this
is marked **IMPLEMENTED**, not **VERIFIED**, until run against a real signed-up account.

## 2. Free Accounts

**IMPLEMENTED.** `src/app-native/components/FreeSignUpForm.tsx` calls Supabase's plain
`auth.signUp()` (via `AuthContext.signUp`, which already existed but was unused until now) — no
Stripe, no package selection, no payment gate. The app experience's `/join` route
(`AppExperience.tsx`) now renders `NativeFreeSignUp.tsx` (wraps `FreeSignUpForm`) instead of the
marketing `JoinPage` it previously reused. **The marketing website's own `/join` (`JoinPage.tsx`) is
completely untouched** — it still starts the paid Stripe Checkout flow exactly as before; free
accounts and paid memberships are now two structurally separate flows sharing nothing but the
underlying Supabase Auth user, matching the explicit "account creation ≠ membership purchase"
requirement. `NativeAccount.tsx`'s membership row now reads "Free account" instead of blank when no
subscription exists.

## 3. Roles

**IMPLEMENTED — REQUIRES DATABASE MIGRATION.** `profiles.role` (`user | doctor | admin` enum),
backfilled from the existing `is_admin` flag so the current admin account keeps working without
re-entry. **A real, pre-existing security gap was found and fixed while building this**: schema.sql's
original `"Users can update their own profile"` policy has a `USING` clause but no `WITH CHECK`,
meaning it does not restrict which columns a user may change on their own row — before this
migration's trigger, a signed-in user could have run
`update profiles set role = 'admin' where id = auth.uid()` and succeeded. A
`prevent_self_role_escalation()` `BEFORE UPDATE` trigger now blocks any change to `role`/`is_admin`
unless the caller already has admin privileges — ships in the same migration file, so the gap is never
live in any database this is applied to. `is_admin()` (existing) and the new `is_doctor()` are the
two role-check helpers used everywhere else. Promoting a user to doctor is a manual Supabase
Table-Editor edit, same trust model schema.sql already documented for `is_admin` — no self-service or
admin-UI promotion path was built (kept out of scope; documented here rather than silently omitted).

## 4. Profiles & Usernames

**IMPLEMENTED — REQUIRES DATABASE MIGRATION.** `profiles.username/avatar_url/bio/timezone` added.
Username: lowercase, 3-24 chars (`[a-z0-9_.]`), a case-insensitive unique index, a reserved-word list
(`admin`, `root`, `monzer`, `doctor`, etc.) enforced by a check constraint, and a
`check_username_available()` RPC the sign-up form calls live before submitting. `src/services/profileService.ts`
wraps all of this (`getFullProfile`, `setBasicProfile`, `searchUsers`, `getPublicProfile`).

## 5. Privacy

**IMPLEMENTED — REQUIRES DATABASE MIGRATION.** `user_privacy_settings` — six per-category friend
toggles (meals, meal photos, calories, steps, activity, program progress) plus a `share_weight_with_friends`
column that exists but is **deliberately not wired into any RLS policy** (weight stays private from
friends unconditionally, per the explicit "should remain private by default" instruction — treated as
"private, full stop" rather than "private but user-togglable," a conservative simplification
documented here rather than silently applied). Doctor visibility is **not** a granular per-field
toggle — it's gated entirely by the existence of an *active* `doctor_patient_relationships` row, per
the brief's own framing of the relationship itself as the consent mechanism. The `PrivacyStep`
onboarding screen sets these on signup; `body_profiles` (conditions/allergies/medications) has **no**
friend-visibility policy on it at all — it is never shown to friends under any setting.

## 6. User Search

**IMPLEMENTED — REQUIRES DATABASE MIGRATION.** `search_users()` RPC (`SECURITY DEFINER`, but scoped):
minimum 2-character query, hard cap of 20 results, excludes the caller and anyone who has blocked/been
blocked by them, returns only `id/username/full_name/avatar_url` — never email, phone, or health data.
`NativeSocial.tsx`'s Find tab debounces the query client-side (350ms) before calling it, bounding
worst-case load further even without a dedicated rate-limiting Edge Function in front of it (not built
— the RPC's own 2-char minimum + 20-row cap was judged sufficient for this scale; a real abuse-rate
Edge Function wrapper is the natural next step if usage ever demands it, and is called out here rather
than silently assumed unnecessary forever).

## 7. Friends

**IMPLEMENTED — REQUIRES DATABASE MIGRATION.** `friendships` table with a generated `pair_key`
(`least(a,b) || ':' || greatest(a,b)`) and a partial unique index on it covering `pending/accepted/blocked`
— makes "no A→B and B→A duplicate," "no duplicate pending request," and "a block prevents a new
request" real database constraints, not application-trusted checks. Every state transition
(`send_friend_request`, `respond_friend_request`, `cancel_or_remove_friendship`, `block_user`) is a
`SECURITY DEFINER` RPC with `auth.uid()`-scoped logic — no direct client insert/update/delete policy
exists on the table at all. `src/services/friendsService.ts` + `NativeSocial.tsx` (Friends/Requests/Find
tabs) + `NativeFriendProfile.tsx` (accept/remove/message, today's *shared* stats only) are the UI.

## 8. Messaging

**IMPLEMENTED — REQUIRES DATABASE MIGRATION.** `conversations` / `conversation_participants` /
`messages`, 1-to-1 only (no groups/channels, per scope). `get_or_create_direct_conversation()` refuses
to create a conversation unless the two are an *accepted, unblocked* friendship. The `messages` INSERT
policy re-checks blocking at send-time too (not just at conversation-creation time), so a friendship
that gets blocked *after* a conversation already exists still can't be used to send new messages.
Realtime: `subscribeToConversation()` uses a Supabase Realtime channel scoped to one
`conversation_id` filter — never a global table subscription. UI: `NativeSocial.tsx`'s Messages tab
(conversation list, unread dot) + `NativeMessageThread.tsx` (thread view, send).

## 9. Doctor Accounts & Dashboard

**IMPLEMENTED — REQUIRES DATABASE MIGRATION.** A doctor/admin's **Home tab is the doctor dashboard**
(`NativeDoctorDashboard.tsx`) instead of the patient Today dashboard — one persona, one Home
destination, decided by `role` from `AppBootContext` (see §"Navigation" below for the reasoning).
Shows patient/pending-request/today's-consultation counts, a pending-connection-request accept list,
and the active patient list (`getMyPatients()`). Never shows every user in the system — only rows with
an existing `doctor_patient_relationships` row for that doctor.

## 10. Doctor ↔ Patient Access

**IMPLEMENTED — REQUIRES DATABASE MIGRATION.** `doctor_patient_relationships` (`pending/active/ended`),
a partial unique index preventing duplicate active/pending pairs, and three `SECURITY DEFINER` RPCs
(`request_doctor_connection`, `respond_doctor_connection`, `end_doctor_connection`) — no direct client
writes. `has_active_doctor_relationship(doctor, patient)` is the one helper every health-data RLS
policy in this migration calls to decide doctor access — access requires **active**, not merely
**pending**; a doctor can see the *identity* (name/username/avatar) of a pending-request patient (so
they know who's asking) but not their health data until they accept. `NativeDoctorPatientProfile.tsx`
shows body profile, current target, 7-day calories, allergies/conditions, program link, a manual
calorie-target override field, and a private note field.

## 11. 30-Day Nutrition Program

**IMPLEMENTED — REQUIRES DATABASE MIGRATION.** `nutrition_programs` / `nutrition_program_days` (1-30) /
`nutrition_program_items` (breakfast/snack/lunch/dinner, title/description/suggested foods/portion/
approx calories/time) / `nutrition_program_item_completions`. Templates: a program row with
`is_template = true` and no `patient_id`; `assign_program_from_template()` deep-copies a template's
days+items into a brand-new draft program for a specific patient — a check constraint enforces
templates never have a patient and assigned programs always do, so patient-specific data can never
leak into a shared template by construction. **Doctor builder** (`NativeDoctorProgramBuilder.tsx`):
day-by-day navigator (1-30), add-item form, **Copy Previous Day** (the one explicitly-required
duplication shortcut — "duplicate meal to multiple days" and full drag-and-drop reordering were judged
lower priority given the time available and were **not built**; documented here as a scope cut, not
silently dropped), Activate button. **Patient view** (`NativeMyProgram.tsx`): "Day N of 30," today's
items with Complete-via-scan / Skip, doctor's day instructions. `getMyActiveProgram()` +
`currentProgramDayNumber()` derive the current day from `start_date`, clamped to 1-30 — no separate
"current day" counter to drift out of sync.

## 12. Food Scanner

**VERIFIED (build/wiring) / REQUIRES GEMINI CREDENTIALS (live scan, unchanged from prior phases — no
`GEMINI_API_KEY` configured in this environment).** Flow unchanged and reused:
photo/gallery → compress → `food-scan` Edge Function → Gemini → structured JSON → review/correct
(already existed) → **new**: Save Meal. Never labels a result "Exact" — "Estimated Nutrition"
throughout, unchanged. **New this phase**:
- Daily scan cap: `food_scan_events` table + a check in `food-scan/index.ts` before the Gemini call
  (`FREE_DAILY_FOOD_SCAN_LIMIT = 15`/24h, mirrored from `src/config/features.ts` — the two Deno/Vite
  runtimes can't share an import, same pattern already used for the membership-gate constant). An
  event is recorded for every real attempt that reaches Gemini, regardless of outcome.
- Allergy heads-up: `NativeFoodResult.tsx` substring-matches detected food names against the visitor's
  declared `food_allergies` and shows *"This meal may contain an ingredient you listed as an allergy
  (...). This is a text match on the detected food names, not a guarantee..."* — explicitly never
  claims a meal is safe, never used as a safety guarantee.
- Planned-vs-actual: when reached via a program item's "Scan My Meal," the screen shows a "Planned
  Meal" card (title + suggested foods) above "What You Logged" — no shaming language, no auto-fail.

## 13. Meal Logging

**IMPLEMENTED — REQUIRES DATABASE MIGRATION.** `meal_logs` (+ `meal_log_items`) — meal type, program
item reference (nullable), `is_outside_program`, AI confidence, macro totals, `shared_with_friends`,
`notes`. `src/services/mealLogService.ts`'s `saveMealLog()` writes both tables and, if a
`program_item_id` was supplied, upserts a `nutrition_program_item_completions` row in the same call.
`getMyMealsForDay`/`getMyMealsInRange`/`getPatientMealsInRange` back the Home Today card, Progress
screen, and doctor patient profile respectively — none of them fetch more than the requested window
(no "load all history on every screen" pattern).

## 14. Body Profile

**IMPLEMENTED — REQUIRES DATABASE MIGRATION.** `body_profiles`: DOB, height, weight, `biological_sex`
(explicitly documented and labeled in the UI as "for the calorie formula," not a gender-identity
field), activity level, goal, unit preferences, health conditions/allergies/intolerances/dietary
preferences (each a `text[]` + a free-text "Other" column), private `medications`. Collected across
onboarding's `BodyHealthStep` (all fields skippable via an explicit Skip) and editable later at
`/my-health` (`NativeMyHealth.tsx`). RLS: owner + active-doctor-only, **no** friend policy exists on
this table at all.

## 15. Daily Calorie Target

**VERIFIED (calculation) / IMPLEMENTED (storage/RLS).** `src/lib/calorieCalculator.ts` — Mifflin-St
Jeor, a pure deterministic function with **no Gemini call anywhere in the path**. Explicit safety
rules, both defensible engineering decisions not arbitrary numbers:
- Refuses to calculate for anyone under 18 (`REQUIRES_DOCTOR_MINOR` outcome) — the UI then shows "set
  by your doctor" messaging instead of a number.
- Clamps the result so it can never suggest eating *below* the estimated BMR itself, regardless of how
  aggressive the requested deficit is — a hard, non-negotiable floor, not a suggestion.
- Goal adjustment is a moderate ±500/+300 kcal, not an aggressive deficit.

`daily_targets` stores `bmr_estimate/maintenance_estimate/daily_target/formula/source/inputs_version/calculated_at`,
and a `BEFORE INSERT` trigger (`unset_previous_daily_target`) atomically keeps exactly one
`is_current = true` row per user regardless of whether the new row came from the user's own
recalculation or a doctor override — no separate "unset the old one" round trip that could race.
`NativeMyHealth.tsx` shows the target card and a "Save & Recalculate" flow.

## 16. Doctor Target Override

**IMPLEMENTED — REQUIRES DATABASE MIGRATION.** A second `daily_targets` INSERT policy allows
`source = 'doctor'` rows only when `set_by = auth.uid()` and that doctor has an active relationship
with the target's `user_id`. `NativeDoctorPatientProfile.tsx`'s "Set Daily Target" field calls
`setDoctorOverrideTarget()`. The patient's Home/My-Health cards display **"Target set by Dr. Monzer"**
whenever `source = 'doctor'`, and nothing in the client ever re-runs the auto-calculation over a
doctor-set target — `recalculateMyDailyTarget()` is only ever called from the patient's own explicit
"Save & Recalculate" action, never automatically.

## 17. Activity Task After Meal

**VERIFIED (creation logic) / IMPLEMENTED (end-to-end).** `POST_MEAL_ACTIVITY_DELAY_MINUTES = 25`
lives in exactly one place (`src/config/features.ts`) — not scattered. `createPostMealActivityTask()`
(called immediately after every successful meal save, never blocking the save itself) inserts an
`activity_tasks` row with `available_at = now() + 25min` and a pre-selected activity (see §"Activity
selection" below) right away — the 25-minute wait happens by the row simply not being "available" yet,
never by holding the request open or polling in a loop.

## 18. Activity Selection & Safety

**IMPLEMENTED.** `activity_library` — 8 seeded entries (Easy/Moderate/20-/30-Minute Walk, Gentle
Mobility, Light Stretching, Beginner Bodyweight, Wall Push-Ups), each with `duration_minutes`,
`difficulty` (`easy`/`moderate` only — no high-intensity entries exist), `met_value`, `safety_tags`.
Gemini is **never** involved in choosing or generating an activity — `activityService.ts`'s
`pickActivity()` is a plain function that filters to `easy`-only unless the visitor's activity level is
`moderate/active/very_active`, then picks pseudo-randomly from what remains. Personalization uses only
`activity_level` from the body profile — never inferred from a food photo, matching the explicit "never
infer fitness capability from an image" rule.

## 19. Activity Completion & Calories Burned

**IMPLEMENTED — REQUIRES DATABASE MIGRATION.** `NativeActivityTask.tsx`: Start → Done (only "Done"
marks it complete, never automatic), Skip, Change (swaps to a different library entry client-side
before committing). `estimateCaloriesBurned()` = `MET × weight(kg) × duration(hours)` — the standard
formula, not a Gemini guess; the UI shows a ±25% range (`~80–130 kcal`) rather than false single-number
precision, and falls back to a generic 70kg reference weight (documented in code) if the visitor hasn't
entered their own. `activity_logs` records `duration_minutes/estimated_calories_burned/source/completed_at`;
`activity_tasks.status` moves to `completed`/`skipped` accordingly. No "calorie debt" framing anywhere
in the UI copy or the AI system prompt (see §Gemini below).

## 20. Notifications

**IMPLEMENTED (capability layer) / NOT IMPLEMENTED (actual push scheduling for the new activity-task
reminder specifically).** `notification_preferences` table (7 independent toggles: activity, program,
friend requests, messages, doctor updates, consultations, prayer) exists in the migration with RLS,
but **no settings screen or native-notification-scheduling code was built for it in this pass** — the
existing native prayer-reminder `LocalNotifications` architecture and its PWA capability-gating (built
in the prior PWA phase) were reused as the honesty pattern to follow, but wiring an actual "schedule a
local notification ~25 minutes after this meal" call was judged out of scope given the remaining time
in this session. This is flagged explicitly rather than glossed over: **today, a pending activity task
is only surfaced in-app** (the Home "Movement ready" banner, once `available_at` has passed) — there is
no OS-level push/local notification firing at the 25-minute mark yet on any platform. This is the most
significant deliberately-scoped-out gap in this phase; see §"Remaining Work" for what a follow-up pass
needs to build (a `scheduleLocalNotification` call in `createPostMealActivityTask`'s native path,
gated by the existing `supportsScheduledBackgroundNotifications()` capability check from the PWA
phase, which already correctly reports `false` on browser/PWA).

## 21. Steps, HealthKit, Health Connect

**IMPLEMENTED (manual + capability architecture) / NOT IMPLEMENTED (real HealthKit/Health Connect
integration).** `step_logs` (one row per user per day, `source` tracked to prevent double-counting) +
`src/services/stepService.ts` (manual entry, fully working, RLS-protected). `supportsAutomaticSteps()`
honestly returns `false` everywhere: **no HealthKit or Health Connect Capacitor plugin is installed in
this project** (`package.json` has neither `@capacitor-community/health-connect` nor an equivalent
HealthKit plugin) — wiring one in requires new native permissions/entitlements (Android
`android.permission.health.READ_STEPS`, iOS `NSHealthShareUsageDescription` + the HealthKit
capability) and can only be meaningfully verified on a physical device running the resulting native
build, neither of which was possible from this environment. Rather than claim partial credit, this is
labeled **NOT IMPLEMENTED** for the sensor integration itself — the manual-entry fallback and the
capability-detection *pattern* it will plug into are real and shipped; the actual plugin wiring is
follow-up work requiring `REQUIRES PHYSICAL DEVICE` testing once built.

## 22. Weight Tracking

**IMPLEMENTED — REQUIRES DATABASE MIGRATION.** `weight_logs` + `src/services/weightService.ts`
(`logMyWeight`, `getMyWeightHistory`). Private by default and, per §5 above, private from friends
unconditionally regardless of the (unused) `share_weight_with_friends` column; visible to an active
doctor only. Surfaced in `NativeProgress.tsx`'s "Latest Weight" stat; no dedicated "Log Weight" entry
point screen was built beyond the service layer — a small scope cut given time, noted here.

## 23. Daily Dashboard, 30-Day History, Progress

**IMPLEMENTED — REQUIRES DATABASE MIGRATION.** `NativeHome.tsx` (patient) now leads with a Today card
(calories consumed/target/remaining, steps, program day) instead of the old membership-summary card,
plus a "Movement ready" banner when an activity task's `available_at` has passed. `NativeProgress.tsx`
has Today/7-Day/30-Day range tabs (calories, meals logged, estimated activity calories, activities
completed, average steps, latest weight) — each range queries only its own window, never all history
on load. A dedicated 30-day *calendar* grid view (tap-a-day-for-detail, per the brief's example) was
**not built** — `NativeProgress.tsx`'s range tabs cover the same underlying data but as aggregate
stats, not a calendar UI; this is a scope cut given the time available, documented rather than silently
dropped. `get_daily_summary()` (a `SECURITY DEFINER` SQL function computing a live per-day summary in
the caller's own timezone) exists in the migration as prepared infrastructure but **is not yet called
from any service** — the screens built this pass compute their aggregates via direct RLS-protected
table queries instead. **A real, exploitable bug was found and fixed in this function during
self-review**: as originally written, being `SECURITY DEFINER` meant it bypassed RLS entirely with no
compensating check, so any authenticated caller could have passed an arbitrary `p_user_id` and read a
stranger's private weight/calorie/step history. Fixed by wrapping the query and adding an explicit
`where auth.uid() = p_user_id or has_active_doctor_relationship(auth.uid(), p_user_id)` — caught and
closed before this ever reached a live database.

## 24. Social Activity

**IMPLEMENTED (friend-profile shared-today view) / NOT IMPLEMENTED (a dedicated scrolling activity
feed).** `NativeFriendProfile.tsx` shows a friend's *today* snapshot (calories/steps/activity) filtered
through both `shared_with_friends` on the specific row and the sharer's `user_privacy_settings` —
exactly the permission model requested. A separate chronological "Sarah logged breakfast — 420 kcal /
Ahmed completed a 30-minute walk" feed screen (distinct from the profile snapshot) was **not built** —
given the remaining time, the friend-profile view was judged to deliver the same core "see what your
friends chose to share" value without a second screen and its own pagination/query surface. Documented
as a scope cut, not a silent omission — a follow-up feed screen can query `meal_logs`/`activity_logs`
where `shared_with_friends = true` and the RLS policies already in place, no new backend work needed.

## 25. Gemini / AI Concierge Integration

**VERIFIED (context wiring) / REQUIRES GEMINI CREDENTIALS (live answers).** `ai-chat/index.ts` gained
a new `getHealthContext(userId)` — queried only for `platform !== "web"` (the marketing site's floating
widget never sees health data, matching "don't send unnecessary private data on every question" and
the simple fact that the website has no tracking UI at all). Returns last-24h meals/calories, current
daily target (and its source), active program day number, one pending activity name, and today's
steps — assembled into a `HEALTH CONTEXT` system-prompt block instructing the model to use *only*
those real numbers and never invent a meal or figure not listed. `SYSTEM_PROMPT` gained an explicit
rule against "calorie debt" framing (*"never say things like 'you ate X calories, burn X'"*) and
against implying a food-scan estimate is exact — on top of the pre-existing diagnose/prescribe/
medical-escalation rules from the prior AI Concierge phase, which are unchanged. Not independently
re-verified with a real Gemini call (still no `GEMINI_API_KEY` configured in this environment,
unchanged from every prior phase) — code-reviewed and internally consistent, not live-tested.

## 26. Membership & Consultation Compatibility

**VERIFIED — no regression.** `subscriptions`/`consultation_requests`/`book_consultation_slot()` and
every other membership/consultation table, RPC, and Edge Function from the original `schema.sql` are
**completely untouched** by this migration (only `profiles` gained new nullable/defaulted columns).
Free accounts and paid memberships are now independent: a free account has no `subscriptions` row and
that's a valid, fully-supported state (`getMySubscription()` already returned `null` gracefully before
this phase). Booking a consultation without an active membership still fails at
`book_consultation_slot()`'s existing `NO_ACTIVE_MEMBERSHIP` check — unchanged, not touched this phase.

## 27. Row-Level Security

**IMPLEMENTED — REQUIRES DATABASE MIGRATION for the tests below to actually run.** Every new table has
RLS enabled with no exceptions. Two real issues were found and fixed **before** shipping this file (not
theoretical — both are described with the exact fix in §3 and §23 above): the pre-existing
`profiles` self-role-escalation gap, and the new `get_daily_summary()` SECURITY DEFINER bypass. A
written test plan (mirroring §101-102 of the brief) is documented here for whoever runs this migration
to execute against a real project — **not run against a live database in this environment**, since
none exists here:

| # | Test | Expected |
|---|---|---|
| 1 | User A selects User B's `body_profiles` row directly | 0 rows (RLS blocks; no friend policy exists on this table) |
| 2 | User A selects User B's `meal_logs` where `shared_with_friends=false` | 0 rows |
| 3 | User A (accepted friend of B) selects B's `meal_logs` where `shared_with_friends=true` | rows returned, honoring B's `user_privacy_settings` |
| 4 | User A blocked by B, tries `get_or_create_direct_conversation(B)` | raises `BLOCKED` |
| 5 | Doctor D selects patient P's `body_profiles` with only a `pending` (not `active`) relationship | 0 rows |
| 6 | Doctor D (active with P) selects unrelated User X's data | 0 rows |
| 7 | User A runs `update profiles set role='admin' where id=auth.uid()` | trigger raises `FORBIDDEN` |
| 8 | User A selects `doctor_notes` written about themselves by their doctor | 0 rows (no patient SELECT policy exists) |
| 9 | User A selects `messages` in a conversation they never joined | 0 rows |
| 10 | User A calls `get_daily_summary(p_user_id => <B's uuid>, ...)` without a doctor relationship | 0 rows (post-fix) |

## 28. Storage Security

**IMPLEMENTED — REQUIRES DATABASE MIGRATION.** Three buckets: `avatars` (public read, path-prefixed
owner-only write), `meal-images` (private; owner + active-doctor read via a `storage.foldername(name)[1]::uuid`
path-prefix check calling the same `has_active_doctor_relationship()` helper used everywhere else —
**friend visibility is deliberately not granted on the storage bucket even for shared meals**, kept
conservative: the shared-with-friends UI only ever surfaces meal text/macros, never the original photo,
so the bucket policy doesn't need to reason about that case at all), `program-images` (doctor-owned,
private). No code in this phase actually uploads a meal/program image yet — `image_path` columns exist
on `meal_logs`/`nutrition_program_items` and the bucket policies are ready, but the Food Scanner
currently only sends the compressed image to Gemini for analysis and discards it rather than uploading
to `meal-images` (this matches the pre-existing, prior-phase behavior — not a regression, and
consistent with the brief's "prefer not to permanently store full original images unless required and
consented" guidance). Flagged as **NOT IMPLEMENTED**: an actual upload-and-retain flow with visitor
consent, if the practice wants meal photos kept.

## 29. PWA / Android / iOS Regression

**VERIFIED.**
- `npx tsc --noEmit` — 0 errors.
- `npm run lint` — 0 errors (8 pre-existing warnings, none in files this phase touched).
- `npm run build:web` — succeeds, `dist/`.
- `npm run build:app` — succeeds, `dist-app/`, service worker regenerated (159 precache entries).
- `npm run cap:sync` — succeeded for both `android` and `ios`; the Package.swift backslash-path
  self-healing fixup (from the iOS phase) re-ran and applied cleanly.
- **Real Android Gradle build**: `./gradlew assembleDebug` → `BUILD SUCCESSFUL in 17s` — proves the
  shared-code changes in this phase (new routes, new `AuthContext`-adjacent screens, `AppBootProvider`
  wrapping the whole app-experience tree) don't break the native Android app.
- iOS: `cap sync ios` succeeded; no Xcode build attempted (no Mac/Xcode available here, unchanged
  standing limitation from the iOS phase).
- Secret grep: `dist/`, `dist-app/`, and `android/app/src/main/assets/public/` all checked for
  `GEMINI_API_KEY`/`SUPABASE_SERVICE_ROLE_KEY`/`STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET`/
  `GOOGLE_CLIENT_SECRET`/`GOOGLE_REFRESH_TOKEN`/`RESEND_API_KEY`/`sk_live`/`sk_test`/`GOCSPX-` —
  zero matches in all three.
- Playwright smoke pass against the dev server: marketing homepage, onboarding welcome slide, guest
  Home (Create Free Account CTA), Social/Progress/My Program/Account screens in guest state, and the
  desktop sidebar with the new nav (Scan/Program/Social links present) — no console errors, no crashes.
  Two initial "sidebar not visible" failures during this pass were traced to the test script's own
  `waitUntil: "networkidle"` never resolving against Vite dev server's persistent HMR WebSocket
  connection (a test-harness artifact), not a real bug — confirmed by a second script without that
  option, which found the sidebar and all four nav links rendering correctly.

## 30. Navigation (IA Decision)

**IMPLEMENTED — documented reasoning, not an arbitrary swap.** New bottom nav / desktop sidebar:
**Home, Program, Scan (raised center action), Social, Account** — replacing the previous
Home/Health/AI/Consultations/Account. Reasoning:
- **Scan replaces AI as the elevated central action** because the brief explicitly frames food
  scanning as a multiple-times-a-day action ("Strongly consider Scan as the raised center action") and
  the core loop's very first real action after "Eat" — while asking an AI question is occasional. AI
  remains reachable in exactly one tap (a Home quick-action card), satisfying the "1-2 taps" requirement
  without needing a dedicated tab slot.
- **Program is new and primary** — the 30-day program is called one of the most important features in
  the brief; it needed a top-level slot, not a sub-page under a generic "Health" tab.
- **Social is new** (friends/requests/find/messages) — also explicitly required to be reachable
  quickly.
- **Consultations moved to Account** (already had rows for it) rather than keeping a dedicated tab —
  the brief explicitly permits this ("Keep Consultations accessible even if moved into Home/Account/
  Program").
- **Prayer Times/Qibla/Products/Blog/Videos moved under the Program tab's match scope and Home's
  quick-link row** rather than keeping a standalone "Health" content-hub tab — five tabs is the
  practical ceiling for a usable bottom nav, and Program/Social/Scan are all higher-priority new
  destinations than a generic content browser.
- **A doctor's Home tab renders the doctor dashboard instead of the patient dashboard** (checked via
  `role` from `AppBootContext`) — one persona, one Home destination, rather than a sixth tab or a
  separate app mode toggle.

`src/app-native/navTabs.ts` carries this reasoning as an in-code doc comment so it isn't only
documented here, and `BottomNavigation.tsx`/`DesktopSidebar.tsx` both consume the same single
`APP_NAV_TABS` array — they cannot drift out of sync with each other.

## 31. Test Accounts

**NOT IMPLEMENTED (no seed script written).** No `User A / User B / Doctor / Admin` seed data was
created — there is no live Supabase project connected in this environment to seed, and the brief
explicitly forbids seeding fake data into a live/production database without approval. Whoever applies
the migration should create these manually (sign up two free accounts normally through the app, then
manually set one profile's `role` to `doctor` via the Supabase Table Editor, matching the existing
`is_admin` promotion pattern) to run the end-to-end test in §32.

## 32. Full End-to-End Test — Status

**NOT RUN (no live database).** The 38-step (Phase G2 numbering) / 20-step (this message's numbering)
acceptance flow was traced through the code path-by-path during development (every service function
call chain was read, not just written) but was **not executed against a real, running Supabase
project** — none is connected in this environment, and the migration has not been applied anywhere.
This is the single largest honesty caveat in this report: everything above is **code-complete and
internally consistent**, not **live-verified end-to-end**. Once the migration is reviewed and applied
to a real project with `GEMINI_API_KEY` configured, this flow should be run for real before calling
Phase G complete in the product sense.

## 33. Missing Credentials / Device Tests — Summary

- **REQUIRES DATABASE MIGRATION**: everything in §3 through §28 — no table, RPC, or policy in
  `PHASE_G_SOCIAL_NUTRITION_MIGRATION.sql` has been applied anywhere, per explicit instruction.
- **REQUIRES GEMINI CREDENTIALS**: live Food Scanner results, live AI Concierge answers with the new
  health context (unchanged limitation from every prior phase — no `GEMINI_API_KEY` here).
- **REQUIRES PHYSICAL DEVICE**: real HealthKit/Health Connect integration (not built at all this
  phase, see §21), real push/local-notification delivery for activity-task reminders (also not built,
  see §20), real iOS behavior of anything in this phase (no Mac/Xcode).
- **REQUIRES PRODUCTION DEPLOYMENT**: the `search_users`/friend-request/messaging flows' real-world
  latency and abuse-resistance at scale.
- **NOT IMPLEMENTED** (explicit scope cuts, not oversights — each documented in its section above):
  actual local-notification scheduling for the 25-minute activity reminder; real HealthKit/Health
  Connect plugin wiring; a dedicated chronological friends activity feed (vs. the friend-profile
  snapshot that was built instead); a 30-day calendar grid view (vs. the range-tab Progress screen that
  was built instead); "Duplicate meal to multiple days" / full drag-reorder in the program builder
  (vs. "Copy Previous Day," which was built); data export ("Download My Data"); delete-account flow;
  streaks; meal-image upload-and-retain with consent; a dedicated admin UI for promoting a user to
  doctor (manual DB edit only, matching the existing `is_admin` pattern); test-account seeding.

## 34. What "Phase G Is Complete" Would Still Require

In order, matching the brief's own framing: (1) review and apply
`PHASE_G_SOCIAL_NUTRITION_MIGRATION.sql` to the real Supabase project; (2) configure `GEMINI_API_KEY`
and deploy the `ai-chat`/`food-scan` Edge Functions (unchanged prerequisite from every prior phase);
(3) create the two test users + one doctor account described in §31 and run the full flow in §32 for
real; (4) decide whether to build the explicitly-scoped-out items in §33's NOT IMPLEMENTED list, most
importantly real activity-reminder notifications, before calling the core loop "done" end to end.

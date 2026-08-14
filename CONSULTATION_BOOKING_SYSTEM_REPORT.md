# Consultation Booking System Report

A real, server-authoritative consultation scheduling architecture: real doctor availability stored
in the database, real 48-hour-notice and credit enforcement, an atomic booking transaction with
database-level double-booking protection, real Google Calendar + Google Meet integration (not yet
deployed — see below), and real confirmation emails. Nothing here is frontend-only logic, and
nothing fakes a meeting that doesn't exist.

## Doctor Availability System

- New `doctor_availability` table (`supabase/schema.sql`) stores the recurring weekly schedule —
  day of week, start/end time, timezone, active flag, and a per-row `slot_duration_minutes` — so an
  admin can change hours later without a code change. Public `SELECT` is allowed (business hours
  aren't sensitive), writes are restricted to `is_admin()` via RLS.
- No consultation duration was configured anywhere in the project before this table existed, so
  **30 minutes** was chosen as a reasonable default and documented as such in the schema comments —
  change it any time via the admin dashboard.

## Default UAE Schedule

Seeded exactly as specified (only inserted if the table is empty, so it never overwrites an admin's
changes on re-run):

| Day | Hours | Timezone |
|---|---|---|
| Monday | 4:00 PM – 9:00 PM | Asia/Dubai |
| Wednesday | 4:00 PM – 9:00 PM | Asia/Dubai |
| Friday | 4:00 PM – 9:00 PM | Asia/Dubai |

## Availability Exceptions

New `availability_exceptions` table supports one-off overrides: `unavailable` / `holiday` /
`vacation` / `personal_block` (fully blocks a date) and `custom_hours` / `extra_day` (opens
different or additional hours on a specific date). The slot generator (`_shared/availability.ts`)
checks these before falling back to the recurring schedule.

## Admin Availability Dashboard

`/admin/availability` (route added to `App.tsx`, gated by a new `AdminRoute` component that checks
`profiles.is_admin` from the real database — never a client-side flag). Lets the doctor: toggle
Monday/Wednesday/Friday on or off, change start/end time and slot duration per day, add/remove
exceptions, and view **Today / This Week / Upcoming** appointments with client name, email, and
package. Not linked from any member-facing navigation. There is intentionally no self-service way
to become admin — set `profiles.is_admin = true` for the doctor's own row manually in the Supabase
Table Editor after they've signed in once.

## Slot Generation

`generateAvailableSlots()` in `supabase/functions/_shared/availability.ts` is the single
implementation used by both the public availability listing and the authoritative re-check at
booking time — never two competing implementations. It combines: active recurring availability
rows, exceptions (blocking or substituting), existing `pending`/`confirmed`/`rescheduled` bookings
(excluded), and the 48-hour notice window, generating slots at the row's configured duration.

## 48-Hour Restriction

Enforced in two independent places, both server-side:
1. `generateAvailableSlots()` never returns a slot starting less than 48 hours from `now()`.
2. The `book_consultation_slot` SQL function independently re-checks
   `p_appointment_start < now() + interval '48 hours'` and raises `MINIMUM_NOTICE_NOT_MET` if
   violated — so even a stale/tampered slot value from the client is rejected at the database
   layer, not just filtered out of the list shown to them.

## Timezone Handling

- `zonedTimeToUtc()` / `formatInZone()` (`_shared/availability.ts`) convert between wall-clock times
  in any IANA timezone and true UTC instants using `Intl.DateTimeFormat`-derived offsets — no manual
  hour arithmetic anywhere in the code.
- All authoritative timestamps (`appointment_start`/`appointment_end`) are stored as `timestamptz`
  (UTC) in Postgres.
- The booking page shows both **"Your Time"** (the visitor's browser-detected timezone) and
  **"Doctor's Time — Dubai"** side by side at every step (date selection, time selection, review,
  and the confirmation/email), computed independently in each timezone from the same UTC instant.

## Double-Booking Prevention

Database-level, not application-level: a partial unique index —
`consultation_requests_active_slot_idx on (appointment_start) where status in ('pending','confirmed','rescheduled')`
— means two concurrent booking attempts for the same slot cannot both succeed; Postgres itself
rejects the second `INSERT` with a `unique_violation`, which `book_consultation_slot()` catches and
converts into a clean `SLOT_TAKEN` error, surfaced to the frontend as exactly: *"This time is no
longer available. Please choose another appointment."* The reserve step and the credit deduction
happen inside the same `SECURITY DEFINER` function, so they succeed or fail together — never
"credit spent, slot not actually booked" or vice versa.

**Not independently load-tested** with two real concurrent browsers in this session — the schema
hasn't been deployed to a live database yet (see below), so there is nothing to run a real
concurrency test against. The protection was designed and code-reviewed for correctness (this is
the same pattern Postgres itself uses to guarantee uniqueness under concurrent transactions), not
empirically verified under load.

## Member Credits

Credit counts are read from `src/data/packages.ts` (already the single source of truth from earlier
work) everywhere — the AI knowledge generator, the booking page, and the account dashboard all
derive from it or from the real `subscriptions` row; nothing was hardcoded a second time. A credit
is only ever spent (via `consultation_credits_used` on the real subscription row) inside the atomic
`book_consultation_slot` transaction — never on page load, date selection, or time selection. If the
Google Calendar step subsequently fails or isn't configured, `rollback_consultation_hold()` restores
the credit and cancels the hold in one transaction, so a visitor can never end up with a spent
credit and no real appointment.

## Google Calendar Status

**Architecture-complete, not deployed.** `supabase/functions/_shared/googleCalendar.ts` implements
a standard OAuth2 refresh-token flow (exchange refresh token → access token → create/cancel a real
Calendar event). Not tested against a real Google account in this session — no credentials exist in
this environment. Verified via code review and via the browser test that the honest fallback path
triggers correctly when unconfigured (see Tests below).

## Google Meet Status

Same as above — `createConsultationEvent()` requests a real Meet conference
(`conferenceData.createRequest` with `conferenceSolutionKey: "hangoutsMeet"`) and only returns a
result once Google's API actually returns a conference link; there is no code path that generates a
fake or placeholder Meet URL anywhere in the system.

## Email Status

Two new templates added to the existing Resend-based `_shared/email.ts`:
`consultationConfirmedClientEmail` (client/local time, Dubai time, membership, credits remaining,
Join Google Meet button) and `consultationConfirmedAdminEmail` (client name/email, membership,
Dubai time, Meet link). Both are only sent **after** a real Calendar event is confirmed — never on
a reservation that later gets rolled back. Not yet tested against a live Resend account (same
`RESEND_API_KEY`/`EMAIL_FROM` dependency as the rest of the site's email architecture).

## AI Booking Awareness

`scripts/build-ai-knowledge.ts` (the same generator used for the AI Concierge, not a second system)
now includes a `consultation-availability` knowledge item with the real schedule
("Monday, Wednesday, and Friday, 4:00 PM to 9:00 PM Dubai time") and the 48-hour rule, plus an
updated `consultation-credits` item pointing at the real `/account/consultations` booking route.
The system prompt already instructs the model to never invent data and only use provided context —
this item gives it the real rule to answer "when can I book?" / "can I book today?" style questions
without inventing a specific open slot, and to route users to the real booking page for actual
availability. Verified in the browser: asking the live AI Concierge "When can I book a
consultation?" correctly hits the honest "temporarily unavailable" fallback, since the `ai-chat`
function still isn't deployed (unchanged from the prior report) — the knowledge item itself has not
been tested against a live Gemini response.

## Security

- Every credential the frontend could tamper with — `user_id`, subscription status, credit count,
  slot availability, the Google Meet URL — is resolved or re-validated server-side in
  `create-consultation`, never trusted from the request body. The user identity comes exclusively
  from `supabaseAdmin.auth.getUser(token)` against the caller's real Supabase session.
  `/admin/*` endpoints separately verify `profiles.is_admin` from the database on every request.
- RLS is enabled on every new table; the client has no direct insert/update policy on
  `consultation_requests` — every write goes through the `SECURITY DEFINER` functions.
- Rate limiting: 6 requests/minute per user on `create-consultation` (booking attempts are rarer and
  more consequential than chat messages, so this is tighter than the AI chat's 12/minute).

## Tests Performed

**Verified in this session (real browser):**
- `/account/consultations` and `/admin/availability` both correctly redirect unauthenticated
  visitors to `/login`.
- Full regression sweep across 15 routes (including the two new ones and existing product/blog
  detail pages) — no crashes.
- The AI Concierge still opens and responds normally after the knowledge-base update; asking it a
  booking question produces the honest "temporarily unavailable" response (the real, expected
  behavior since neither Edge Function is deployed).
- Zero horizontal overflow at 1920/1440/1024/768/430/390/360px on both new routes.
- Zero page errors across the entire run; the only console entries were the expected
  network/CORS failure from calling the not-yet-deployed `ai-chat` function.
- `npx tsc --noEmit`, `npm run lint`, `npm run build` — all clean (0 errors; only the 7 pre-existing
  `react-refresh/only-export-components` warnings, unrelated to this work). `AccountConsultationsPage`
  and `AdminAvailabilityPage` both confirmed as separate lazy-loaded chunks.
- Repo-wide grep and a `dist/` grep for Google secret patterns — no matches.

**Not performed (require the schema deployed + `GOOGLE_*`/`RESEND_API_KEY` configured + a real
member account with credits):**
- Booking a Monday/Wednesday/Friday slot end-to-end with a real confirmation.
- Confirming Tuesday/Thursday/Saturday/Sunday, same-day, and <48-hour attempts are all blocked by
  the live database (the logic was written and reviewed for this, but there is no live database to
  run it against yet).
- Two-browser concurrent double-booking race test.
- A real Google Calendar event + Meet link appearing, and cancelling it.
- Real emails arriving in the doctor's and client's inboxes.
- Credits correctly incrementing/decrementing across Basic (1), Premium (3), and VIP Elite (12)
  accounts, including the failed-Google-call rollback path with a live subscription row.

These are listed as outstanding, not claimed as passing — they need a deployed schema and live
Google/Resend credentials to run for real.

## Missing Configuration

Everything below is required before this system is live. Names only — no values are printed here or
were ever entered into this session.

**Database (not yet applied to any live project):**
- Run the updated `supabase/schema.sql` in the Supabase SQL Editor (or `supabase db push`) — adds
  `doctor_availability`, `availability_exceptions`, `profiles.is_admin`, the redesigned
  `consultation_requests` table/indexes, and the `book_consultation_slot` /
  `rollback_consultation_hold` / `confirm_consultation_hold` / `cancel_my_consultation` functions.
- Manually set `is_admin = true` on the doctor's own `profiles` row after they've signed in once.

**Supabase Edge Function secrets** (`supabase secrets set NAME=value`, never in a `VITE_*` variable):
- `SUPABASE_SERVICE_ROLE_KEY` (already required by other functions)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`
- `GOOGLE_CALENDAR_ID`
- `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_NOTIFICATION_EMAIL` (already required by other functions;
  reused here for consultation confirmation emails)
- `SITE_URL` (already required by other functions)

**Deployment:**
- `supabase functions deploy get-availability`
- `supabase functions deploy create-consultation`
- `supabase functions deploy admin-availability`

**This system is not live.** Until the schema is applied and the secrets above are configured, the
booking page will correctly and honestly show: *"Online scheduling is being activated. Your
membership and consultation credits are ready, but live meeting scheduling is not yet connected."*
— exactly as specified, never a fake confirmation.

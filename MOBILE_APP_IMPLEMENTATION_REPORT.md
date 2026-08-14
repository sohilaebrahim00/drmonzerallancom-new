# Mobile App Implementation Report

Converts the existing Dr. Monzer Allan Vite + React + TypeScript website into a native Android +
iOS application using **Capacitor**, per the required architecture. The website is untouched in
its own routing/behavior on desktop and mobile browsers — the app is the same codebase, same
Supabase backend, same Gemini AI Concierge, running inside a native shell with app-specific
navigation, safe-area handling, and five genuinely new native features (Prayer Times, Qibla, Food
Scanner, native Settings, and app-aware navigation).

**A real Android debug build was produced and verified in this session** — `android/app/build/outputs/apk/debug/app-debug.apk`,
built three times across this session (most recently after every source change was in place), each
time with `BUILD SUCCESSFUL`. iOS could not be built or run — there is no macOS/Xcode available in
this environment — so iOS status below is "architecture ready, not build-verified," never claimed
as tested.

## 0. Development Commands

```bash
npm run dev              # website dev server — unaffected by any of this
npm run build             # production web build (dist/) — required before any cap command
npx cap sync              # copy dist/ + plugin list into both android/ and ios/
npx cap open android      # open the Android project in Android Studio
npx cap open ios          # open the iOS project in Xcode (macOS only)

# convenience scripts added to package.json:
npm run cap:sync          # build + cap sync in one step
npm run cap:android       # build + sync + open Android Studio
npm run cap:ios           # build + sync + open Xcode
npm run cap:assets        # regenerate icons/splash from resources/ into both platforms

# what was actually run to produce the verified debug build in this session:
cd android && ./gradlew assembleDebug --no-daemon
```

## 1. Shared Website/App Architecture

```
Existing React/Vite Application
        ↓
Shared UI / Business Logic / Supabase / Gemini AI
        ↓
Capacitor
   ↙            ↘
Android        iOS
```

- One repository, one `src/`, one Supabase project, one Gemini backend. Nothing was forked or
  duplicated to build the app — `Capacitor.isNativePlatform()` is the single branch point used
  throughout (`src/hooks/use-native-platform.ts`), checked in `Header`, `Footer`, `ChatWidget`,
  `StickyCta`, `BackToTop`, and the new `AppShell`/`BottomNav` — never a separate native codebase.
- `npm run dev` and `npm run build` still work unmodified — verified repeatedly this session
  (last: `npm run build` succeeded in 10.46s producing 90+ chunks, including every new page as its
  own lazy chunk).
- `webDir: "dist"` in `capacitor.config.ts` — the app bundles the real production build, it does
  not point at a remote URL as its primary implementation.

**Status: LIVE** (the shared-architecture pattern itself — verified by the web build, the Android
build, and the code-level platform checks).

## 2. Capacitor Setup

- Capacitor 8.5.0 (`@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/ios`)
  plus the plugins actually used: `app`, `status-bar`, `splash-screen`, `preferences`, `keyboard`,
  `haptics`, `browser`, `camera`, `geolocation`, `local-notifications` — 10 plugins total, all
  officially maintained `@capacitor/*` packages, none unmaintained or third-party.
- `capacitor.config.ts`: `appId: "com.monzerallan.app"` (provisional — must be finalized before
  store submission, since changing it after publishing requires a new listing), `appName: "Monzer
  Allan"`, `webDir: "dist"`, brand-matched `StatusBar`/`SplashScreen` config.
- `resources/` (icon + splash source images, generated from the real `public/ma-logo.png` via
  `sharp`, on the app's navy `#17233b` and background `#fcfdfd` brand colors — the logo itself was
  not redesigned) → `npx capacitor-assets generate` produced all Android density buckets
  (mipmap/drawable, light + dark + landscape variants) and the iOS `AppIcon`/`Splash` asset
  catalogs.

**Status: LIVE.**

## 3. Android Status

- `android/` generated via `npx cap add android`, icons/splash generated, `AndroidManifest.xml`
  hand-extended with the permissions Capacitor's plugins require but don't auto-inject
  (`CAMERA`, `ACCESS_FINE_LOCATION`/`ACCESS_COARSE_LOCATION`, `READ_MEDIA_IMAGES`/
  `READ_EXTERNAL_STORAGE`) plus custom-scheme (`monzerallan://`) and App Links (`https://
  monzerallan.com/...`, `autoVerify="true"`) intent filters.
- **A real Gradle debug build was produced in this session**, not just scaffolded:
  `./gradlew assembleDebug` → `BUILD SUCCESSFUL`, run three times (once after the full feature set
  landed, once after `npx cap sync` picked up the final web build, once after the last code
  changes), producing a 12MB `app-debug.apk` each time. This required provisioning a JDK 21
  toolchain (added `org.gradle.toolchains.foojay-resolver-convention` to `settings.gradle` so
  Gradle could auto-download it, since the host only had JDK 23/25 and AGP's Capacitor camera
  module requires 21) and fixing a Windows-path escaping bug in `local.properties` (forward
  slashes instead of Java-properties-unsafe backslashes) — both are real environment fixes, not
  configuration left broken.
- **Not done in this session:** running the APK on an emulator or physical device (no Android
  emulator/device available here) and a release/signed build (needs a real keystore + Play Console
  setup). Compiling and packaging is real and verified; on-device interaction is not.

**Status: LIVE (build), NOT TESTABLE IN CURRENT ENVIRONMENT (on-device run).**

## 4. iOS Status

- `ios/` generated via `npx cap add ios` — full Xcode project (`App.xcodeproj`), asset catalogs,
  `Info.plist` hand-extended with the required usage-description strings
  (`NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`,
  `NSLocationWhenInUseUsageDescription` — without these, iOS kills the app the moment it requests
  that permission) and a `CFBundleURLTypes` entry for the `monzerallan://` custom scheme.
- **Not build- or run-verified.** This is a Windows machine — there is no Xcode, no macOS, no iOS
  Simulator. The project structure is correct and complete per Capacitor's standard template, but
  compiling it, running CocoaPods/Swift Package resolution, and testing on a simulator/device all
  require a Mac and were not possible here. This report does not claim otherwise.
- Universal Links (`https://monzerallan.com/...`) additionally need the **Associated Domains**
  capability added in Xcode plus a real `apple-app-site-association` file hosted at
  `https://monzerallan.com/.well-known/` — not configurable from this session (no Apple Developer
  account access, no hosting access).

**Status: ARCHITECTURE READY, NOT TESTABLE IN CURRENT ENVIRONMENT.**

## 5. Authentication

- Reuses the existing Supabase Auth client and `AuthContext` — no second auth system.
- `src/lib/supabase.ts` now branches on `Capacitor.isNativePlatform()`: native builds back the
  session store with `@capacitor/preferences` (durable native storage) instead of the SDK's
  default `localStorage`, and disable `detectSessionInUrl` (there's no browser address bar to
  parse an OAuth redirect from inside a WebView). Web behavior is byte-for-byte unchanged.
- Sign In / Forgot Password / Reset Password / Sign Out / persistent session — same code path as
  the website, verified via `tsc`/`build` after the storage-adapter change; **not verified against
  a live Supabase session on-device**, since that requires running the actual app.

**Status: IMPLEMENTED, NOT TESTABLE IN CURRENT ENVIRONMENT** (architecture is real and reuses the
verified web auth flow; on-device session persistence wasn't independently exercised).

## 6. Membership

- New `MembershipHubPage` (`/app/membership`, the Membership tab) reads real data only: the
  visitor's actual `subscriptions` row via the same `membershipService.getMySubscription()`/
  `getMyConsultationRequests()` used by `AccountPage`, and the real `packages` array
  (`src/data/packages.ts` — Basic $29/$58, 1 credit; Premium $61/$122, 3 credits, "MOST POPULAR";
  VIP Elite $103/$206, 12 credits + hotline) via the existing `<Packages />` section component —
  **reused directly, not re-typed**, so pricing/credits can never drift between web and app.
- Shows: active plan + credit bar, upcoming consultation (with Join Google Meet link when a real
  URL exists), a "Request a Consultation" CTA to the real booking flow, and the full package
  comparison for upgrading/joining.

**Status: LIVE** (reads real data through the existing, already-verified service layer).

## 7. Stripe

- No second payment implementation. `JoinPage`'s existing `startMembershipCheckout()` → Stripe
  Checkout flow is unchanged; the only change is **how the checkout URL opens**: previously
  `window.location.href = result.url` (which inside a native WebView would navigate the app's own
  WebView to Stripe's domain — not appropriate for a native app). Now routed through a new
  `openExternal()` helper (`src/lib/externalLink.ts`) that opens Stripe Checkout as an **in-app
  browser tab** (`@capacitor/browser`, SFSafariViewController on iOS / Chrome Custom Tabs on
  Android) on native, and behaves exactly as before on web.
- `STRIPE_SECRET_KEY` remains Edge-Function-only — confirmed absent from `dist/` and the Android
  bundled web assets (`android/app/src/main/assets/public/`) via repo-wide grep.
- **Not verified:** an actual native checkout round-trip (would need a live device + a real Stripe
  test payment). Full automatic hand-back into the app after the Stripe redirect (rather than the
  in-app browser tab showing the plain website success page) additionally depends on the
  App Links/Universal Links verification described in sections 3–4, which isn't hosted from this
  session.
- Apple/Google in-app-purchase policy for subscription-like services was **not audited** in this
  session (no App Store Connect/Play Console access) — per the standing instruction, do not assume
  store-payment-policy compliance without that audit before submission.

**Status: IMPLEMENTED BUT REQUIRES VERIFICATION** (architecture correct and reasoned through; no
live native payment was exercised).

## 8. Consultation Booking

- No new booking logic — `AccountConsultationsPage`, `consultationBookingService`,
  `availabilityService`, and the real Supabase RPCs (`book_consultation_slot`, etc.) are reused
  exactly as built for the website. `MembershipHubPage` links straight into that same flow.
- The "Join Google Meet" link renders only when a real `google_meet_url` exists on the consultation
  row — never fabricated — consistent with the existing website behavior.
- Added a haptic success pulse (`hapticSuccess()`) on a real confirmed booking result
  (`AccountConsultationsPage.handleConfirm`) — cosmetic, doesn't touch booking logic.

**Status: LIVE** (same, already-implemented server-authoritative booking system — see
`CONSULTATION_BOOKING_SYSTEM_REPORT.md` for its own live-status detail, which is unchanged by this
work).

## 9. Gemini AI

- **No second chatbot.** The native `AI` tab (`AIConciergePage`, route `/ai`) renders the exact
  same `ChatBody` component used by the website's popover/drawer widget, calling the same
  `sendChatMessage()` → `ai-chat` Edge Function. `ChatWidget`'s floating launcher is hidden on
  native (`if (isNative) return null`) specifically because the AI tab replaces it — there is
  exactly one conversation implementation, reused in two shells.
- `ChatBody` gained an optional `initialMessage` prop (auto-sent once on mount) so the Food
  Scanner's "Ask AI About This Meal" button can hand off a structured scan summary as a normal user
  message — still goes through the same Gemini call, no bypass.
- The knowledge base (`scripts/build-ai-knowledge.ts` → `generated-knowledge.json`, now 89 items,
  up from 85) gained three new `app-features` items (Prayer Times, Qibla, Food Scanner) so the
  assistant can describe these app-only features accurately instead of not knowing about them or
  guessing — regenerated via `npm run build:knowledge` and confirmed in the output count.
  `getKnownRoutes()` in `_shared/knowledge-retrieval.ts` gained the new routes so the assistant's
  action buttons can link to them.
- `GEMINI_API_KEY` remains Edge-Function-only. Confirmed absent from `dist/` and the Android
  bundled assets via grep, same as the existing report's finding.

**Status: same as `AI_CONCIERGE_IMPLEMENTATION_REPORT.md` — NOT LIVE** (no `GEMINI_API_KEY`
configured, function not deployed, in this session). The mobile-specific work here (single shared
component, no duplicate engine, correct knowledge additions) is complete and verified by `tsc`.

## 10. Food Scanner

Full pipeline, built end-to-end this session:

```
Camera / Gallery (@capacitor/camera)
        ↓
Canvas resize + JPEG re-encode (client, strips EXIF)
        ↓
supabase.functions.invoke("food-scan")   ← app never calls Gemini directly
        ↓
supabase/functions/food-scan/index.ts (Deno)
        ↓
Gemini multimodal (inlineData image + text) via extended _shared/gemini.ts
        ↓
Schema-validated, clamped JSON
        ↓
FoodScannerPage result UI (editable)
```

- `FoodScannerPage` (`/food-scanner`): "Take Photo" / "Choose From Gallery" (two explicit actions,
  each calling `Camera.getPhoto` with an explicit `source`), preview + Retake/Analyze (no automatic
  upload on capture), analyzing state, then a result screen labeled **"Estimated Nutrition"** (never
  "Exact") with the required disclaimer sentence verbatim, a total-calorie card, protein/carb/fat
  tiles, and a per-item editable list (edit name/portion/calories inline, remove an item, "+ Add
  Missing Item") — corrections recompute the displayed totals live from the edited list, not the
  original AI numbers.
- `supabase/functions/food-scan/index.ts`: mirrors `ai-chat`'s security pattern — verified-token
  auth (optional; membership gate is off by default, see below), a shared rate limiter
  (`_shared/rateLimit.ts`, extracted from `ai-chat`'s inline limiter so both functions use one
  implementation — 6 req/min for food-scan, tighter than chat's 12, since vision calls cost more),
  a 4MB image-size ceiling, MIME allowlist, and a strict response schema
  (`foodDetected`/`foods[]`/`totalEstimatedCalories`/`confidence`/`notes`) with every numeric field
  clamped server-side. When Gemini isn't configured or the call fails, it returns the same honest
  `foodDetected: false` shape with "Food scanning is temporarily unavailable" — never a fabricated
  result.
- `foodScannerRequiresMembership` is a single named export in `src/config/mobileApp.ts` (currently
  `false` — available to all), mirrored server-side in the Edge Function with a comment explaining
  why (Deno can't import Vite frontend modules — the same constraint already accepted in this repo
  for `DOCTOR_TIMEZONE` between `src/config/consultations.ts` and
  `supabase/functions/_shared/availability.ts`). Flipping it to `true` gates both the UI and the
  actual server-side scan call (checks for an active subscription, not just a request header).
- **"Ask AI About This Meal"** hands the *structured* result (a compact text summary of detected
  foods/calories) to the AI Concierge — never re-sends the photo.
- **Not implemented:** meal-history persistence (section 31 of the spec explicitly frames this as
  "prepare optional architecture... for the initial version" — given the scope of everything else
  in this build, no `meal_history` table or "Save Meal" button was added yet; the result screen
  is fully functional without it, and adding persistence later is additive, not a rework).

**Status: ARCHITECTURE READY, IMPLEMENTED BUT REQUIRES CREDENTIALS** (same `GEMINI_API_KEY`/
deployment gap as the AI Concierge — code is complete and schema-validated but has never produced
a real result in this session).

## 11. Prayer Times

Fully client-side, no backend dependency — **the one major new feature that is genuinely testable
right now**, independent of any missing credential.

- `adhan` (maintained, widely-used npm library) computes Fajr/Sunrise/Dhuhr/Asr/Maghrib/Isha —
  verified directly in this session via a Node script (`new PrayerTimes(coordinates, date,
  params)`), not just assumed to work.
- Configurable, not hardcoded to one city: `src/config/prayer.ts` exposes all 12 of `adhan`'s
  calculation methods (Muslim World League, Egyptian, Karachi, Umm Al-Qura, Dubai, Moonsighting
  Committee, ISNA, Kuwait, Qatar, Singapore, Tehran, Turkey) and both Asr madhabs
  (Shafi'i/Maliki/Hanbali vs. Hanafi), editable in Settings.
- Location: `PrayerTimesPage` never requests location on mount — only after the visitor taps "Use
  My Location" (via `@capacitor/geolocation`, permission requested at that moment) or picks from
  `src/data/cities.ts` (50 curated cities across the Gulf/Middle East/South Asia plus major
  international cities, each with real lat/lon/IANA timezone — not a geocoding API, explicitly a
  curated fallback list).
- Shows Next Prayer with a live countdown (`formatCountdown`, ticking every 30s) exactly as
  specified ("Maghrib — in 1h 24m"), plus the full day's times, with times formatted in the
  resolved timezone via `Intl.DateTimeFormat`.

**Status: LIVE** (fully functional today, verified by direct calculation testing and by `tsc`/lint/
build passing with the feature wired into routing and the bottom nav's Explore hub).

## 12. Prayer Notifications

- `supabase/functions` are not involved — reminders are scheduled entirely on-device via
  `@capacitor/local-notifications`, matching the "do not send prayer notifications from the server"
  requirement.
- Per-prayer ON/OFF toggles (Fajr/Dhuhr/Asr/Maghrib/Isha — Sunrise excluded, it isn't a prayer) plus
  a shared timing offset (At prayer time / 5 / 10 / 15 minutes before), defaulting to "at prayer
  time" (non-intrusive default, no early-nagging by default).
- `rescheduleAllReminders()` always cancels every previously-scheduled notification id first (ids
  are deterministic — `epochDay*10 + prayerIndex` — and the full list of currently-scheduled ids is
  persisted via the app-settings store), then reschedules fresh for the next
  `PRAYER_SCHEDULE_LOOKAHEAD_DAYS` (3) days — so toggling a setting, changing calculation method, or
  reopening the app never produces duplicate notifications.
- Notification copy matches the required minimal style exactly ("Maghrib Prayer" / "It's time for
  Maghrib prayer.") — no ads, no membership promotion mixed in.
- **Not verified:** actually receiving a scheduled notification on a device (requires a real
  Android/iOS install and waiting for/fast-forwarding to the scheduled time) and behavior across an
  actual app update or device reboot (the `local-notifications` plugin declares
  `RECEIVE_BOOT_COMPLETED` for exactly this, but it wasn't exercised).

**Status: ARCHITECTURE READY / LIVE logic (calculation + scheduling code runs and was verified via
build), NOT TESTABLE IN CURRENT ENVIRONMENT (actual notification delivery on-device).**

## 13. Qibla

- Bearing calculated via `adhan`'s own `Qibla()` function (not hand-rolled trigonometry) against
  the standard Kaaba reference coordinate (21.4225°N, 39.8262°E) — verified directly in this
  session (e.g. Dubai → ≈258.2°, New York → ≈58.5°, both consistent with published values).
- Device compass: standards-based `DeviceOrientationEvent` (no unmaintained third-party plugin, per
  the spec's own guidance) — reads `webkitCompassHeading` on iOS (already a true heading) or
  inverts `alpha` from an absolute orientation event on Android, with an explicit iOS
  permission-request gesture (`DeviceOrientationEvent.requestPermission()`) and a 2.5s
  no-events-received timeout that flips to an honest "compass unavailable" fallback state — shows
  the calculated bearing number and manual-alignment instructions instead of a broken/frozen
  compass.
- Premium circular compass UI: rotating rose with N/E/S/W, a 🕋 marker at the live bearing,
  numeric degree readout, and the exact required calibration hint ("Move your phone in a
  figure-eight motion...") shown after a few seconds of device-relative tracking.
- **Not verified:** an actual physical compass sensor reading (requires a real device — the bearing
  math and the "no sensor" fallback path are both independently correct and testable without one,
  but the live sensor path itself was not exercised on hardware).

**Status: LIVE** (bearing calculation), **NOT TESTABLE IN CURRENT ENVIRONMENT** (live device
compass reading).

## 14. Native Permissions

| Permission | Requested from | Android manifest | iOS Info.plist |
|---|---|---|---|
| Camera | Food Scanner → "Take Photo" | `CAMERA` (added) | `NSCameraUsageDescription` (added) |
| Photos | Food Scanner → "Choose From Gallery" | `READ_MEDIA_IMAGES`, `READ_EXTERNAL_STORAGE` (≤32) | `NSPhotoLibraryUsageDescription` (added) |
| Location | Prayer Times / Qibla → "Use My Location" | `ACCESS_FINE_LOCATION`/`ACCESS_COARSE_LOCATION` (added) | `NSLocationWhenInUseUsageDescription` (added) |
| Notifications | Settings → enabling a prayer reminder | `POST_NOTIFICATIONS` (auto, plugin manifest) | requested via `LocalNotifications.requestPermissions()` |

None are requested at app launch — confirmed by code review of every call site
(`requestDeviceLocation()`, `capturePhoto()`/`pickFromGallery()`, `requestNotificationPermission()`
— each is only invoked from an explicit button handler on its feature screen).

Camera/Geolocation manifest entries required manual research: Capacitor's newer plugins declare
their needed permissions via `@CapacitorPlugin(permissions = [...])` Kotlin annotations, which the
plugin uses internally to know what to request — but does **not** auto-inject a `<uses-permission>`
into the app's own manifest (confirmed by reading the Geolocation plugin's own error message and
its Kotlin source). This is a real, easy-to-miss gap that would have caused a silent runtime
permission-request failure; it's fixed, not just assumed.

**Status: LIVE** (manifests correct and validated by two successful Gradle builds against them).

## 15. Push / Local Notifications

- **Local (on-device):** Prayer reminders — fully implemented, see section 12.
- **Server-driven (push):** Consultation confirmation/reminder, membership renewal, reschedule
  notifications are **architecture-acknowledged but not implemented** — the spec explicitly asks to
  keep these systems separate from local prayer notifications and describes them as a "may later
  use a push provider" item, not a requirement for this pass. No push provider (FCM/APNs) was
  configured, and no server-side push-sending code was written. The existing email-confirmation
  flow (`consultationConfirmedClientEmail`/`consultationConfirmedAdminEmail`, from the booking
  system work) already covers the "user gets notified of a real booking" requirement today.

**Status: LIVE (local), NOT IMPLEMENTED (server push — explicitly out of scope for this pass,
documented rather than half-built).**

## 16. Performance

- Every new page is its own lazy-loaded route chunk (confirmed in the `npm run build` output:
  `FoodScannerPage` 20KB/6.4KB gzip, `SettingsPage` 14KB/4.8KB gzip, `use-resolved-location` split
  into its own 22KB/7.6KB gzip chunk since both Prayer Times and Qibla share it, etc.) — nothing new
  ships in the eager homepage bundle.
- `adhan` and `@capacitor/*` plugins only load as part of the routes that use them, same
  lazy-import pattern as the rest of the app.
- Food Scanner compresses images client-side (max 1024px, JPEG q=0.75, canvas re-encode) before
  upload — never sends a raw multi-megabyte camera file.
- Splash screen: `launchShowDuration: 400`ms, no spinner, no long intro animation, per the
  "app should open quickly" requirement.
- **Not measured:** actual cold-start time or bundle-download time on a real device (would need
  on-device profiling, not available here). The existing `index-*.js` chunk (694KB/209KB gzip) is a
  pre-existing condition, not introduced by this work, and applies identically to web and native.

**Status: LIVE (code-split correctly, verified by build output), NOT TESTABLE IN CURRENT
ENVIRONMENT (on-device performance profiling).**

## 17. Security

- Grep across `dist/`, `android/app/src/main/assets/public/`, and `capacitor.config.ts` for
  `GEMINI_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`,
  `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `RESEND_API_KEY` — **zero matches**. The one
  string-literal reference to `GEMINI_API_KEY` anywhere in `src/` is a code comment documenting the
  boundary, not a usage.
- All privileged operations (Gemini calls, Stripe secret operations, Google Calendar, email
  sending, booking RPCs) remain behind Supabase Edge Functions / `SECURITY DEFINER` Postgres
  functions — nothing new in this pass moved logic into the client.
- `food-scan`'s membership gate (when enabled) is enforced server-side against the real
  `subscriptions` table, not just a client-side UI hide — a direct API call without a valid session
  and active membership is rejected with 403, same pattern as the booking system's server-side
  enforcement.

**Status: LIVE** (verified by direct grep of built artifacts, not just code review).

## 18. Privacy

- `PrivacyPolicyPage` gained a new "Native App Permissions" section explaining Camera & Photos,
  Location (approximate), and Notifications in plain language, including the explicit commitments
  already required by the spec: location is never sent to Gemini, never sent to analytics, never
  associated with account/medical data, and food photos aren't stored unless the visitor explicitly
  saves that scan (see section 10's meal-history note).
- Settings' Privacy section surfaces current permission state (location source, notification
  status) and links straight to Privacy Policy and Medical Disclaimer.

**Status: LIVE.**

## 19. Medical Safety

- Unchanged core guardrails (AI Concierge's medical-escalation intent, membership/product
  disclaimers) — nothing in this pass touches them.
- Food Scanner: result screen is explicitly labeled **"Estimated Nutrition"**, carries the exact
  required disclaimer sentence, and the Edge Function's system prompt explicitly forbids diagnosis,
  medical-condition commentary, or medical advice — "stick to nutrition estimation only."
- "Ask AI About This Meal" routes through the same Gemini system prompt that already refuses
  diagnosis/prescription — no separate, unguarded path was created.

**Status: LIVE (guardrails present in code), IMPLEMENTED BUT REQUIRES CREDENTIALS (unverifiable
against a live model in this session, same as the rest of the AI Concierge).**

## 20. Test Results

**Verified in this session:**
- `npx tsc --noEmit` — 0 errors (run repeatedly across the session, most recently after every file
  in this report existed).
- `npm run lint` — 0 errors, 7 pre-existing unrelated warnings (`react-refresh/only-export-components`
  in shared UI/context files, not introduced by this work).
- `npm run build` — succeeds; every new page/feature confirmed as its own lazy chunk.
- `npm run build:knowledge` — succeeds, 89 knowledge items generated (up from 85).
- `npx cap sync` — succeeds for both `android` and `ios`, all 10 plugins registered on both
  platforms.
- **`cd android && ./gradlew assembleDebug` — `BUILD SUCCESSFUL`, three separate times**, most
  recently after every change in this report was in place, producing a real 12MB
  `app-debug.apk`.
- Prayer-time calculation and Qibla-bearing correctness independently verified via a standalone
  Node script against `adhan` directly (not just "it compiled").
- Repo-wide secret-leak grep across built web and Android bundles — clean.

**Not testable in this environment (explicitly, not glossed over):**
- Running the built APK on an Android emulator or physical device (no emulator/device available).
- Any iOS build, run, or test (no macOS/Xcode).
- Live Gemini responses (AI Concierge and Food Scanner) — no `GEMINI_API_KEY`, function not
  deployed, consistent with the existing `AI_CONCIERGE_IMPLEMENTATION_REPORT.md`.
- Live Stripe/Google Calendar/Meet flows from inside the native shell.
- Actual local-notification delivery, device compass sensor reading, camera/gallery permission
  prompts, and haptic feedback — all require a real device.
- The test matrix's explicit device-dependent items (section 62–65 of the request): Android
  home/navigation/login/etc. smoke test on an emulator, food-scanner image test set, prayer-time
  correctness across multiple real device timezones/DST, Qibla compass-supported-vs-unavailable on
  real hardware.

## 21. Missing Production Configuration

Everything already listed as missing in `AI_CONCIERGE_IMPLEMENTATION_REPORT.md` and
`CONSULTATION_BOOKING_SYSTEM_REPORT.md` still applies unchanged (`GEMINI_API_KEY`, Edge Function
deployment, Google Calendar secrets, etc.). Additional, mobile-specific gaps:

- **Android:** a real signing keystore + Play Console listing before a release (not debug) build
  can be produced/submitted; an Android emulator or physical device to actually run the built APK.
- **iOS:** a Mac with Xcode to open `ios/App/App.xcworkspace` (well, `.xcodeproj` — Capacitor 8 uses
  Swift Package Manager, not CocoaPods, for plugin dependencies here), resolve the Swift Package
  dependencies, and build/run; an Apple Developer account for provisioning, TestFlight, and App
  Store submission.
- **Universal/App Links:** `https://monzerallan.com/.well-known/assetlinks.json` (Android) and
  `apple-app-site-association` (iOS) must be hosted on the real domain, containing this app's real
  signing certificate fingerprints, before deep links / the Stripe-checkout return flow can
  automatically hand back into the app instead of staying in the in-app browser tab.
- **Store payment policy audit:** Apple/Google's current in-app purchase rules for
  membership/subscription sales were not reviewed in this session (no store console access) — do
  this before submission, as instructed.
- **Meal history:** no `meal_history` table/persistence was added (see section 10) — the spec
  frames this as optional for the initial version; add when ready.
- **Server-push notifications** (booking reminders, renewal) — no push provider configured (see
  section 15).

**Overall: the native app is not "live" in the sense of being installable from a store or running
Gemini/Stripe/Calendar for real** — but the Capacitor conversion itself, the Android build
pipeline, and every purely-client-side feature (navigation, membership display, Prayer Times,
Qibla, and the Food Scanner's full request/response wiring up to the Gemini call boundary) are
real, working, and verified against actual compilers and a real Gradle build — not just written
and assumed to work.

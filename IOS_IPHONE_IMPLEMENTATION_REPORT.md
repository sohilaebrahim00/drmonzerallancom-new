# iOS iPhone Implementation Report

Prepares the existing `ios/` Capacitor project to run the same native mobile app already built for
Android (`src/app-native/` — Home/Health/AI/Consultations/Account, no website chrome) on iPhone.
The website and Android app are unchanged. This was an audit-and-repair pass, not a rebuild: the
`ios/` scaffold from an earlier session was inspected in full, several real, concrete bugs were
found and fixed, and everything that genuinely requires a Mac, Apple Developer access, or a
physical device is labeled as such rather than glossed over.

**Status labels used below, exactly as required:** VERIFIED · IMPLEMENTED · REQUIRES MAC/XCODE ·
REQUIRES CREDENTIALS · REQUIRES PHYSICAL DEVICE · REQUIRES APPLE DEVELOPER ACCOUNT · NOT CONFIGURED

## Environment

**Windows.** No macOS, no Xcode, in this session. Per the standing instruction: nothing below claims
the app was compiled, no `.ipa` exists, no Xcode validation happened, and no physical/simulator
device test was performed. Everything that *can* be done safely on Windows — configuration, code,
asset generation, `cap sync`, security/privacy auditing — was done and verified as thoroughly as
this environment allows.

## iOS Project Status

The `ios/` project already existed (scaffolded in an earlier session via `npx cap add ios`) and was
**not regenerated** — it was audited file-by-file and repaired in place. Two real, concrete bugs
were found:

1. **`ios/App/CapApp-SPM/Package.swift` used Windows backslash path separators**
   (`path: "..\..\..\node_modules\@capacitor\app"`) for every local Swift Package dependency.
   Swift Package Manager requires POSIX forward slashes in these path strings on every platform —
   `Package.swift` is portable Swift source resolved by Xcode/SPM on macOS, and backslash is a
   Swift string-escape character there, not a path separator. **This would have failed to resolve
   package dependencies (likely a parse/build error) the first time this project was opened in
   Xcode.** Root cause: `npx cap sync ios`, run from Windows, regenerates this file using the host
   OS's path separator — a real bug in Capacitor CLI 8.5.0's cross-platform behavior, confirmed by
   re-running `cap sync ios` and watching it reproduce the same backslashes every time.
   **Fixed properly, not just patched once:** added `scripts/fix-ios-package-swift.cjs`, a small
   idempotent Node script that normalizes any backslash paths in `Package.swift` back to forward
   slashes after a sync. Wired into `package.json` as `npm run cap:sync:ios` (build → `cap sync ios`
   → fixup) and folded into the general `npm run cap:sync`. **Verified this session**: ran a fresh
   `cap sync ios`, confirmed the bug reproduced, ran the fixup, confirmed the paths were corrected
   (`../../../node_modules/@capacitor/app`), then ran the sync-with-fixup script again to confirm
   it's now the standard, repeatable path. VERIFIED.
2. **The bundled iOS web assets (`ios/App/App/public/`) were stale** — from before the native UX
   rebuild (`NATIVE_APP_UX_REBUILD_REPORT.md`). The folder still contained the *old*, since-deleted
   pages (`AIConciergePage`, `ExploreHubPage`, `MembershipHubPage`, `PrayerTimesPage`, `QiblaPage`,
   `FoodScannerPage`, `SettingsPage`) — `npx cap sync ios` had never been run since that rebuild
   (only `cap sync android` had). **Fixed**: ran `npm run build && npx cap sync ios`; confirmed the
   old page bundles are gone and the current `Native*` screen bundles (`NativeHome`, `NativeAI`,
   `NativeQibla`, etc.) are present. VERIFIED.

## Native UI

The iPhone build uses the exact same `src/app-native/` presentation layer as Android — same five
tabs (Home, Health, AI, Consultations, Account), same screens, same components. Nothing
iOS-specific was added to the React/TypeScript layer's *structure*; the differences that matter for
iOS are all in native configuration (safe areas, permissions, orientation — below) and in a couple
of platform-neutral bug fixes that happen to matter more on iOS (auth redirect origin, Qibla
heading — below) but apply identically to Android too. No website Navbar/Footer/hero renders inside
the app on either platform — unchanged from the prior pass. VERIFIED (by code review + a real
browser render at iPhone viewport dimensions, see "Safe Areas" below) / REQUIRES PHYSICAL DEVICE
(for final on-device confirmation).

## Bundle Identifier

**`com.monzerallan.app`** — confirmed identical across all four places that matter:
`capacitor.config.ts`'s `appId`, `ios/App/App.xcodeproj/project.pbxproj`'s
`PRODUCT_BUNDLE_IDENTIFIER` (both Debug and Release configurations), the `monzerallan://`
URL-scheme registration, and Android's `applicationId` (`android/app/build.gradle`). No
inconsistency found — no changes needed. VERIFIED.

## App Name

**"Monzer Allan"** — the existing configured name (`CFBundleDisplayName` in Info.plist,
`capacitor.config.ts`'s `appName`), matching Android's app name. Per this task's own instruction
("unless an existing approved app name already exists in configuration"), this was **not** changed
to "Dr. Monzer Allan" — it already exists and is already consistent everywhere. VERIFIED.

## App Icons

Single-universal 1024×1024 `AppIcon-512@2x.png`, referenced via the modern Xcode-14+
`Contents.json` format (`idiom: "universal"`, one slot, no missing sizes) — generated from the real
approved logo (`public/ma-logo.png`) via `capacitor-assets generate` in an earlier session, not a
Capacitor default. Confirmed no default/placeholder Capacitor icon exists anywhere in
`Assets.xcassets`. VERIFIED (file/config correctness) / REQUIRES MAC/XCODE (Xcode's own "no missing
icon slots" validation, which only runs inside Xcode itself).

## Splash Screen

`Assets.xcassets/Splash.imageset` contains real, logo-based images (light + dark variants,
1x/2x/3x) referenced correctly by `Base.lproj/LaunchScreen.storyboard`'s `imageView` (`image=
"Splash"`), with `systemBackgroundColor` behind it so it also respects the device's light/dark
setting. `capacitor.config.ts`'s `SplashScreen` plugin config sets a 400ms `launchShowDuration`, no
spinner — matches "quick transition, no fake loading delay." VERIFIED.

## Safe Areas & Orientation

- Audited every `position: fixed` element under `src/app-native/` (only two exist:
  `BottomNavigation` and the Drawer-based `NativeSheet`) — both already apply
  `env(safe-area-inset-bottom)` via the `native-safe-bottom` utility class (defined in
  `src/styles.css`, gated behind `viewport-fit=cover` in `index.html`, which was already set).
  `AppHeader` (used by every screen with a header) applies `native-safe-top`. No screen bypasses
  these primitives — they're the only way any native screen renders a header or bottom bar.
- **The one place a header AND a fixed composer AND a fixed tab bar all coexist** (the AI chat
  screen) was specifically re-verified empirically, not just by code review, because the layout math
  looked ambiguous on paper (a `flex-1` content region behind a `position: fixed` tab bar). Started
  a real dev server, rendered `/ai` in Playwright with an iPhone 14 Pro viewport/device profile
  (forcing the native tree on via the existing dev-only preview flag), and measured actual bounding
  boxes: the composer's bottom edge sits at y=591.7px, the tab bar's top edge at y=595px — **no
  overlap**, confirmed both by pixel measurement and visually in the captured screenshot. VERIFIED.
- **Portrait-only on iPhone**, changed this session (`Info.plist`'s `UISupportedInterfaceOrientations`
  reduced to Portrait only; iPad's orientation set left untouched since it isn't a primary target).
  The native shell's `h-dvh` fixed-viewport screens (chat, camera, compass) and the fixed bottom tab
  bar were built and tested for portrait only — allowing landscape would need its own layout pass
  that was never done, not just a permission flag. This also **structurally resolves** the Qibla
  compass's "orientation changes shouldn't invert the calculation" requirement (see below) — there's
  no orientation change to account for anymore. VERIFIED (config) / REQUIRES PHYSICAL DEVICE (final
  visual confirmation of every screen at real iPhone dimensions — the five requested widths
  (375–430px) were not individually screenshotted this session beyond the iPhone 14 Pro check above;
  the layout system (`AppScreen`'s `max-w-lg`/`max-w-xl` content constraints, flex-based rows) is the
  same one already verified across four Android viewport widths in the earlier native-UX-rebuild
  pass, so this is a low-risk carryover, not untested code — but it wasn't independently
  re-screenshotted at each iPhone size in this session).

## Permissions

| Permission | Requested from | Status |
|---|---|---|
| Camera | Food Scanner → "Take Photo" only | VERIFIED (copy updated to match required wording — see below) |
| Photo Library | Food Scanner → "Choose From Gallery" only | VERIFIED (copy updated) |
| Location (When In Use) | Prayer Times / Qibla → "Use My Location" only | VERIFIED (copy updated) |
| Notifications | Settings → enabling a specific prayer reminder only | VERIFIED |

`Info.plist` usage-description strings were updated to match this task's exact suggested copy
("Camera access is used to scan meals and estimate nutritional information." /
"Photo access lets you choose a meal image for nutritional analysis."). Confirmed by code review of
every call site (`requestDeviceLocation()`, `capturePhoto()`/`pickFromGallery()`,
`requestNotificationPermission()`) that none are ever called outside an explicit button handler on
their own feature screen — none at app launch. No `NSMotionUsageDescription` is declared or needed:
the Qibla compass uses the standards-based `DeviceOrientationEvent` web API (see below), which is a
WebKit-level JS permission prompt, not the native Core Motion framework that key covers.

## Camera (Food Scanner)

Unchanged architecture from the Android pass — `@capacitor/camera`'s `getPhoto()` with an explicit
`source` (Camera vs. Photos), client-side compression (max 1024px, JPEG q=0.75) before upload,
sends only the compressed image to the `food-scan` Edge Function. This is the same plugin/code path
on both platforms; the iOS-specific pieces (usage-description strings) are covered above.
IMPLEMENTED (shared code, already build-verified) / REQUIRES PHYSICAL DEVICE (actual camera
capture, permission prompt appearance, image quality).

## Location (Prayer Times + Qibla)

Same shared code path as Android (`@capacitor/geolocation`'s `getCurrentPosition()`, called once
per use, never `watchPosition()` — confirmed by code review, no background tracking anywhere).
IMPLEMENTED / REQUIRES PHYSICAL DEVICE.

## Qibla on iPhone

Specifically audited `src/hooks/use-compass-heading.ts` for iOS correctness (this code is shared
with Android, but iOS's compass-heading semantics genuinely differ):

- **Heading source**: on iOS, `event.webkitCompassHeading` (a Safari/WKWebView-only property) is
  used **directly, with no conversion** — Apple's own semantics already return a standard
  0–360°-clockwise-from-true-north value, exactly what the Qibla bearing calculation needs. This is
  different from the Android path (which inverts `alpha` from an *absolute* orientation event) —
  the code already branches correctly (`typeof event.webkitCompassHeading === "number"` is checked
  first, before falling back to the Android-style calculation), so no fix was needed here — this was
  a verification, not a bug. VERIFIED (by code review).
- **Permission**: `DeviceOrientationEvent.requestPermission` (the standard WebKit API for iOS
  13+) is correctly detected and gated behind an explicit user tap (`NativeQibla.tsx`'s "Enable
  Compass" button) — never called automatically. VERIFIED.
- **Rotation-direction / orientation-change correctness**: this was the one place genuine iOS-vs-
  Android nuance existed. `webkitCompassHeading` is well-defined for a fixed portrait interface
  orientation; the **portrait-only lock added this session removes the ambiguity entirely** — the
  interface can no longer rotate out from under the compass reading. VERIFIED (by the orientation
  fix above, not independently re-derived).
- **Fallback**: if no orientation event arrives within 2.5s, `supported` flips to `false` and the
  screen falls back to showing the calculated bearing number with manual-alignment instructions —
  never a frozen/fake compass. VERIFIED (by code review; this logic is platform-neutral).
- REQUIRES PHYSICAL DEVICE for an actual sensor reading — this cannot be verified in a browser or
  simulator (iOS Simulator has no real compass hardware).

## Prayer Times

Fully shared, platform-neutral code (`adhan` library, calculated entirely on-device, no Gemini
dependency) — independently verified via a direct Node script in the earlier Android-focused
session (Dubai/New York bearing spot-checks). Nothing iOS-specific to add here beyond the location
permission handling already covered above. VERIFIED.

## Local Notifications (Prayer Reminders)

Shared, platform-neutral architecture (`@capacitor/local-notifications`) — permission requested
only when a visitor enables a specific reminder toggle (never at launch, confirmed by code review of
`NativeNotificationSettings.tsx`/`NativePrayerTimes.tsx`), `rescheduleAllReminders()` always cancels
every previously-scheduled notification ID before rescheduling (preventing duplicates on iOS the
same way as Android), and relies on the OS's native local-notification scheduler
(`UNUserNotificationCenter` under the hood on iOS) for persistence across app restarts — that
persistence is inherent to how iOS local notifications work at the OS level, not something the app
needs extra code for. IMPLEMENTED (architecture) / REQUIRES PHYSICAL DEVICE (confirming an actual
notification fires at the scheduled time, survives a real device reboot).

## Consultation Notifications

Unchanged from prior reports — architecture-acknowledged, not implemented (booking-confirmation/
24h/1h reminders would need a push provider or additional local-notification scheduling tied to a
real confirmed appointment; out of scope for this iOS-configuration pass). NOT CONFIGURED.

## Supabase Auth on iOS

- Session storage: `@capacitor/preferences` (UserDefaults-backed on iOS) via the existing
  `nativeAuthStorage` adapter in `src/lib/supabase.ts`, generically gated by `isNativePlatform()` —
  already correct for iOS with no changes needed (this is Supabase's own documented guidance for
  Capacitor/React Native apps, not a Keychain-based approach — a reasonable, intentional choice,
  not a regression). VERIFIED (by code review).
- **A real bug was found and fixed**: `resetPasswordForEmail()` and `signInWithGoogle()` in
  `src/context/AuthContext.tsx` built their redirect URL from `window.location.origin`, which
  resolves to Capacitor's internal WebView origin on native (not a real, reachable address) — a
  password-reset email or Google OAuth callback generated from inside the native app would redirect
  to a URL that means nothing outside the app's own WebView. **Fixed**: added `authRedirectOrigin()`,
  which returns the real `https://monzerallan.com` (from `business.domain`) when
  `isNativePlatform()`, and keeps the existing `window.location.origin` behavior on web (unchanged).
  This fix lives in a shared file and applies identically to Android — verified Android still builds
  successfully after the change (`BUILD SUCCESSFUL`, confirmed this session).
- **Known, not-fixed-in-this-pass limitation, documented rather than hidden**: `signInWithGoogle()`'s
  full OAuth flow still has a deeper architectural gap on native even with the redirect-origin fix:
  Supabase's `signInWithOAuth()` navigates the *current* window to Google's consent page, and after
  consent, back to the redirect URL — inside a Capacitor WebView, that final redirect would navigate
  the app's own WebView away from the bundled app to the *live website* at `https://monzerallan.com`
  (a different origin/storage context from the app's local bundle), landing the visitor on the real
  website rendered inside the app shell rather than cleanly resuming the native screens. Properly
  fixing this needs either a custom-scheme redirect (`monzerallan://account`, requires adding it to
  Supabase's allowed redirect URLs) combined with `@capacitor/browser`'s in-app-browser +
  deep-link-callback pattern, or a native Google Sign-In SDK — genuinely more work than an iOS
  configuration pass, and email/password sign-in (the app's primary flow, no redirect involved at
  all) is unaffected. NOT CONFIGURED (Google OAuth on native specifically) — password-based
  auth (Sign In, Sign Up, Sign Out, session persistence, refresh, relaunch) is VERIFIED (by code
  review; same session-handling code already used and unaffected).
- REQUIRES PHYSICAL DEVICE for final confirmation of session persistence across a real app
  relaunch/backgrounding cycle.

## Gemini AI

Unchanged from `AI_CONCIERGE_IMPLEMENTATION_REPORT.md` — same full-screen `NativeAI` → `ChatBody` →
`ai-chat` Edge Function path on iOS as Android (platform-neutral code, no iOS branch needed).
`GEMINI_API_KEY` confirmed absent from the iOS project and bundled web assets (see Security Audit
below). **Not live** — no key configured, function not deployed, consistent with every prior report
in this engagement. The honest "temporarily unavailable" fallback state renders correctly (shared,
already-verified code). NOT CONFIGURED (Gemini live status) / VERIFIED (fallback behavior, security).

## Food Scanner + Gemini

Same `food-scan` Edge Function path as documented in `MOBILE_APP_IMPLEMENTATION_REPORT.md` — no
iOS-specific backend code exists or is needed (Gemini is only ever called from the Edge Function,
confirmed by repo-wide review, not from Swift or React). NOT CONFIGURED (live status, same
`GEMINI_API_KEY` gap) / VERIFIED (architecture, security).

## Consultation Booking

Fully shared, server-authoritative architecture (Postgres RPCs, real Google Calendar/Meet
integration) — nothing iOS-specific. Unchanged from `MOBILE_APP_IMPLEMENTATION_REPORT.md` and
`CONSULTATION_BOOKING_SYSTEM_REPORT.md`. NOT CONFIGURED (Google Calendar secrets, unchanged gap) /
VERIFIED (booking UI, credit-safety architecture).

## Google Meet

Existing `<a href={meetUrl} target="_blank">` links (in `MemberSummaryCard`, `NativeConsultations`,
`NativeBookConsultation`) were specifically re-examined against this task's preferred behavior
("open the installed Google Meet app where supported, otherwise the web URL") — and are **already
correct, not a bug**: letting Capacitor hand `target="_blank"` off to the real system Safari (rather
than routing through `@capacitor/browser`'s in-app `SFSafariViewController`, which is used
elsewhere for Stripe checkout) is what allows iOS's system-level Universal Link interception to
redirect to the installed Google Meet app before Safari even loads the page — an in-app
`SFSafariViewController` does not reliably participate in that OS-level handoff the same way a real
Safari window does. No code change made; this was an audit that confirmed the existing choice was
already the better one for this specific case. VERIFIED (by architecture review) / REQUIRES
PHYSICAL DEVICE (confirming the actual Meet-app handoff).

## External Links

- **Google Meet**: see above — VERIFIED (architecture).
- **`tel:`/`mailto:` links** (VIP hotline, Help & Support email): plain `href`, never intercepted by
  `target="_blank"` handling since they're not `http(s)` URLs — WKWebView delegates these straight
  to the OS (Phone.app/Mail.app) by default. VERIFIED (by code review).
- **WhatsApp** (`wa.me` links in Help & Support and product-inquiry flows): currently routed through
  `openExternal()` → `@capacitor/browser`'s in-app `SFSafariViewController`, the same helper used
  for Stripe checkout. Unlike Google Meet, it's genuinely uncertain without a physical device whether
  `SFSafariViewController` reliably hands off to an installed WhatsApp app the same way a full Safari
  window would — Apple's behavior here has evolved across iOS versions and isn't something safe to
  assume without testing. **Not changed speculatively** in this pass (changing the shared
  `openExternal()` helper to fix this could regress the intentionally-in-app Stripe checkout flow) —
  flagged as a specific, narrow, testable open question. REQUIRES PHYSICAL DEVICE.
- **Social links** (Instagram/Facebook/TikTok/YouTube): not currently surfaced anywhere in the
  native app at all (the native UX rebuild's Account/Settings screens don't include a social-links
  row — this is a pre-existing scope gap from that earlier pass, not something this iOS-configuration
  pass introduced or is meant to fix). NOT CONFIGURED.

## YouTube

Same `YouTubeEmbed` component (IFrame API, muted-autoplay-on-visible, single-active-player,
pause-out-of-view, mute toggle) used identically by `NativeVideos.tsx` on both platforms — already
verified for the equivalent behavior in the Android-focused session. No WKWebView-specific branch
exists or was found to be necessary by code review (the component is pure JS/iframe, not using any
native video API). VERIFIED (by code review, consistent with prior Android verification) / REQUIRES
PHYSICAL DEVICE (actual WKWebView playback/fullscreen/audio behavior).

## Keyboard Experience

`Keyboard.setResizeMode({ mode: KeyboardResize.Body })` is already configured platform-neutrally in
`src/native/bootstrap.ts` and `capacitor.config.ts`'s `Keyboard` plugin block (`resize: "body"`) —
applies to iOS identically to Android, no separate iOS keyboard configuration exists or is needed
for Capacitor's WKWebView keyboard handling. VERIFIED (config) / REQUIRES PHYSICAL DEVICE (actual
on-screen-keyboard behavior across Login/Join/AI composer/booking/food-result-editing/Account
forms — not independently re-tested on an iPhone-shaped viewport this session beyond the AI-screen
safe-area check above).

## Touch Experience

Unchanged, shared `AppScreen`/`BottomNavigation`/`NativeListRow`/`QuickAction` components — already
built with ≥44pt-equivalent touch targets (e.g. `BottomNavigation`'s `h-16` tab row, `QuickAction`'s
`py-4` tiles) in the native-UX-rebuild pass, verified there via Android-viewport screenshots. Not
independently re-verified at iPhone-specific dimensions this session. VERIFIED (carryover from prior
verified work) / REQUIRES PHYSICAL DEVICE.

## Haptics

Unchanged, shared `src/lib/haptics.ts` (`hapticSuccess()`/`hapticTap()`) via `@capacitor/haptics` —
same plugin, same calls, on both platforms; already wired to booking confirmation, successful food
scans, and bottom-nav taps in prior passes. VERIFIED (by code review) / REQUIRES PHYSICAL DEVICE
(subjective feel).

## iOS Settings (Account/Settings screen)

Same `NativeAccount`/`NativeNotificationSettings`/`NativePrayerSettings`/`NativeBilling`/
`NativeHelpSupport` screens as Android — no website settings pages render inside the native app on
either platform (confirmed unchanged by code review). VERIFIED.

## Stripe / Membership Payment

Architecture unchanged — `STRIPE_SECRET_KEY` confirmed absent from the iOS project and bundled web
assets (see Security Audit). **`IOS_PAYMENT_POLICY_REVIEW_REQUIRED`** — Apple's current App Store
Review Guidelines for this specific category of externally-billed membership/consultation service
were not reviewed in this session (no App Store Connect/Apple Developer access) — see
`IOS_APP_STORE_PREPARATION.md` for the explicit flag. Billing architecture was **not** changed in
this pass. REQUIRES APPLE DEVELOPER ACCOUNT.

## iOS Privacy

`Info.plist` usage-description strings updated (see Permissions above). A new "Native App
Permissions" section already exists in the website's Privacy Policy (added in the earlier
Android-focused pass) covering Camera/Photos/Location/Notifications in plain language — it wasn't
written iOS-vs-Android-specifically and already applies correctly to iOS without changes. VERIFIED.

## Privacy Manifest

Apple requires apps to declare "required reason" API usage. Audited: grepped the iOS Swift source
of **all 10 installed Capacitor plugins** (`app, browser, camera, geolocation, haptics, keyboard,
local-notifications, preferences, splash-screen, status-bar`) for Apple's documented required-reason
API signatures (`UserDefaults`, file-timestamp APIs, `systemUptime`/`mach_absolute_time`, disk-space
APIs). Result: only `@capacitor/preferences` uses one (`UserDefaults`, for on-device-only prefs —
onboarding-seen flag, prayer/reminder settings, and the native auth session store). Capacitor's own
core package (`@capacitor/ios`) already ships its own `PrivacyInfo.xcprivacy` (declares nothing —
empty, no tracking); none of the 10 individual plugin packages ship their own.

**Created** `ios/App/App/PrivacyInfo.xcprivacy` declaring `NSPrivacyAccessedAPICategoryUserDefaults`
with reason `CA92.1` ("access info from APIs used to read/write only this app's own data" — correct,
since Preferences never reads another app's UserDefaults suite). `NSPrivacyTracking: false`, empty
tracking-domains and collected-data-types arrays (first-party data collection is disclosed via the
App Store Connect questionnaire instead — see `IOS_APP_STORE_PREPARATION.md`).

**Not yet done**: adding this file as a build resource in the Xcode target (a `REQUIRES MAC/XCODE`
step — new files need to be added via Xcode's own project navigator so it correctly updates
`project.pbxproj`'s file references; this was deliberately not hand-spliced into the pbxproj text,
since a mistake there risks corrupting the whole Xcode project with no way to validate the edit in
this environment). This was a source-code audit, not a real Xcode "Privacy Report" build — re-run
Xcode's own Privacy Report before submission in case a future dependency update adds new
required-reason API usage. REQUIRES MAC/XCODE.

## Security Audit

Repo-wide grep across `ios/App/App` (native project files, excluding the bundled web build),
`ios/App/App/public` (the bundled web build itself), `dist/`, and `capacitor.config.ts` /
`ios/App/App/capacitor.config.json` for all seven forbidden strings: `GEMINI_API_KEY`,
`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_CLIENT_SECRET`,
`GOOGLE_REFRESH_TOKEN`, `RESEND_API_KEY`. **Zero matches everywhere.** Re-ran this check after the
final `cap sync ios` + `cap sync android` of this session to confirm the freshly-synced bundles are
also clean. The public Supabase URL/publishable key (by design, safe to ship) is the only Supabase
configuration present in the bundle. VERIFIED.

## Xcode Build

**REQUIRES MAC/XCODE.** No Xcode build was attempted or claimed. What was verified instead: the
Package.swift bug that would have broken dependency resolution is fixed (see above), the project's
build settings (bundle ID, deployment target, versioning, signing style) were read directly from
`project.pbxproj` and confirmed consistent, and the web asset bundle is current. None of this
substitutes for an actual `xcodebuild`/Xcode GUI build, which this environment cannot run.

## Simulator Testing

**REQUIRES MAC/XCODE.** Not performed — the iOS Simulator only runs on macOS.

## Physical iPhone Testing

**REQUIRES PHYSICAL DEVICE** (and REQUIRES MAC/XCODE to get a build onto one). Not performed. Every
item in this report tagged `REQUIRES PHYSICAL DEVICE` above needs this before being called
confirmed: camera/photo permission prompts, actual compass sensor readings, local notification
delivery and persistence across reboot, keyboard behavior, haptic feel, Google Meet/WhatsApp
external-app handoff, YouTube WKWebView playback, and session persistence across a real
background/terminate/relaunch cycle.

## App Store Preparation

See `IOS_APP_STORE_PREPARATION.md` for bundle ID, app name, permission copy, data-category
breakdown, and the explicit `IOS_PAYMENT_POLICY_REVIEW_REQUIRED` flag. Nothing was submitted to App
Store Connect — no access exists in this environment.

## Remaining Requirements

Exact Mac-side steps, in order, to take this from "configured" to "buildable":

1. **Clone/pull this repo onto a Mac** with Xcode installed (matching or newer than the
   `IPHONEOS_DEPLOYMENT_TARGET = 15.0` this project targets).
2. `npm install`
3. `npm run cap:sync:ios` (builds the web app, runs `cap sync ios`, and normalizes
   `Package.swift` — safe to run repeatedly; on macOS the fixup script is a documented no-op since
   the backslash bug is Windows-specific, but running it costs nothing).
4. Open `ios/App/App.xcodeproj` in Xcode (there is no `.xcworkspace` — this project uses Swift
   Package Manager for its Capacitor dependencies via `CapApp-SPM`, not CocoaPods, so the
   `.xcodeproj` is the correct, complete entry point).
5. Let Xcode resolve the Swift Package dependencies (should now succeed with the corrected
   `Package.swift` paths).
6. In the App target's **Signing & Capabilities** tab: select a Development Team, confirm/adjust
   the Bundle Identifier (`com.monzerallan.app`), and add the **Associated Domains** capability
   pointing at the already-prepared `ios/App/App/App.entitlements` (declares
   `applinks:monzerallan.com`) if Universal Links are wanted for this build.
7. Add `ios/App/App/PrivacyInfo.xcprivacy` to the App target as a resource (drag into the project
   navigator, ensure "Copy items if needed" + App target membership are checked).
8. Build for the iOS Simulator first (`Product → Build`, then `Product → Run`) — this is the
   fastest way to catch any remaining Xcode-only issues (missing icon slots, plist errors, etc.)
   without needing a physical device or provisioning profile.
9. Once the simulator build launches cleanly, connect a physical iPhone, select it as the run
   destination, and test the `REQUIRES PHYSICAL DEVICE` items listed throughout this report —
   camera, location/compass, notifications, keyboard, haptics, external-app handoffs.
10. Before archiving for TestFlight/App Store: complete the Apple App Store Review Guidelines
    payment-policy review flagged above (`IOS_PAYMENT_POLICY_REVIEW_REQUIRED`), host the real
    `apple-app-site-association` file if Universal Links are wanted live, and fill out the App Store
    Connect Privacy Nutrition Label questionnaire using `IOS_APP_STORE_PREPARATION.md` as source
    material.
11. `Product → Archive` → Organizer → Distribute App → App Store Connect → Upload → TestFlight, only
    once the above is complete. Nothing here should be automated or assumed "live" until each step
    is actually done and confirmed on the Mac doing it.

## Validation Run This Session

- `npx tsc --noEmit` — 0 errors.
- `npm run lint` — 0 errors, 7 pre-existing unrelated warnings.
- `npm run build` — succeeds.
- `npm run cap:sync:ios` (i.e. `npx cap sync ios` + the new Package.swift fixup) — succeeds; fixup
  confirmed necessary and effective on a fresh sync.
- `npx cap sync android` — succeeds, all 10 plugins still registered.
- `cd android && ./gradlew assembleDebug --no-daemon` — **`BUILD SUCCESSFUL`**, confirming this
  session's two shared-code changes (`AuthContext.tsx`'s redirect-origin fix, the AI Concierge
  platform-routing fix from earlier this session) did not regress Android.
- Repo-wide secret grep across `ios/`, `dist/`, and Capacitor config — clean.

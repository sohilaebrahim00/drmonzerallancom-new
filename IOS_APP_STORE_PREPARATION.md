# iOS App Store Preparation

Reference information for a future App Store Connect listing. **Nothing in this document was
submitted anywhere** — no App Store Connect access exists in this environment. This is preparation
only, per the standing instruction not to submit automatically.

## App Identity

| Field | Value | Source |
|---|---|---|
| App display name | **Monzer Allan** | `CFBundleDisplayName` (Info.plist) and `capacitor.config.ts`'s `appName` — this is the existing, already-configured/approved name (matches the Android app's display name too), kept as-is rather than changed to "Dr. Monzer Allan" |
| Bundle ID | **com.monzerallan.app** | `PRODUCT_BUNDLE_IDENTIFIER` in `ios/App/App.xcodeproj/project.pbxproj` (Debug + Release), `capacitor.config.ts`'s `appId` — matches Android's `applicationId` |
| Marketing Version | **1.0** | `MARKETING_VERSION` in project.pbxproj |
| Build Number | **1** | `CURRENT_PROJECT_VERSION` in project.pbxproj |
| Minimum iOS version | **15.0** | `IPHONEOS_DEPLOYMENT_TARGET` |
| Supported orientation (iPhone) | **Portrait only** | Set this session — see `IOS_IPHONE_IMPLEMENTATION_REPORT.md` §"Safe Areas & Orientation" |

## Permissions Used (and why)

| Permission | Info.plist key | Copy shown to user | Requested when |
|---|---|---|---|
| Camera | `NSCameraUsageDescription` | "Camera access is used to scan meals and estimate nutritional information." | Only when the visitor taps "Take Photo" on the Food Scanner screen |
| Photo Library | `NSPhotoLibraryUsageDescription` | "Photo access lets you choose a meal image for nutritional analysis." | Only when the visitor taps "Choose From Gallery" on the Food Scanner screen |
| Location (When In Use) | `NSLocationWhenInUseUsageDescription` | "Your location is used to calculate local prayer times and Qibla direction." | Only when the visitor taps "Use My Location" on the Prayer Times or Qibla screen |
| Notifications | (no Info.plist key — requested via `UNUserNotificationCenter` at runtime) | Standard system prompt | Only when the visitor enables a specific prayer reminder toggle in Settings |

None are requested at launch. "Always" location is never requested — only "When In Use". No
background location tracking exists anywhere in the codebase (confirmed by code review — location
is read once per feature use via `@capacitor/geolocation`'s `getCurrentPosition()`, never a
`watchPosition()` subscription).

## Data Categories (for the App Store Privacy Questionnaire)

This is a plain description of what the app actually does, for whoever fills out App Store
Connect's own Privacy Nutrition Label questionnaire (that questionnaire is the authoritative
disclosure mechanism — this table is prep material, not a submission):

| Data type | Collected? | Linked to identity? | Used for tracking? | Notes |
|---|---|---|---|---|
| Contact info (name, email, phone) | Yes | Yes | No | Account creation, membership, consultation booking — via Supabase Auth/Postgres |
| Health/nutrition data | Yes (optional) | Yes, if signed in | No | Only what the visitor voluntarily types into a consultation "reason" field or saves from a food scan — never diagnosis/lab data (explicitly discouraged in-product) |
| Photos | Yes (transient) | No, unless saved | No | A meal photo is compressed on-device and sent to the `food-scan` Edge Function for one-time analysis; not stored server-side unless the visitor explicitly chooses to save that scan (meal-history persistence itself is not yet implemented — see `MOBILE_APP_IMPLEMENTATION_REPORT.md`) |
| Precise location | Yes (transient) | No | No | Read once per Prayer Times/Qibla use, used only for the calculation, never transmitted to any backend or to Gemini, never stored beyond an optional manually-chosen city preference |
| Purchase history | Yes | Yes | No | Stripe handles payment; Supabase stores membership/subscription status only, never card details |
| User content (chat messages) | Yes | Yes, if signed in | No | Sent to the `ai-chat` Edge Function → Gemini for that single response; conversation history is kept client-side in memory only (not persisted server-side per message) |
| Identifiers (device/advertising ID) | No | — | — | Not collected — no analytics/ad SDKs are integrated |
| Usage/analytics data | No | — | — | No analytics SDK is integrated in this codebase |

**No tracking, no third-party advertising SDKs, no data sold or shared for advertising purposes.**

## Camera / Photos Purpose (App Store Connect "App Privacy" detail fields)

> The camera and photo library are used exclusively for the Food Scanner feature: the visitor
> photographs or selects an image of a meal, which is compressed on-device and analyzed by Gemini
> (via a secure backend function) to produce an *estimated* calorie and macronutrient breakdown.
> Photos are not stored on our servers unless the visitor explicitly saves that scan.

## Location Purpose

> Location is used only to calculate accurate local prayer times and the Qibla (direction to the
> Kaaba) for the visitor's current position. Location is read once per use, never tracked in the
> background, never sent to any third party (including our AI assistant), and never linked to
> medical/account data. Visitors who decline may instead pick a city manually.

## AI Feature Disclosure

> The app includes an AI Concierge (powered by Google's Gemini) that answers questions about
> memberships, products, services, blog content, and account/booking navigation using only real,
> verified content from the practice — it does not diagnose, prescribe, or provide personalized
> medical advice, and clearly redirects medical questions to a real consultation. **Status this
> session: not live** — no `GEMINI_API_KEY` is configured and the `ai-chat` Edge Function is not
> deployed from this environment (see `AI_CONCIERGE_IMPLEMENTATION_REPORT.md` for the full
> live-status checklist).

## Food Scanner Disclaimer

Shown verbatim on the result screen: *"Nutrition values are estimates based on the image and
visible portion size. Actual calories and nutrients can vary significantly depending on
ingredients, preparation method, and portion size."* The UI always says **"Estimated Nutrition,"**
never "Exact."

## Medical Disclaimer

The existing `/medical-disclaimer` page (reused as-is inside the native app, wrapped with a native
back header) states the app/AI does not diagnose, prescribe, or replace professional medical care.
The AI Concierge's system prompt enforces this at the model level too (see
`AI_CONCIERGE_IMPLEMENTATION_REPORT.md` §6).

## Membership / Payment Status

- Payments are processed via Stripe Checkout, opened through an in-app browser tab
  (`@capacitor/browser`) on native rather than navigating the app's own WebView away from itself.
  `STRIPE_SECRET_KEY` is never bundled — confirmed by grep of the built app and native project (see
  `IOS_IPHONE_IMPLEMENTATION_REPORT.md` §"Security Audit").
- **`IOS_PAYMENT_POLICY_REVIEW_REQUIRED`** — Apple's current App Store Review Guidelines (§3.1.1 and
  related) govern whether a membership/subscription sold outside Apple's in-app purchase system is
  permitted for this specific category of service (health/wellness consultations + physical
  nutrition products). This has **not** been reviewed against Apple's current guidelines in this
  session — no App Store Connect / Apple Developer access exists here, and app-review policy can
  change. This must be reviewed by someone with Developer Program access before submission; the
  existing billing architecture was **not** changed in this pass pending that review, per
  instruction.

## Deep Links

- Custom scheme: `monzerallan://` — registered in `Info.plist` (`CFBundleURLTypes`) and wired at
  the native layer (`SceneDelegate.swift` → Capacitor's `SceneDelegateProxy` → the `App` plugin's
  `appUrlOpen` event → `src/app-native/DeepLinkHandler.tsx`). Working today for in-app testing (web
  build), not yet verified on an actual iOS binary (no Xcode).

## Universal Links Status

**Not live.** Prepared, not completed:
- `ios/App/App/App.entitlements` created this session, declaring
  `com.apple.developer.associated-domains: applinks:monzerallan.com` — **not yet wired into the
  Xcode target** (adding the "Associated Domains" capability via Xcode's Signing & Capabilities tab
  is a `REQUIRES MAC/XCODE` step; the file was prepared but not spliced into `project.pbxproj` by
  hand, to avoid the real risk of corrupting the Xcode project file without any way to validate the
  edit in this environment).
- Requires a real `apple-app-site-association` file hosted at
  `https://monzerallan.com/.well-known/apple-app-site-association`, containing this app's Team ID +
  Bundle ID — `REQUIRES CREDENTIALS` (Apple Developer Team ID) and hosting access, neither available
  here.
- The Android equivalent (`autoVerify` App Links intent filter) has the identical gap, documented
  previously in `MOBILE_APP_IMPLEMENTATION_REPORT.md`.

## Privacy Manifest

`ios/App/App/PrivacyInfo.xcprivacy` created this session, declaring `NSPrivacyAccessedAPICategoryUserDefaults`
(reason `CA92.1`) — the only required-reason API found across all 10 installed Capacitor plugins by
source-grepping their iOS Swift code (see `IOS_IPHONE_IMPLEMENTATION_REPORT.md` §"Privacy
Manifest"). Not yet added as a build resource in the Xcode target — `REQUIRES MAC/XCODE`.

## What This Document Is Not

This is preparation material, not a completed store listing. Screenshots, promotional text,
keywords, support URL, marketing URL, age rating, and the App Store Connect privacy questionnaire
itself all still need to be completed directly in App Store Connect by someone with access.

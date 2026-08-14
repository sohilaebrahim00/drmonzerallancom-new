# AI Concierge Implementation Report

Real, Gemini-powered AI Concierge built to replace the previous quick-actions-only chat widget.
Verified end-to-end against the live Supabase project (`nkvycfmxabtwmoirrjxv.supabase.co`) this
session — the frontend correctly calls the real `functions/v1/ai-chat` endpoint and gracefully
falls back with an honest message, since the Edge Function itself has not been deployed yet (see
"Missing Configuration" and the live-status checklist in section 13 below). **Gemini has not been
called successfully in this session** — no `GEMINI_API_KEY` exists in this environment and the
function isn't deployed, so nothing here claims the AI is answering live questions today.

## 1. AI Chat UI Status

- Rewrote `src/components/chat/ChatWidget.tsx` into a real conversational interface, split across:
  - `ChatWidget.tsx` — always-eager launcher button + Popover (desktop) / lazy Drawer (mobile) shell.
  - `ChatBody.tsx` — the actual conversation (messages, input, quick actions) — **lazy-loaded**, only
    downloaded when a visitor opens the chat, so it never delays the homepage.
  - `MobileChatDrawer.tsx` — the vaul-based bottom-sheet wrapper — **also lazy-loaded**, so the
    drag/gesture library never ships to desktop visitors and never loads before first open.
- Preserved the brand: navy/turquoise gradient header, glass/blur panel, rounded corners, existing
  launcher button and pulse animation — nothing about the approved visual identity changed.
- Header reads "Monzer Allan" / "Virtual Assistant" with a small "AI ASSISTANT" pill — verified no
  forbidden labels ("Doctor AI", "Medical AI", "AI Physician") appear anywhere.
- Desktop: compact anchored panel (`24rem` wide, `32rem` tall). Mobile (<768px, via the existing
  `useIsMobile` hook): a near-full-width bottom sheet using the project's existing `Drawer`
  (vaul) component — verified via screenshot.
- States implemented and verified: quick-actions/greeting (empty state), user/assistant message
  bubbles with action-button chips, a "Thinking…" bubble while awaiting a response, an honest
  fallback bubble ("Our virtual assistant is temporarily unavailable…") with a Contact Team action
  on any failure, and a rate-limit-specific message on HTTP 429.
- Keyboard support verified: Escape closes the chat; Enter submits the input; quick-action buttons
  send their label as a real message through the same `handleSend` path (no separate fake response
  system).
- Page-aware greeting subtitle verified changing across `/packages`, `/products`, `/blog`, `/faq`,
  `/gallery`, and `/account` (with a distinct authenticated-vs-signed-out variant on `/account`).
- Quick actions updated to the required exact set: "Find the Right Membership," "Check
  Consultation Credits," "Request a Consultation," "Explore Products," "Ask About Nutrition
  Services," "Watch Educational Videos." Each sends its label as a real user message through the
  same `handleSend`/`sendChatMessage` path used for typed input — there is no separate hardcoded
  answer keyed off the button label, so these can never bypass Gemini.

## 2. Gemini Backend Status

- **Not deployed.** `supabase/functions/ai-chat/index.ts` is complete and ready to deploy with
  `supabase functions deploy ai-chat`, but no deployment happened this session (no Supabase CLI
  auth/link available, consistent with prior reports).
- Gemini is called exclusively from this Edge Function via `supabase/functions/_shared/gemini.ts`,
  using the raw REST `generateContent` endpoint — no Gemini SDK was added to the frontend or backend
  dependency tree.
- Model is never hardcoded inline: `getGeminiModel()` reads `GEMINI_MODEL`, falling back to one
  documented default constant (`DEFAULT_GEMINI_MODEL = "gemini-2.0-flash"`) defined in exactly one
  place.
- Verified (via a real network request against the live Supabase project) that the frontend calls
  `https://nkvycfmxabtwmoirrjxv.supabase.co/functions/v1/ai-chat` and correctly handles the
  "function doesn't exist yet" response by falling back to the honest unavailable-state message —
  proving the request wiring is correct even though the function itself isn't deployed.

## 3. Knowledge Sources Used

Nothing was hand-duplicated. `scripts/build-ai-knowledge.ts` (run via `npm run build:knowledge`)
imports the website's real source-of-truth files directly —

`src/data/packages.ts`, `src/data/products.ts` (via `getPublishedProducts()`), `src/data/services.ts`,
`src/data/faqs.ts`, `src/data/articles.ts`, `src/data/videos.ts`, `src/data/business.ts`,
`src/data/about.ts`

— and compiles them into `src/ai/knowledge/generated-knowledge.json` (85 items across the 12
categories: doctor, membership, packages, consultations, services, products, faq, blog, videos,
contact, navigation, policies). Re-run `npm run build:knowledge` any time these files change — the
AI's knowledge is only ever as current as the last generation, and package prices, product
availability, FAQ answers, etc. are pulled live from the real arrays (e.g. VIP Elite's 12 credits
comes from `VIP_ELITE_CONSULTATION_CREDITS` in `packages.ts`, not a copy).

This JSON is committed to the repo specifically because Deno Edge Functions cannot safely import
Vite-path-aliased or `import.meta.env`-dependent frontend modules — generating a plain JSON
artifact from the real data (in Node, where those work) and importing *that* into Deno was the
correct boundary, not a second hand-written copy.

## 4. Retrieval Strategy

`supabase/functions/_shared/knowledge-retrieval.ts` implements deterministic, keyword-based scoring
— no embeddings, no vector database, matching the guidance that the current content volume doesn't
need one:

- Each knowledge item scores against the current message (plus the last few turns of conversation,
  so follow-ups like "how many meetings?" after "tell me about Premium" still resolve) using keyword
  overlap, title-word overlap, and substring matches.
- Only the top 6 scoring items are sent to Gemini, plus two always-included baseline items (doctor
  profile, site navigation) so general questions never come back context-free — never the whole
  knowledge base.
- A character budget (4000 chars) caps the total context sent, trimming further even if 6 items
  would exceed it.
- `getKnownRoutes()` builds the action-route allowlist directly from every route referenced in the
  knowledge base plus the static top-level routes — this is what makes action validation possible
  (see Prompt-Injection Protection below).

## 5. Member-Aware Context

- The backend resolves the visitor's identity **only** from a verified Supabase access token
  (`supabaseAdmin.auth.getUser(token)`) read from the `Authorization` header — a `userId` sent in
  the request body would be, and is, ignored entirely.
- When authenticated, `getMemberContext()` queries `profiles` (first name only) and the visitor's
  own **active** `subscriptions` row (package, credit limit, credits used) via the service-role
  client — the same real tables the `/account` dashboard reads.
- If there's no active subscription, the context explicitly states "No active membership currently"
  so the model never fabricates a plan or credit balance.
- If the visitor isn't signed in at all, the context explicitly instructs the model not to claim any
  knowledge of membership, credits, or appointments.
- No passwords, tokens, payment details, or medical record content are ever sent to Gemini — only
  first name + package name + credit numbers.

## 5b. Booking Awareness (never invents a specific slot)

The system prompt was strengthened this session with two explicit rules, backed by the knowledge
base's `consultation-availability` item (which only ever describes the **standard recurring
schedule**, never a live slot):

- **Standard hours vs. real availability.** The model is told the doctor's standard hours
  (Asia/Dubai, Monday/Wednesday/Friday, 4:00 PM–9:00 PM, 48-hour minimum notice) are informational
  only — it must never state or imply that a specific date/time is currently open. Any "can I book
  X at Y" question gets an answer that frames those hours as *typical*, then routes the visitor to
  `/account/consultations` (the real, server-validated availability page) to see actual open slots
  and confirm — the same pattern verified in section 10 below.
- **Member-aware booking routing.** If a signed-in member with an active membership asks to book,
  the model is instructed to point them at "Request a Consultation" → `/account/consultations`. If
  they're not signed in, or signed in without an active membership, the model explains that online
  consultations require active membership and offers "View Memberships" / "Sign In" /
  "Create Account" actions instead of a booking link — matching the exact required phrasing
  ("Online consultations are available to active members.") that also lives in
  `consultationBookingService.ts` and `AccountConsultationsPage.tsx` for the real booking flow.
- `formatMemberContextBlock()` was strengthened alongside this: a not-signed-in visitor asking
  about their own credits/bookings is told to sign in first (with Sign In / View Memberships
  actions); a signed-in visitor with no active subscription is told membership is required (with a
  View Memberships action) rather than getting a generic non-answer.

## 6. Medical Safety Controls

- The system prompt explicitly forbids diagnosis, prescription, medication changes, emergency
  interpretation, and treats individualized medical questions by requiring `intent:
  "medical-escalation"` and `needsHuman: true`, redirecting to a real consultation or urgent care —
  never a personalized treatment answer.
- `"medical-escalation"` is a first-class value in the structured-output schema's `intent` enum, so
  this isn't just a prompt suggestion — it's part of the required response shape.
- The knowledge base itself carries the real policy text (membership/product disclaimers, "don't
  share detailed medical history in chat") as its own `policies` category, so the model has the
  actual approved disclaimer language available rather than inventing a paraphrase.
- **Not independently tested against live Gemini** in this session (no key configured) — the
  prompt and schema are ready, but actual model behavior on the test prompts specified (e.g. "my
  sugar is 350, what should I take?") has not been observed and is not claimed to be verified.

## 7. Prompt-Injection Protection

- User messages are placed only in the `contents` (user-turn) channel; the persona, rules, and
  knowledge context all live in Gemini's separate, higher-trust `systemInstruction` channel.
- The system prompt explicitly instructs the model to treat the knowledge/member-context blocks as
  data, never as instructions, and to decline (not comply with) any message attempting to reveal the
  system prompt, API keys, or "ignore previous instructions"-style overrides.
- Every response is required to be schema-validated JSON — free-form prose responses aren't
  possible, which by itself blocks most injection payloffs that rely on getting the model to emit
  arbitrary text/HTML/scripts.
- Every `action.route` returned by the model is checked against `getKnownRoutes()` server-side;
  anything not an exact match to a real route is silently dropped rather than rendered — the model
  cannot make the UI link anywhere that isn't a real, pre-existing page.
- Message length is capped at 1000 characters server-side (and 1000 client-side) regardless of what
  the client claims to send.

## 8. Rate Limiting

- In-memory sliding window in the Edge Function: max 12 requests per 60 seconds, keyed by the
  authenticated user id when signed in, or `x-forwarded-for` for anonymous visitors.
- Exceeding the limit returns HTTP 429 with the exact graceful message specified ("We're receiving a
  high number of requests right now. Please try again shortly.") — verified the frontend maps this
  status to that message rather than a raw error.
- This is an initial-implementation-appropriate limiter (resets on cold start, single-instance) —
  documented as such, same honest framing used for `contact-submit`'s existing rate limit.

## 9. Actions Supported — Platform-Aware Action Registry

The website and the native app now have genuinely different route trees for several concepts (e.g.
"book a consultation" is `/account/consultations` on web, `/consultations/book` on native; the AI
screen, Food Scanner, Prayer Times, and Qibla exist only on native; FAQ exists only on web). A prior
pass caught this as a residual gap (documented in `NATIVE_APP_UX_REBUILD_REPORT.md` §8) and worked
around it by simply removing the affected routes from the allowlist — safe, but it meant those
action buttons never appeared on either platform. This pass replaces that workaround with a proper
fix: a **central, platform-aware action registry**, `supabase/functions/_shared/actionRegistry.ts`.

**How it works:**
- The model no longer supplies a raw route for section-level navigation at all. It can only choose
  a named **concept** — `BOOK_CONSULTATION`, `VIEW_MEMBERSHIP`, `VIEW_PRODUCTS`, `OPEN_AI`,
  `VIEW_VIDEOS`, `VIEW_BLOG`, `OPEN_ACCOUNT`, `OPEN_FOOD_SCANNER`, `OPEN_PRAYER_TIMES`,
  `OPEN_QIBLA`, `VIEW_FAQ`, `SIGN_IN`, `CREATE_ACCOUNT`, or `CONTACT_TEAM` — and the registry alone
  resolves it to a real `{label, route}` pair for whichever platform actually made the request. The
  frontend (`aiChatService.sendChatMessage()`) sends `platform: "web" | "native"` (via
  `isNativePlatform()`) with every request; the Edge Function defaults to `"web"` (the more
  restrictive surface) if it's missing, so older cached frontend builds degrade safely.
- The response schema sent to Gemini is now **built per-request**: the `concept` field's enum is
  scoped to exactly the concepts that exist on the caller's platform
  (`getActionConceptsForPlatform(platform)`). This means Gemini is structurally incapable of
  emitting, say, `OPEN_FOOD_SCANNER` while answering a website visitor — the value simply isn't a
  legal enum member for that request. `validateAndSanitize()` re-resolves every concept through the
  registry server-side regardless, as defense in depth.
- A second, narrower action kind — `{ kind: "route", route, label }` — still exists for the small
  set of genuinely dynamic, per-item destinations that *are* identical on both platforms by
  construction: a specific product page (`/products/:slug`) or a specific blog article
  (`/blog/:slug`), taken only from a route explicitly present in that message's retrieved
  `WEBSITE KNOWLEDGE`. These are checked against `getKnownRoutes(platform)`, now itself
  platform-scoped (it no longer contains any of the section-level statics the registry replaced,
  e.g. `/packages`, `/faq`, `/contact`, `/account/consultations` — those are concept-only now).
- If a concept has no destination for the caller's platform, or the model names something outside
  either allowlist, the action is dropped silently — the answer text still renders normally, never
  a broken link. This satisfies the standing requirement to never render a dead CTA.
- The knowledge base (`scripts/build-ai-knowledge.ts`) was updated to remove `route` fields that
  the registry now owns (package/consultation/product-overview/FAQ/video/contact items), so there's
  exactly one place — the registry — that decides where each of these concepts actually goes.
  Regenerated: still 89 knowledge items (only `route` fields changed, not item count).

**Tested this session** (Gemini itself is still not deployed/configured — see §13 — so this
exercises the real, deterministic backend resolution logic directly rather than live model output):
a Node/tsx script fed simulated concept choices for the required phrases — "Book a consultation"
(`BOOK_CONSULTATION`), "Show my membership" (`VIEW_MEMBERSHIP`), "Show products" (`VIEW_PRODUCTS`),
"Open food scanner" (`OPEN_FOOD_SCANNER`), "Show prayer times" (`OPEN_PRAYER_TIMES`), "Open qibla"
(`OPEN_QIBLA`), "Show videos" (`VIEW_VIDEOS`) — through `sanitizeActions()` for both `"web"` and
`"native"`. All 7 resolved to the correct platform-specific `{label, route}` on their supported
platform(s); all 4 native-only concepts correctly produced zero actions (not a broken one) when
simulated on web. Additional checks: an invented concept (`DELETE_DATABASE`) resolves to nothing; an
unsupported concept forced onto the wrong platform is dropped even bypassing the schema-level enum
restriction (defense in depth); a `kind: "route"` action with an unknown path is dropped; the
existing 3-action cap still holds. 30/30 assertions passed. This was also verified as real,
non-Deno-specific TypeScript (not just tsx's type-stripping transpile) via a standalone `tsc` pass
against the three edited Edge Function files with a minimal Deno-global shim — 0 errors in any code
touched by this fix.

**Not tested:** actual Gemini model judgment (does it reliably pick `BOOK_CONSULTATION` unprompted
for "I want to see a doctor"?) — that requires a live, configured model, consistent with every other
capability in this report.

## 10. Tests Performed

**Verified in this session (real browser, real network calls against the live Supabase project):**
- Launcher renders immediately on page load, before any chat interaction.
- Chat opens with the correct greeting, quick actions, and "AI ASSISTANT" badge; no forbidden
  labels present.
- Escape key closes the chat.
- Clicking a quick action sends it as a real message, shows the loading state, and — since the
  function isn't deployed — correctly falls back to the honest "temporarily unavailable" message
  with a working "Contact Team" action, rather than a raw error or a fabricated answer.
- Manual text input + Enter-to-send works; user messages render correctly.
- Page-aware prompts verified changing across `/packages`, `/products`, `/blog`.
- No `GEMINI_API_KEY` string or Gemini-key-shaped pattern anywhere in the rendered page or the
  built `dist/` bundle.
- Mobile (390px): chat opens as a bottom-sheet Drawer with the same greeting/quick actions.
- Full regression sweep across 10 routes (`/`, `/about`, `/packages`, `/products`, `/blog`,
  `/gallery`, `/faq`, `/contact`, `/login`, `/join`) — no crashes.
- Zero horizontal overflow with the chat open at 1920/1440/1024/768/430/390/360px.
- Zero page errors across the entire run. The only console entries were the expected
  network/CORS failure from calling the not-yet-deployed function (evidence the real endpoint is
  being hit, not a bug) and the pre-existing, unrelated YouTube-player `compute-pressure` warning.

**This session (platform-aware action routing fix):**
- `npx tsc --noEmit` — 0 errors (frontend `src/`, including the updated `aiChatService.ts`).
- `npm run lint` — 0 errors, the same 7 pre-existing unrelated warnings.
- `npm run build` — succeeds.
- `npx cap sync android` — succeeds, all 10 plugins still registered (confirms the frontend
  `platform` field addition didn't disturb the native build).
- The three edited Edge Function files (`ai-chat/index.ts`, `_shared/knowledge-retrieval.ts`,
  `_shared/actionRegistry.ts`) additionally type-checked cleanly under a real `tsc` pass with a
  Deno-global shim — see §9 for detail. `supabase/functions/**` isn't in the frontend `tsconfig.json`
  (by design, consistent with the rest of this project), so this was a deliberate extra check, not
  something `npx tsc --noEmit` alone would have caught.

**Not yet performed (require a deployed function + configured `GEMINI_API_KEY`):**
- All 18 knowledge questions listed in the request (package prices, credits, stock status, contact,
  etc.) against a live Gemini response.
- The 4 medical-safety prompts (diagnosis/prescription refusal behavior).
- The 4 hallucination-resistance prompts (unconfigured hours/address/hotline/restock date).
- Authenticated member-context responses ("what membership do I have").

These cannot be honestly claimed as passing without a live model to test against — deploying the
function and configuring the secrets is the next step to run them for real.

## 11. Build Results

- `npx tsc --noEmit` — 0 errors.
- `npm run lint` — 0 errors, 7 pre-existing `react-refresh/only-export-components` warnings in
  shared UI/context files (unrelated).
- `npm run build` — succeeds. `ChatBody` (~7.5KB gzip 2.9KB) and `MobileChatDrawer` (~31KB gzip
  9.5KB, includes vaul) both confirmed as separate, lazy-loaded chunks — neither ships in the
  eager homepage bundle.
- `npm run build:knowledge` — succeeds, generates 89 knowledge items from real data (up from the
  original 85 — the app-features items added for Prayer Times/Qibla/Food Scanner, per
  `MOBILE_APP_IMPLEMENTATION_REPORT.md`; item count unchanged by this session's routing fix, only
  `route` fields on existing items were removed — see §9).
- Repo-wide grep for Gemini key patterns and the literal string `GEMINI_API_KEY` in `dist/` — no
  matches.

## 12. Missing Configuration

Server-side secrets required before the AI Concierge can answer real questions (names only):

- `GEMINI_API_KEY`
- `GEMINI_MODEL` (optional — documented default is used if unset)
- `SUPABASE_SERVICE_ROLE_KEY` (already required by other functions; also used here)

Also required before this is live:

- Deploy the function: `supabase functions deploy ai-chat`.
- Run `npm run build:knowledge` after any future change to packages/products/services/faqs/
  articles/videos/business/about data, and redeploy so the AI's knowledge stays current.
- Re-run the knowledge, medical-safety, and hallucination test prompts listed above against the
  deployed function before treating any of their behavior as confirmed.

## 13. Live-Status Checklist

Per the standing rule that Gemini must not be described as live until every one of the following
is independently true — checked honestly as of this session:

| # | Requirement | Status |
|---|---|---|
| 1 | `GEMINI_API_KEY` stored in Supabase Secrets | ❌ Not set — no access to the Supabase project's secret store from this session |
| 2 | `ai-chat` Edge Function deployed | ❌ Not deployed — no Supabase CLI auth/link available from this session |
| 3 | A real Gemini response succeeds | ❌ Not observed — no live call has been made |
| 4 | The production frontend successfully receives the response | ❌ Not observed (frontend correctly reaches the endpoint and handles the "not deployed" case, but no successful payload has ever been received) |
| 5 | No Gemini key appears in the browser bundle | ✅ Verified — repo-wide grep of `dist/` for `GEMINI_API_KEY` and Gemini-key-shaped patterns found no matches, and the key is referenced only in Deno Edge Function code, never in any `VITE_*` variable or frontend file |

**Result: 1 of 5 satisfied. The AI Concierge is not live** and this report does not claim otherwise.
Items 1–4 require access this session doesn't have: a Supabase project owner adding
`GEMINI_API_KEY` (and optionally `GEMINI_MODEL`) to the project's Edge Function secrets, then
running `supabase functions deploy ai-chat` (after `npm run build:knowledge` if any site data
changed). Once deployed and keyed, re-run the knowledge/medical-safety/hallucination/booking-
routing test prompts from section 10 against the real endpoint before treating any of them as
passing — nothing in this report substitutes for that live test pass.

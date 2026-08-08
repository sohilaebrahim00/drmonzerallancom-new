# Sold-Out Status & Authentication Report

## Sold Out

- All **27** products are marked `availability: "sold-out"` in `src/data/products.ts`. None are hidden — every product remains fully browsable in the catalog and on its detail page.
- **Card display** (`ProductCard.tsx`): a deep-navy "Sold Out" pill badge in the top-right corner of the image, over a category badge in the top-left. The purchase CTA is replaced with "Ask About Availability" (WhatsApp, or Contact page when WhatsApp isn't configured).
- **Detail page display** (`ProductDetailPage.tsx`): the same badge appears next to the product title, plus a disabled "Currently Sold Out" pill alongside an "Ask About Availability" button.
- **Disabled/replaced CTAs**: no purchase button is ever rendered for a sold-out item — it is structurally replaced, not just visually disabled, so there is no dead click target.
- The `restockDate?: string | null` field exists on every product (currently `null` for all) and is ready to display a real date once one is provided — no fake date has been invented.

## Authentication

- **Integration**: Supabase Auth via `@supabase/supabase-js`, configured in `src/lib/supabase.ts`. The client is `null` (and `isSupabaseConfigured` is `false`) whenever `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` are unset — every consuming page checks this and renders an honest "not connected yet" state instead of a broken or fake one.
- **Routes**:
  - `/login` — sign-in form; redirects to `/account` if already authenticated.
  - `/join` — membership package selection + lead form (name/email/phone/preferred contact method); redirects to Stripe Checkout (see `PAYMENTS_EMAIL_MEMBERSHIP_REPORT.md` — this is not a free-signup form).
  - `/forgot-password` — sends a reset email; neutral copy that doesn't confirm/deny whether an account exists (anti-enumeration).
  - `/reset-password` — sets a new password (used both for password resets and for the post-payment account-activation invite flow).
  - `/account` — protected via `<ProtectedRoute>`; redirects unauthenticated visitors to `/login`, verified via Playwright (`/account` while logged out → lands on `/login`).
- **Persistence**: handled entirely by the Supabase JS SDK (`persistSession: true`, `autoRefreshToken: true`) — this app never reads or writes auth tokens manually.
- **RLS status**: `supabase/schema.sql` defines RLS policies for `profiles`, `subscriptions`, `consultation_requests`, `membership_leads`, and `contact_inquiries`. Critically, **the client has no insert/update policy on `subscriptions`** — only a service-role Edge Function (the Stripe webhook) can grant or change membership status, so the frontend can never self-grant an active membership or consultation credits. This schema has **not been applied to a live Supabase project** — it must be run once in the Supabase SQL Editor (or via `supabase db push`).
- Nav (`Header.tsx`) is auth-aware: shows "Sign In" + "Create Account" when logged out, or a `<UserMenu>` (My Account / Book Consultation / Products / Sign Out) when logged in — verified on both desktop and mobile.

## Requires User Configuration

Set these once a real Supabase project exists (values only — never share the actual keys in chat, docs, or commits):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Then, in the Supabase Dashboard:

- Run `supabase/schema.sql` in the SQL Editor (or `supabase db push`) — this has not been executed against any live database.
- Enable Email auth (and optionally Google OAuth, since `signInWithGoogle` is already wired in `AuthContext`) under Authentication → Providers.
- Set the Site URL and redirect URLs (e.g. `https://monzerallan.com/reset-password`) under Authentication → URL Configuration, so password-reset and invite emails link back correctly.

No membership/auth system is claimed to be "live" — it is fully built and ready, pending the configuration above.

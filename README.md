# Monzer Allan — Nutrition, Health & Wellness

Production website for Dr. Monzer Allan (Nutrition Specialist & Pharmacist). A static React SPA — no server runtime — built for deployment on Hostinger shared hosting.

## Tech stack

- Vite + React + TypeScript
- React Router v6 (client-side routing, `BrowserRouter`)
- Tailwind CSS v4
- Framer Motion
- Radix UI primitives (via the local `src/components/ui` set)
- Lucide React icons

No server runtime, no file-based router, no Next.js/Remix/TanStack Start. The production build is a plain static `dist/` folder.

## Getting started

```bash
npm install
npm run dev        # start the dev server
npm run typecheck  # tsc --noEmit
npm run lint       # eslint src
npm run build      # production build → dist/
npm run preview    # preview the production build locally
```

## Environment variables

Copy `.env.example` to `.env.local` and fill in real values. Vite only exposes variables prefixed with `VITE_` to the client bundle — **never put a private/secret API key in a `VITE_*` variable**, since anything with that prefix ships in the public JS bundle and is visible to anyone who opens dev tools.

| Variable | Purpose | Where it's used |
|---|---|---|
| `VITE_WHATSAPP_NUMBER` | WhatsApp number in international format: digits only, no `+`, spaces, brackets, or leading zero (e.g. `15551234567`). | `src/config/contact.ts` — powers every WhatsApp deep link (chat widget, product inquiries, package inquiries, contact fallback). If unset, WhatsApp actions hide themselves and fall back to the Contact page. |
| `VITE_GOOGLE_BOOKING_BASIC_URL` | The Google Calendar Appointment Schedule embed/share link for the **Basic** package. | `src/config/booking.ts` → embedded in `/booking?package=basic`. |
| `VITE_GOOGLE_BOOKING_PREMIUM_URL` | Same, for **Premium**. | `/booking?package=premium`. |
| `VITE_GOOGLE_BOOKING_VIP_URL` | Same, for **VIP Elite**. | `/booking?package=vip-elite`. |

Any variable left blank degrades gracefully — the relevant UI shows a "not yet configured" state with a working fallback (WhatsApp / Contact page / Return to Packages), never a broken button, empty calendar, or fake success screen.

### Setting up a Google Calendar Appointment Schedule

1. In Google Calendar, create an **Appointment schedule** for each package (Basic / Premium / VIP Elite), each with its own minimum-notice and buffer settings matching the package's booking rule (3 days / 2 days / same-day).
2. Set the schedule's location/conferencing to **Google Meet**.
3. Use the schedule's booking page link (or its embeddable link) as the corresponding `VITE_GOOGLE_BOOKING_*_URL`.
4. Google handles real availability, double-booking prevention, and the buffer between sessions natively — this site only embeds the schedule, it does not re-implement any of that logic.

## Business information

All editable business/contact facts live in **`src/data/business.ts`** (`Business` interface). Every contact field (`phone`, `email`, `fullAddress`, `officeHours`, `googleMapsUrl`, `timeZone`) is optional on purpose: nothing is invented. Every consumer checks for presence and hides the corresponding row/icon/link gracefully when a field is unset — fill in real values there and the UI picks them up everywhere automatically (Footer, Contact section, legal pages, JSON-LD).

`instagram` is already populated with the real, previously-approved handle — that one's confirmed, not a placeholder.

## Products

Product data lives in **`src/data/products.ts`**. Each entry has a `published: boolean` — only published products render anywhere (grid, detail route, sitemap). To publish a product:

1. Confirm you have the right to reuse the supplier's images commercially.
2. Save optimized images to `public/images/products/` (e.g. `product-1-main.webp`, `product-1-gallery-1.webp`).
3. Fill in the real name, category, descriptions, highlights, and specifications.
4. Set `mainImage`/`gallery` to the corresponding `/images/products/...` paths and flip `published` to `true`.

Product ordering is WhatsApp-based for this release (`src/config/commerce.ts` builds the prefilled inquiry/order messages). An optional `stripePaymentLink` field exists on both products and packages for later Stripe Checkout integration — leave it unset until a real Payment Link exists.

## Testimonials & before/after content

`src/data/testimonials.ts` and `src/data/transformations.ts` are intentionally empty. Both sections (`Testimonials.tsx`, `BeforeAfter.tsx`) hide themselves automatically while their data arrays are empty — no fabricated reviews or results are ever shown. Add real, consented entries to bring a section back online; no other file needs to change. Before/after content specifically requires explicit, documented patient consent before publishing.

## Contact form

`src/services/contactService.ts` isolates the "submit" logic so a real backend (Resend, Formspree, Web3Forms, or a Hostinger-side script) can be dropped in later without touching the form UI. Until then, it hands the visitor off to a real channel — their email client (if `business.email` is set) or WhatsApp (if configured) — and never claims a message was received when it wasn't.

## Deployment (Hostinger)

1. `npm run build`
2. Upload the contents of `dist/` (including the hidden `.htaccess` file) to your Hostinger `public_html` (or the relevant subdirectory).
3. `.htaccess` handles SPA fallback routing (so refreshing `/products/some-slug` or any nested route works) plus gzip/caching headers.
4. Set your real `.env.local` values **before** running `npm run build` — env vars are baked into the build at build time, not read at runtime.

## Project structure

```
src/
  components/    UI, layout, section, and feature components
  config/        env-driven configuration (contact, booking, commerce)
  data/          editable content (business info, services, packages, products, articles, …)
  lib/           schema.org builders, small utilities
  pages/         route-level components
  services/      isolated integration seams (contact form submission)
public/          static assets, .htaccess, robots.txt, sitemap.xml
```

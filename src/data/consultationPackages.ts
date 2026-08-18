// One-time, pay-per-consultation packages — distinct from the recurring
// monthly membership tiers in src/data/packages.ts. A purchase here grants a
// fixed number of consultation credits once (no recurring billing) and reuses
// the exact same subscriptions/credits/booking system memberships already
// use (see supabase/PHASE_I_CONSULTATION_PACKAGES_PAYMENTS_MIGRATION.sql for
// how that reuse is modeled) — so booking, credit tracking, and the Account
// Consultations page all work for these buyers with no separate code path.
//
// `stripeProductId` is documentation/reference only — the browser never
// sends it to Stripe. The real, trusted mapping lives server-side in
// supabase/functions/create-consultation-checkout-session (env vars
// STRIPE_PRODUCT_SINGLE / STRIPE_PRODUCT_DOUBLE), keyed off `slug`, so a
// tampered client request can never change what a customer is charged.
export type ConsultationPackageSlug = "single_consultation" | "double_consultation";

export interface ConsultationPackage {
  slug: ConsultationPackageSlug;
  name: string;
  tagline: string;
  price: number;
  priceLabel: string;
  credits: number;
  callDurationMinutes: number;
  features: string[];
  cta: string;
  popular?: boolean;
  /** Reference only — see file header. Real Stripe live-mode product id. */
  stripeProductId: string;
}

export const consultationPackages: ConsultationPackage[] = [
  {
    slug: "single_consultation",
    name: "Single Consultation",
    tagline: "One focused session, no membership required",
    price: 49,
    priceLabel: "$49",
    credits: 1,
    callDurationMinutes: 20,
    features: [
      "20-minute consultation",
      "1 consultation credit",
      "Online via Google Meet",
      "No recurring billing",
    ],
    cta: "Book Single Consultation",
    stripeProductId: "prod_V65LDqOWTMszsA",
  },
  {
    slug: "double_consultation",
    name: "Double Consultation",
    tagline: "A follow-up included, at a better rate",
    price: 119,
    priceLabel: "$119",
    credits: 2,
    callDurationMinutes: 20,
    features: [
      "Two 20-minute consultations",
      "2 consultation credits",
      "Online via Google Meet",
      "Ideal for an initial session plus a follow-up",
      "No recurring billing",
    ],
    cta: "Book Double Consultation",
    popular: true,
    stripeProductId: "prod_V65LiK6qbXvnqy",
  },
];

export const consultationPackageDisclaimer =
  "Pay-per-consultation credits do not expire on a monthly cycle like membership credits, but are tied to your account and are non-transferable. Nutrition services are educational and supportive in nature and are not a replacement for emergency care, medical diagnosis, or treatment from a licensed physician.";

export function getConsultationPackageBySlug(slug: string | null | undefined) {
  return consultationPackages.find((pkg) => pkg.slug === slug);
}

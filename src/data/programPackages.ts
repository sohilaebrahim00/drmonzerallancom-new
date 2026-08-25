// One-time program packages — Diet (weight-loss/nutrition) and Treatment,
// each with 3 tiers (Basic/Plus/Premium) differentiated purely by how many
// doctor consultations are included. Replaces the earlier flat
// Single/Double Consultation model. Distinct from the recurring monthly
// membership tiers in src/data/packages.ts.
//
// A purchase here grants a fixed number of consultation credits once (no
// recurring billing) and reuses the exact same subscriptions/credits/booking
// system memberships already use (see
// supabase/PHASE_I_CONSULTATION_PACKAGES_PAYMENTS_MIGRATION.sql for how that
// reuse is modeled) — so booking, credit tracking, and the Account
// Consultations page all work for these buyers with no separate code path.
//
// `stripeProductId` is documentation/reference only — the browser never
// sends it to Stripe. The real, trusted mapping lives server-side in
// supabase/functions/create-consultation-checkout-session (env vars
// STRIPE_PRODUCT_DIET_BASIC / _DIET_PLUS / _DIET_PREMIUM /
// _TREATMENT_BASIC / _TREATMENT_PLUS / _TREATMENT_PREMIUM), keyed off
// `slug`, so a tampered client request can never change what a customer is
// charged. These 6 products haven't been created in Stripe yet — left
// undefined here until you have real ids; the checkout flow degrades
// gracefully ("isn't available yet") until the matching secret is set.
export type ProgramPackageType = "diet" | "treatment";
export type ProgramPackageTier = "basic" | "plus" | "premium";

export type ProgramPackageSlug =
  | "diet_basic"
  | "diet_plus"
  | "diet_premium"
  | "treatment_basic"
  | "treatment_plus"
  | "treatment_premium";

export interface ProgramPackage {
  slug: ProgramPackageSlug;
  packageType: ProgramPackageType;
  tier: ProgramPackageTier;
  name: string;
  tagline: string;
  price: number;
  priceLabel: string;
  /**
   * Also the number of consultation credits granted on purchase.
   * Raised by one across every tier on 22 Aug 2026 (Phase 2.5.5). The
   * matching server-side values live in create-consultation-checkout-session
   * (PACKAGES.consultationCount) and stripe-webhook
   * (CONSULTATION_PACKAGE_INFO.creditLimit / .consultationCount), and the
   * payments.consultation_count check constraint had to be widened to 4 —
   * see PHASE_J_FIXES_MIGRATION.sql J.12.
   */
  consultationCount: 2 | 3 | 4;
  features: string[];
  cta: string;
  popular?: boolean;
  /** Reference only — see file header. Not yet created in Stripe. */
  stripeProductId?: string;
}

export const programPackages: ProgramPackage[] = [
  {
    slug: "diet_basic",
    packageType: "diet",
    tier: "basic",
    name: "Diet Basic",
    tagline: "Start your nutrition program with expert guidance",
    price: 49,
    priceLabel: "$49",
    consultationCount: 2,
    features: ["Nutrition program", "2 doctor consultations", "Monthly follow-up"],
    cta: "Start Your Program",
  },
  {
    slug: "diet_plus",
    packageType: "diet",
    tier: "plus",
    name: "Diet Plus",
    tagline: "More check-ins to keep your program on track",
    price: 89,
    priceLabel: "$89",
    consultationCount: 3,
    features: ["Nutrition program", "3 doctor consultations", "Monthly follow-up"],
    cta: "Start Your Program",
    popular: true,
  },
  {
    slug: "diet_premium",
    packageType: "diet",
    tier: "premium",
    name: "Diet Premium",
    tagline: "The most guided path to your goal",
    price: 119,
    priceLabel: "$119",
    consultationCount: 4,
    features: ["Nutrition program", "4 doctor consultations", "Monthly follow-up"],
    cta: "Start Your Program",
  },
  {
    slug: "treatment_basic",
    packageType: "treatment",
    tier: "basic",
    name: "Treatment Basic",
    tagline: "Begin your treatment plan with a first consultation",
    price: 119,
    priceLabel: "$119",
    consultationCount: 2,
    features: ["Treatment plan", "2 doctor consultations"],
    cta: "Start Your Program",
  },
  {
    slug: "treatment_plus",
    packageType: "treatment",
    tier: "plus",
    name: "Treatment Plus",
    tagline: "Closer follow-up through your treatment plan",
    price: 169,
    priceLabel: "$169",
    consultationCount: 3,
    features: ["Treatment plan", "3 doctor consultations"],
    cta: "Start Your Program",
    popular: true,
  },
  {
    slug: "treatment_premium",
    packageType: "treatment",
    tier: "premium",
    name: "Treatment Premium",
    tagline: "The closest level of medical follow-up available",
    price: 199,
    priceLabel: "$199",
    consultationCount: 4,
    features: ["Treatment plan", "4 doctor consultations"],
    cta: "Start Your Program",
  },
];

export const programPackageDisclaimer =
  "Program credits do not expire on a monthly cycle like membership credits, but are tied to your account and are non-transferable. Nutrition and treatment programs are educational and supportive in nature and are not a replacement for emergency care, medical diagnosis, or treatment from a licensed physician. Treatment programs include a maximum of 4 consultations.";

export function getProgramPackageBySlug(slug: string | null | undefined) {
  return programPackages.find((pkg) => pkg.slug === slug);
}

export function getProgramPackagesByType(type: ProgramPackageType) {
  return programPackages.filter((pkg) => pkg.packageType === type);
}

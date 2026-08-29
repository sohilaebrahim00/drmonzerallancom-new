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
   * A previous price, shown struck through beside the current one.
   *
   * PRESENTATIONAL ONLY. It is never sent to the server, never reaches
   * Stripe, and has no counterpart in the Edge Function's PACKAGES map — the
   * amount charged is `amountCents` there and nothing else. Setting or
   * changing this cannot alter what a customer pays.
   */
  previousPrice?: number;
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
  /**
   * Whether this package can still be BOUGHT. Not whether it exists.
   *
   * ── READ THIS BEFORE DELETING THE DIET ENTRIES ──────────────────────
   * The three diet_* packages were withdrawn from sale in Phase 7. They are
   * still here on purpose, and removing them would break paying customers:
   *
   *   • getProgramPackageBySlug() turns a stored subscriptions.package_id
   *     into a display name. Every Diet customer's Account page, the doctor's
   *     subscriber list and the consultations page all call it. Delete the
   *     entry and their package renders blank.
   *   • The Stripe webhook still has to resolve a Diet slug — a replayed or
   *     in-flight event must not fail.
   *
   * Withdrawing a product from sale and deleting it from the system are
   * different operations. This flag is the first one. Only the storefront
   * reads it; every lookup path ignores it by design.
   */
  availableForPurchase: boolean;
}

export const programPackages: ProgramPackage[] = [
  {
    slug: "diet_basic",
    availableForPurchase: false,
    packageType: "diet",
    tier: "basic",
    name: "Diet Basic",
    tagline: "Start your nutrition program with expert guidance",
    price: 40,
    priceLabel: "$40",
    consultationCount: 2,
    features: ["Nutrition program", "2 doctor consultations", "Monthly follow-up"],
    cta: "Start Your Program",
  },
  {
    slug: "diet_plus",
    availableForPurchase: false,
    packageType: "diet",
    tier: "plus",
    name: "Diet Plus",
    tagline: "More check-ins to keep your program on track",
    price: 69,
    priceLabel: "$69",
    consultationCount: 3,
    features: ["Nutrition program", "3 doctor consultations", "Monthly follow-up"],
    cta: "Start Your Program",
    popular: true,
  },
  {
    slug: "diet_premium",
    availableForPurchase: false,
    packageType: "diet",
    tier: "premium",
    name: "Diet Premium",
    tagline: "The most guided path to your goal",
    price: 89,
    priceLabel: "$89",
    consultationCount: 4,
    features: ["Nutrition program", "4 doctor consultations", "Monthly follow-up"],
    cta: "Start Your Program",
  },
  {
    slug: "treatment_basic",
    availableForPurchase: true,
    packageType: "treatment",
    tier: "basic",
    name: "Treatment Basic",
    tagline: "Begin your treatment plan with a first consultation",
    price: 119,
    priceLabel: "$119",
    previousPrice: 200,
    consultationCount: 2,
    features: ["Treatment plan", "2 doctor consultations"],
    cta: "Start Your Program",
  },
  {
    slug: "treatment_plus",
    availableForPurchase: true,
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
    availableForPurchase: true,
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

/**
 * Shown under the storefront. Describes what is actually on sale — Treatment
 * programs — while keeping the medical-disclaimer sentence word for word. The
 * "nutrition" wording went with the Diet tiers; the safety language did not.
 */
export const programPackageDisclaimer =
  "Program credits do not expire on a monthly cycle like membership credits, but are tied to your account and are non-transferable. Treatment programs are educational and supportive in nature and are not a replacement for emergency care, medical diagnosis, or treatment from a licensed physician. Treatment programs include a maximum of 4 consultations.";

export function getProgramPackageBySlug(slug: string | null | undefined) {
  return programPackages.find((pkg) => pkg.slug === slug);
}

/**
 * ALL packages of a type, sold or not. Left as-is deliberately: it is a plain
 * data accessor, and silently teaching it to hide withdrawn packages would
 * make it lie to any future caller that legitimately wants the full set (an
 * admin view, a report, a historical lookup).
 *
 * The storefront filter is explicit at the call site instead — see
 * purchasableProgramPackages below — so "what we sell" is visible in the code
 * that sells it rather than buried in a shared helper.
 */
export function getProgramPackagesByType(type: ProgramPackageType) {
  return programPackages.filter((pkg) => pkg.packageType === type);
}

/**
 * The only list the storefront may offer. Anywhere the site invites a visitor
 * to BUY, it reads this; anywhere it names something already bought, it reads
 * getProgramPackageBySlug instead.
 */
export const purchasableProgramPackages = programPackages.filter((pkg) => pkg.availableForPurchase);

/** Purchasable packages of one type. Empty array if that whole type is withdrawn. */
export function getPurchasablePackagesByType(type: ProgramPackageType) {
  return purchasableProgramPackages.filter((pkg) => pkg.packageType === type);
}

/** Types that still have something to sell — drives the storefront's tab strip. */
export function purchasableProgramTypes(): ProgramPackageType[] {
  return [...new Set(purchasableProgramPackages.map((pkg) => pkg.packageType))];
}

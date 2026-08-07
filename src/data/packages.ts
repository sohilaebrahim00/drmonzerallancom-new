import type { PackageSlug } from "@/config/booking";

export interface ComparisonRow {
  label: string;
  basic: string;
  premium: string;
  vipElite: string;
}

/** Single source of truth for the VIP Elite credit count — change only here. */
export const VIP_ELITE_CONSULTATION_CREDITS = 12;

export interface PackageTier {
  slug: PackageSlug;
  name: string;
  tagline: string;
  /** Current promotional monthly price. */
  price: number;
  /** Crossed-out comparison price shown alongside the promo price. */
  originalPrice: number;
  priceLabel: string;
  consultationCredits: number;
  badge?: string;
  popular?: boolean;
  vip?: boolean;
  hotline?: boolean;
  features: string[];
  cta: string;
  /** Optional Stripe Payment Link for recurring billing. Leave unset until a real link exists. */
  stripePaymentLink?: string;
}

export const packages: PackageTier[] = [
  {
    slug: "basic",
    name: "Basic",
    tagline: "A focused introduction to guided nutrition",
    price: 29,
    originalPrice: 58,
    priceLabel: "$29 / Month",
    consultationCredits: 1,
    features: [
      "Personalized nutrition plan",
      "Health-focused follow-up based on the client's condition and goals",
      "1 consultation credit per month",
      "Google Meet consultation booked at least three days in advance",
      "One nutrition plan adjustment per month",
      "Member account access",
    ],
    cta: "Join Basic",
  },
  {
    slug: "premium",
    name: "Premium",
    tagline: "Structured guidance with real accountability",
    price: 61,
    originalPrice: 122,
    priceLabel: "$61 / Month",
    consultationCredits: 3,
    badge: "Most Popular",
    popular: true,
    features: [
      "Everything included in Basic",
      "3 consultation credits per month",
      "Priority scheduling",
      "Two nutrition plan adjustments per month",
      "Basic review of laboratory results",
      "Faster inquiry response",
      "Exclusive nutrition resources",
      "Member account access",
    ],
    cta: "Choose Premium",
  },
  {
    slug: "vip-elite",
    name: "VIP Elite",
    tagline: "White-glove nutrition care, fully personalized",
    price: 103,
    originalPrice: 206,
    priceLabel: "$103 / Month",
    consultationCredits: VIP_ELITE_CONSULTATION_CREDITS,
    badge: "VIP",
    vip: true,
    hotline: true,
    features: [
      "Everything included in Premium",
      `${VIP_ELITE_CONSULTATION_CREDITS} consultation credits per month`,
      "Highest booking priority",
      "Same-day consultation requests when availability permits",
      "Unlimited nutrition plan adjustments, per plan policy",
      "Detailed review of laboratory results",
      "Highest-priority responses",
      "Intensive health follow-up",
      "Priority Hotline access",
      "Member account access",
    ],
    cta: "Join VIP Elite",
  },
];

export const packageDisclaimer =
  "Nutrition services are educational and supportive in nature and are not a replacement for emergency care, medical diagnosis, or treatment from a licensed physician. Laboratory review does not constitute a medical diagnosis. Membership pricing and consultation credits are set by the current promotion and may change.";

export const comparisonRows: ComparisonRow[] = [
  {
    label: "Monthly price",
    basic: "$29 (was $58)",
    premium: "$61 (was $122)",
    vipElite: "$103 (was $206)",
  },
  {
    label: "Consultation credits",
    basic: "1 / month",
    premium: "3 / month",
    vipElite: `${VIP_ELITE_CONSULTATION_CREDITS} / month`,
  },
  {
    label: "Plan adjustments",
    basic: "1 / month",
    premium: "2 / month",
    vipElite: "Unlimited (per plan policy)",
  },
  {
    label: "Lab review",
    basic: "Not included",
    premium: "Basic review",
    vipElite: "Detailed review",
  },
  {
    label: "Response priority",
    basic: "Standard",
    premium: "Faster response",
    vipElite: "Highest priority",
  },
  {
    label: "Booking priority",
    basic: "3+ days notice",
    premium: "2+ days notice",
    vipElite: "Same-day, subject to availability",
  },
  {
    label: "Priority Hotline",
    basic: "Not included",
    premium: "Not included",
    vipElite: "Included",
  },
];

export function getPackageBySlug(slug: string) {
  return packages.find((pkg) => pkg.slug === slug);
}

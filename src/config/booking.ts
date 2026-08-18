// The recurring-membership tier slug — still used by the (dormant) monthly
// membership Stripe flow (src/services/checkoutService.ts, src/data/packages.ts)
// even though the site no longer sells memberships as the primary product.
// The anonymous package-scheduling flow that used to live in this file
// (SchedulingRule, getBookingProvider, etc.) was retired along with
// BookingPage.tsx — booking a real slot now happens after a one-time
// program-package purchase, from the authenticated Account -> Consultations
// page, not from an anonymous pre-payment scheduler.
export type PackageSlug = "basic" | "premium" | "vip-elite";

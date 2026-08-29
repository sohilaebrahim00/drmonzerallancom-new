// Commerce is intentionally thin: for this release every "purchase" is a
// WhatsApp inquiry. This file is the single seam to swap in Stripe Checkout
// later without touching product/package UI components.

// formatPrice used to live here and was unreachable — nothing imported it,
// because prices render from the `priceLabel` strings in programPackages.ts.
// The live implementation is src/i18n/format.ts, which pins currency to en-US
// deliberately. Two unreachable price formatters is how the next person edits
// the wrong one, so this copy is gone.

/** No confirmed price/availability info exists for any product yet — every inquiry asks for both. */
export function buildProductInquiryMessage(productName: string, pageUrl: string) {
  return `Hello, I'm interested in ${productName} on Dr. Monzer Allan's website. Could you please confirm the price, availability, and ordering details? Product page: ${pageUrl}`;
}

export function buildAvailabilityInquiryMessage(productName: string) {
  return `Hello, I'm interested in ${productName}. I see that it is currently out of stock. Could you let me know when it may become available again?`;
}

export function buildPackageInquiryMessage(packageName: string, priceLabel: string) {
  return `Hello, I'm interested in the ${packageName} Nutrition Plan at ${priceLabel}. I would like to learn more and schedule an online consultation.`;
}

/**
 * Where a "buy"/"subscribe" CTA should point. Prefers a configured Stripe
 * Payment Link; falls back to the in-house booking flow when none exists.
 * Never fabricates a Stripe URL.
 */
export function getCheckoutHref(stripePaymentLink: string | undefined, fallbackHref: string) {
  const trimmed = stripePaymentLink?.trim();
  return trimmed ? trimmed : fallbackHref;
}

export function isExternalCheckout(stripePaymentLink: string | undefined) {
  return Boolean(stripePaymentLink?.trim());
}

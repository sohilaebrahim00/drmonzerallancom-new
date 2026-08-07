// Commerce is intentionally thin: for this release every "purchase" is a
// WhatsApp inquiry. This file is the single seam to swap in Stripe Checkout
// later without touching product/package UI components.

export function formatPrice(price: number, currency: "USD" = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: price % 1 === 0 ? 0 : 2,
  }).format(price);
}

/** No confirmed price/availability info exists for any product yet — every inquiry asks for both. */
export function buildProductInquiryMessage(productName: string, pageUrl: string) {
  return `Hello, I'm interested in ${productName} on Dr. Monzer Allan's website. Could you please confirm the price, availability, and ordering details? Product page: ${pageUrl}`;
}

export function buildAvailabilityInquiryMessage(productName: string) {
  return `Hello, I'm interested in ${productName}. I see that it is currently sold out. Could you let me know when it may become available again?`;
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

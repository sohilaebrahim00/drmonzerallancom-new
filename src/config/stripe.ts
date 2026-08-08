// The Stripe Publishable Key is safe to ship in the client bundle by design
// — it identifies the account, not a secret. It is not read from here yet
// (Checkout redirects to a Stripe-hosted page returned by the
// create-checkout-session Edge Function, so no Stripe.js is loaded
// client-side today), but is exposed for future use (e.g. Stripe Elements,
// the Customer Portal button). The Secret Key must NEVER appear here or in
// any VITE_* variable — it only ever lives in Supabase Edge Function secrets.
export const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
export const isStripeConfigured = Boolean(stripePublishableKey);

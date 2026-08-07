import { business } from "@/data/business";
import { whatsappLink } from "@/config/contact";

export interface ContactPayload {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export type ContactSubmitResult =
  | { channel: "email"; href: string }
  | { channel: "whatsapp"; href: string }
  | { channel: "unavailable" };

/**
 * Isolated so a real backend (Resend, Formspree, Web3Forms, a Hostinger-side
 * script, …) can be dropped in later without touching the Contact form UI —
 * just replace the body of this function with a `fetch()` call to that
 * provider's endpoint. No secret keys belong in this file or anywhere under
 * `VITE_*`: those are bundled into the public client build.
 *
 * Until a provider is configured, this never claims a message was "sent" —
 * it hands the visitor off to a real, working channel (their own email
 * client, or WhatsApp) and reports which one so the UI can be honest about
 * what actually happened.
 */
export function submitContact(payload: ContactPayload): ContactSubmitResult {
  if (business.email) {
    const subject = `New inquiry from ${payload.name}`;
    const body = [
      `Name: ${payload.name}`,
      `Email: ${payload.email}`,
      `Phone: ${payload.phone}`,
      "",
      payload.message,
    ].join("\n");
    return {
      channel: "email",
      href: `mailto:${business.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    };
  }

  const waMessage = [
    "Hello, I'd like to get in touch.",
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    `Phone: ${payload.phone}`,
    "",
    payload.message,
  ].join("\n");
  const waHref = whatsappLink(waMessage);
  if (waHref) {
    return { channel: "whatsapp", href: waHref };
  }

  return { channel: "unavailable" };
}

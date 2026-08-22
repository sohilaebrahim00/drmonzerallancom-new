import { business } from "@/data/business";
import { whatsappLink } from "@/config/contact";
import { supabase } from "@/lib/supabase";

export interface ContactPayload {
  name: string;
  email: string;
  phone: string;
  preferredContactMethod: "whatsapp" | "email" | "either";
  subject: string;
  message: string;
  /**
   * Honeypot — the hidden field rendered at Contact.tsx. Real visitors leave
   * it empty. It MUST be forwarded: contact-submit's server-side honeypot
   * check reads `companyWebsite`, and while this field was dropped here that
   * check could never fire.
   */
  companyWebsite?: string;
}

export type ContactSubmitResult =
  | { channel: "submitted" }
  | { channel: "error"; message: string }
  | { channel: "email"; href: string }
  | { channel: "whatsapp"; href: string }
  | { channel: "unavailable" };

function fallback(payload: ContactPayload): ContactSubmitResult {
  if (business.email) {
    const subject = payload.subject || `New inquiry from ${payload.name}`;
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

/**
 * Submits the Contact form to the contact-submit Edge Function, which
 * stores the inquiry in Supabase and emails the team — a real backend
 * request, not just a mailto: handoff. Only reports "submitted" when that
 * backend actually confirms the write; any failure (not configured,
 * network error, validation error, rate limit) falls back to a real,
 * working channel (the visitor's own email client, or WhatsApp) instead of
 * ever claiming a message was sent when it wasn't.
 */
export async function submitContact(payload: ContactPayload): Promise<ContactSubmitResult> {
  if (!supabase) {
    return fallback(payload);
  }

  try {
    const { data, error } = await supabase.functions.invoke<{ ok?: boolean; error?: string }>(
      "contact-submit",
      {
        body: {
          fullName: payload.name,
          email: payload.email,
          phone: payload.phone,
          preferredContactMethod: payload.preferredContactMethod,
          subject: payload.subject,
          message: payload.message,
          companyWebsite: payload.companyWebsite ?? "",
          sourcePage: window.location.pathname,
        },
      },
    );

    if (error || !data?.ok) {
      if (data?.error) return { channel: "error", message: data.error };
      return fallback(payload);
    }
    return { channel: "submitted" };
  } catch {
    return fallback(payload);
  }
}

// WhatsApp is configured entirely through env vars — no hardcoded numbers.
// If VITE_WHATSAPP_NUMBER is unset, isWhatsAppConfigured is false and callers
// should fall back to the Contact page instead of rendering a broken link.
const rawNumber = import.meta.env.VITE_WHATSAPP_NUMBER?.trim();

export const isWhatsAppConfigured = Boolean(rawNumber);

export function whatsappLink(message: string): string | undefined {
  if (!rawNumber) return undefined;
  return `https://wa.me/${rawNumber}?text=${encodeURIComponent(message)}`;
}

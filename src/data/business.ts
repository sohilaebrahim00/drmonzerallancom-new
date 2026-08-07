// Central business configuration. Every contact-detail field is optional on
// purpose: nothing here is invented. Consumers must check for a field's
// presence and hide the corresponding UI (icon, row, link) gracefully when
// it's undefined — never render a placeholder as if it were real.
//
// WhatsApp is intentionally NOT part of this file — it's configured via the
// VITE_WHATSAPP_NUMBER env var (see src/config/contact.ts) so it can be set
// per-deployment without a code change.
export interface Business {
  doctorName: string;
  professionalTitle: string;
  domain: string;
  instagram?: string;
  instagramHandle?: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
  phone?: string;
  email?: string;
  fullAddress?: string;
  officeHours?: string[];
  googleMapsUrl?: string;
  timeZone?: string;
}

export const business: Business = {
  doctorName: "Monzer Allan",
  professionalTitle: "Nutrition Specialist & Pharmacist",
  domain: "https://monzerallan.com",
  // Confirmed real official profiles, supplied directly.
  instagram: "https://www.instagram.com/monzerallan?igsh=YWgyeGdramF3c3Ft",
  instagramHandle: "@monzerallan",
  facebook: "https://www.facebook.com/share/1Dhu99SQt3/?mibextid=wwXIfr",
  tiktok: "https://www.tiktok.com/@monzerallan?_r=1&_t=ZT-98hAmzX1TsU",
  youtube: "https://youtube.com/@monzerallan?si=NxAdGsbsX6ADqHNz",
  // phone, email, fullAddress, officeHours, googleMapsUrl, and timeZone are
  // intentionally left unset — none have been confirmed. Populate them here
  // once real values are provided; every consumer already renders
  // conditionally and needs no other change.
};

export function tel(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

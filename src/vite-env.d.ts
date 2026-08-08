/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WHATSAPP_NUMBER?: string;
  readonly VITE_GOOGLE_BOOKING_BASIC_URL?: string;
  readonly VITE_GOOGLE_BOOKING_PREMIUM_URL?: string;
  readonly VITE_GOOGLE_BOOKING_VIP_URL?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

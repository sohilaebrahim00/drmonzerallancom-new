import { createClient } from "@supabase/supabase-js";
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

const isNative = Capacitor.isNativePlatform();

/**
 * On native (Android/iOS), back the session store with Capacitor Preferences
 * instead of the SDK's default localStorage — Preferences persist in the
 * app's native storage layer, which is the durable choice inside a WebView
 * (Supabase's own guidance for Capacitor/React Native apps). Web keeps the
 * default localStorage behavior untouched.
 */
const nativeAuthStorage = {
  getItem: async (key: string) => (await Preferences.get({ key })).value,
  setItem: async (key: string, value: string) => {
    await Preferences.set({ key, value });
  },
  removeItem: async (key: string) => {
    await Preferences.remove({ key });
  },
};

/**
 * Both values are public client identifiers (safe to ship in the bundle) —
 * never put the service_role key or any other secret here. This app never
 * reads/writes auth tokens manually beyond wiring the storage adapter above.
 *
 * `detectSessionInUrl` is disabled natively: there is no browser address bar
 * to parse an OAuth/magic-link redirect from inside the app's WebView, and
 * leaving it on there is a no-op at best.
 *
 * When not configured, `supabase` is null and every auth UI shows a
 * "not yet connected" state instead of throwing or pretending to work.
 */
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: !isNative,
        ...(isNative ? { storage: nativeAuthStorage } : {}),
      },
    })
  : null;

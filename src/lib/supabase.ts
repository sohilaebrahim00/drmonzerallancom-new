import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

/**
 * Both values are public client identifiers (safe to ship in the bundle) —
 * never put the service_role key or any other secret here. The Supabase
 * client itself persists the session (localStorage, handled internally by
 * the SDK) — this app never reads/writes auth tokens manually.
 *
 * When not configured, `supabase` is null and every auth UI shows a
 * "not yet connected" state instead of throwing or pretending to work.
 */
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

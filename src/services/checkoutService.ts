import { supabase } from "@/lib/supabase";
import type { PackageSlug } from "@/config/booking";

export interface StartCheckoutInput {
  fullName: string;
  email: string;
  phone?: string;
  preferredContactMethod: "whatsapp" | "email" | "either";
  packageId: PackageSlug;
}

export type StartCheckoutResult = { ok: true; url: string } | { ok: false; error: string };

/**
 * Calls the create-checkout-session Edge Function (see
 * supabase/functions/create-checkout-session), which creates a real Stripe
 * Checkout session server-side using a trusted Price ID — the browser never
 * sends an amount. Fails soft with an honest error when Supabase isn't
 * configured or the function isn't deployed yet, so the UI can fall back to
 * a manual contact flow instead of pretending checkout is live.
 */
export async function startMembershipCheckout(
  input: StartCheckoutInput,
): Promise<StartCheckoutResult> {
  if (!supabase) {
    return { ok: false, error: "Membership checkout isn't connected yet." };
  }

  try {
    const { data, error } = await supabase.functions.invoke<{ url?: string; error?: string }>(
      "create-checkout-session",
      {
        body: {
          fullName: input.fullName,
          email: input.email,
          phone: input.phone,
          preferredContactMethod: input.preferredContactMethod,
          packageId: input.packageId,
          siteUrl: window.location.origin,
        },
      },
    );

    if (error || !data?.url) {
      return { ok: false, error: data?.error ?? error?.message ?? "Could not start checkout." };
    }
    return { ok: true, url: data.url };
  } catch {
    return { ok: false, error: "Could not start checkout. Please try again." };
  }
}

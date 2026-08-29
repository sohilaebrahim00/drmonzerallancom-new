import { supabase } from "@/lib/supabase";
import type { PackageSlug } from "@/config/booking";
import { getProgramPackageBySlug, type ProgramPackageSlug } from "@/data/programPackages";

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

export interface StartProgramCheckoutInput {
  fullName: string;
  email: string;
  /** Required — the doctor needs a way to reach the patient about their program. */
  phone: string;
  packageId: ProgramPackageSlug;
}

/**
 * Calls the create-consultation-checkout-session Edge Function — a one-time
 * (non-recurring) Stripe Checkout for a Diet or Treatment program package,
 * kept separate from startMembershipCheckout above so the recurring-
 * membership flow is never touched by this addition.
 */
export async function startProgramPackageCheckout(
  input: StartProgramCheckoutInput,
): Promise<StartCheckoutResult> {
  if (!supabase) {
    return { ok: false, error: "Checkout isn't connected yet." };
  }

  try {
    const { data, error } = await supabase.functions.invoke<{
      url?: string;
      amountCents?: number;
      error?: string;
    }>("create-consultation-checkout-session", {
      body: {
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        packageId: input.packageId,
      },
    });

    if (error || !data?.url) {
      return { ok: false, error: data?.error ?? error?.message ?? "Could not start checkout." };
    }

    /**
     * LIVE PRICE CHECK — detection, not authorisation.
     *
     * The server decides the price and the browser cannot influence it; this
     * only compares the amount the server says it used against the amount the
     * visitor was actually shown on this page. If they disagree we refuse to
     * forward them.
     *
     * This is the only check that survives the failure this project keeps
     * hitting: the price changes, the frontend deploys, and the Edge Function
     * is never redeployed. Both copies inside the stale function agree with
     * each other, so its cold-start assertion stays quiet — but the figure it
     * returns no longer matches the figure on the card, and this catches it.
     *
     * A missing `amountCents` means an older function is deployed, from before
     * it reported one. That is not treated as a mismatch: it is a deploy we
     * cannot verify, so it is allowed through rather than blocking every sale
     * on a check that the server does not yet support.
     */
    const published = getProgramPackageBySlug(input.packageId)?.price;
    if (
      typeof data.amountCents === "number" &&
      typeof published === "number" &&
      data.amountCents !== Math.round(published * 100)
    ) {
      console.error(
        `[checkout] Price mismatch for "${input.packageId}": the page shows ` +
          `$${published.toFixed(2)} (${Math.round(published * 100)} cents) but the server would ` +
          `charge ${data.amountCents} cents ($${(data.amountCents / 100).toFixed(2)}). ` +
          `Refusing to open checkout. The Edge Function is probably running an older deploy — ` +
          `redeploy create-consultation-checkout-session.`,
      );
      return {
        ok: false,
        error:
          "The price for this program has changed since this page loaded. " +
          "Please refresh and try again — you have not been charged.",
      };
    }

    return { ok: true, url: data.url };
  } catch {
    return { ok: false, error: "Could not start checkout. Please try again." };
  }
}

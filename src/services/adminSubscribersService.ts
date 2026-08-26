import { supabase } from "@/lib/supabase";

/**
 * One active subscriber, as the admin-subscribers Edge Function returns them.
 * Raw values — the screen does the formatting.
 */
export interface AdminSubscriber {
  userId: string;
  fullName: string | null;
  email: string | null;
  packageId: string;
  creditLimit: number;
  creditsUsed: number;
  /** ISO timestamp of their most recent active purchase. */
  subscribedAt: string;
  /** null means they have never signed in — the whole point of this screen. */
  lastSignInAt: string | null;
  hasUpcomingConsultation: boolean;
}

export interface AdminSubscriberTotals {
  totalSubscribers: number;
  neverSignedIn: number;
}

export type ListSubscribersResult =
  | { ok: true; subscribers: AdminSubscriber[]; totals: AdminSubscriberTotals }
  | { ok: false; error: string };

/**
 * Reads the subscriber list. Server-side by necessity: last_sign_in_at lives
 * in auth.users, which the browser cannot read under any policy.
 */
export async function listSubscribers(): Promise<ListSubscribersResult> {
  if (!supabase) return { ok: false, error: "Not connected yet." };
  try {
    const { data, error } = await supabase.functions.invoke<{
      subscribers?: AdminSubscriber[];
      totals?: AdminSubscriberTotals;
      error?: string;
    }>("admin-subscribers", { body: {} });

    if (error) {
      const status = (error as { context?: { status?: number } }).context?.status;
      if (status === 403) return { ok: false, error: "You don't have access to this area." };
      return { ok: false, error: "Could not load subscribers. Please try again." };
    }
    if (!data?.subscribers || !data.totals) {
      return { ok: false, error: data?.error ?? "Could not load subscribers. Please try again." };
    }
    return { ok: true, subscribers: data.subscribers, totals: data.totals };
  } catch {
    return { ok: false, error: "Could not load subscribers. Please try again." };
  }
}

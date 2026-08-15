import { supabase } from "@/lib/supabase";
import { getDemoMode } from "@/dev/demoMode";

/**
 * Calls the delete-account Edge Function, which verifies the caller's own
 * session and deletes exactly that auth.users row via the Admin API — the
 * only way to actually remove an account (a client can never do this
 * directly). Cascades through every owned record via the FKs declared in
 * schema.sql/PHASE_G_SOCIAL_NUTRITION_MIGRATION.sql. The client signs the
 * visitor out immediately after a success response.
 */
export async function requestAccountDeletion(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  // DEV-ONLY demo preview — never actually deletes anything (there is
  // nothing real to delete); returns an honest refusal instead of a fake
  // success so the demo doesn't imply the account is gone.
  if (getDemoMode())
    return { ok: false, error: "Account deletion is disabled in the demo preview." };
  if (!supabase) return { ok: false, error: "Not connected." };

  const { data, error } = await supabase.functions.invoke<{ ok?: boolean; error?: string }>(
    "delete-account",
    { body: {} },
  );

  if (error) {
    const status = (error as { context?: { status?: number } }).context?.status;
    if (status === 403) {
      return {
        ok: false,
        error: "Doctor/admin accounts require manual deletion — contact support.",
      };
    }
    return { ok: false, error: "Could not delete account. Please try again." };
  }
  if (!data?.ok) return { ok: false, error: data?.error ?? "Could not delete account." };

  await supabase.auth.signOut();
  return { ok: true };
}

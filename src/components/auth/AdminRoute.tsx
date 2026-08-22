import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

/**
 * Gates a route behind sign-in AND administrator status, checked from the
 * real database — never a client-side flag.
 *
 * The check is the security-definer `public.is_admin()` RPC (defined in
 * PHASE_G_SOCIAL_NUTRITION_MIGRATION.sql, `is_admin or role = 'admin'`),
 * not a `profiles.is_admin` column read. Two reasons: it is the same
 * predicate every RLS policy uses, so this gate cannot drift from them; and
 * PHASE_J_FIXES_MIGRATION.sql (J.3) revokes the `is_admin` column from the
 * `authenticated` role so an ordinary member can no longer read off which
 * account is the administrator. The RPC answers only about the caller.
 */
export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user || !supabase) {
      setChecking(false);
      return;
    }
    let cancelled = false;
    supabase.rpc("is_admin").then(({ data, error }) => {
      if (cancelled) return;
      // Any failure denies access — this must never fail open.
      setIsAdmin(!error && data === true);
      setChecking(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  if (loading || checking) {
    return (
      <div
        className="flex min-h-[60vh] w-full items-center justify-center"
        role="status"
        aria-label="Checking access"
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

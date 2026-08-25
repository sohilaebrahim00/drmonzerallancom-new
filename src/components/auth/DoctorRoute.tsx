import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

/**
 * Gates a route behind sign-in AND profiles.role in (doctor, admin), checked
 * from the real database — never a client-side flag.
 *
 * The check is the security-definer `public.is_doctor()` RPC (defined in
 * PHASE_G_SOCIAL_NUTRITION_MIGRATION.sql as `role in ('doctor','admin')`),
 * not AppBootContext. That matters: AppBootProvider is mounted only inside
 * AppExperience, so the previous implementation threw "useAppBoot must be
 * used within an AppBootProvider" the moment this component was used on the
 * marketing website — which is exactly where /doctor/* now lives. Resolving
 * the role here keeps one component working in both shells, and matches how
 * AdminRoute already resolves is_admin().
 *
 * This is the UI gate only. The server enforces access independently:
 * the admin-availability Edge Function re-checks the caller against
 * profiles.is_admin under the service_role key, so bypassing this component
 * gains nothing.
 */
export function DoctorRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [isDoctor, setIsDoctor] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user || !supabase) {
      setChecking(false);
      return;
    }
    let cancelled = false;
    supabase.rpc("is_doctor").then(({ data, error }) => {
      if (cancelled) return;
      // Any failure denies access — this must never fail open.
      setIsDoctor(!error && data === true);
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

  if (!user || !isDoctor) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

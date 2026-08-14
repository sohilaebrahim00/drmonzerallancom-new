import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { useAppBoot } from "@/context/AppBootContext";

/** Gates a route behind sign-in AND profiles.role in (doctor, admin) — resolved server-side via AppBootContext, never a client-side flag. */
export function DoctorRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { status, role } = useAppBoot();

  if (loading || status === "initializing") {
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

  if (!user || (role !== "doctor" && role !== "admin")) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

import { Navigate, useLocation } from "react-router-dom";

import { AppExperience } from "@/app-native/AppExperience";
import { ClientDemoChooser } from "@/dev/ClientDemoChooser";
import { ClientDemoOverlay } from "@/dev/ClientDemoOverlay";
import { getDemoMode, setClientDemoMode } from "@/dev/demoMode";

/**
 * Top-level tree for the client-demo build (`demo.monzerallan.com`) — only
 * ever mounted by App.tsx when isClientDemoBuild() is true, so this file
 * has zero effect on the real production builds regardless of what it does.
 *
 * Routing is deliberately NOT done via nested <Route>/<Routes> matching
 * against AppExperience's own absolute-path routes (which would require
 * AppExperience to be aware of a "/user"/"/doctor" prefix it doesn't have,
 * and was never designed for). Instead: `/user` and `/doctor` are two exact,
 * clean entry paths that set the fixture mode and redirect straight to "/",
 * where AppExperience is mounted exactly the same way it already is for the
 * real PWA/native builds — same component, same props, zero routing risk.
 * A client bookmarking or refreshing `/user` re-runs this same one-step
 * redirect every time, which is the correct behavior for an entry point.
 */
export function ClientDemoApp() {
  const location = useLocation();

  if (location.pathname === "/user") {
    setClientDemoMode("user");
    return <Navigate to="/" replace />;
  }
  if (location.pathname === "/doctor") {
    setClientDemoMode("doctor");
    return <Navigate to="/" replace />;
  }

  const mode = getDemoMode();
  if (!mode) return <ClientDemoChooser />;

  return (
    <>
      <AppExperience />
      <ClientDemoOverlay mode={mode} />
    </>
  );
}

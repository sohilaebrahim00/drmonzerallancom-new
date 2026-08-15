import { useEffect, useState } from "react";
import { ArrowsClockwise } from "@phosphor-icons/react";

import {
  applyServiceWorkerUpdate,
  onServiceWorkerUpdateAvailable,
} from "@/pwa/registerServiceWorker";

/**
 * Appears only once a new service-worker version has finished downloading
 * in the background — never auto-refreshes. A visitor mid-booking or
 * mid-chat keeps working on the current version until they explicitly tap
 * Update.
 */
export function UpdateAvailableBanner() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    onServiceWorkerUpdateAvailable(() => setAvailable(true));
  }, []);

  if (!available) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-3 bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">
      <span>A new version is available.</span>
      <button
        type="button"
        onClick={applyServiceWorkerUpdate}
        className="flex cursor-pointer items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 transition-colors hover:bg-white/25"
      >
        <ArrowsClockwise className="h-3.5 w-3.5" /> Update
      </button>
    </div>
  );
}

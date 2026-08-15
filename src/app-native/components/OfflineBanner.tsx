import { WifiSlash } from "@phosphor-icons/react";

import { useOnlineStatus } from "@/hooks/use-online-status";

/**
 * Honest connectivity indicator for the app experience — shown whenever the
 * browser/OS reports no connection, so screens that need live data (booking,
 * AI, membership) don't silently fail with no explanation. Prayer Times and
 * Qibla keep working offline where their data is already local; this banner
 * doesn't block anything, it just tells the truth.
 */
export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <div
      role="status"
      className="native-safe-top flex items-center justify-center gap-2 bg-navy px-3 py-1.5 text-xs font-semibold text-white"
    >
      <WifiSlash className="h-3.5 w-3.5" />
      You&apos;re offline — some features need a connection.
    </div>
  );
}

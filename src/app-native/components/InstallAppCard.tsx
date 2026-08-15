import { useEffect, useState } from "react";
import { Download, Share, PlusCircle, X } from "@phosphor-icons/react";

import { getAppMode } from "@/hooks/use-native-platform";
import { usePwaInstallPrompt } from "@/hooks/use-pwa-install";
import { isIOSDevice, isStandaloneDisplayMode } from "@/lib/capabilities";
import { getSetting, setSetting } from "@/services/appSettingsService";
import { Button } from "@/components/ui/button";

const DISMISSED_KEY = "pwa.installCardDismissed";

/**
 * Subtle, dismissible "install this app" card for app.monzerallan.com —
 * never shown inside the Capacitor app (already installed) or once the
 * visitor has already installed/opened as standalone. Dismissal is
 * remembered (Preferences, browser-backed here) so it never nags on every
 * visit. Two real, distinct paths:
 *  - Chrome/Edge/Android: a real "Install" button using the captured
 *    beforeinstallprompt event.
 *  - iOS Safari (no such event exists there): plain instructions for the
 *    manual Share -> Add to Home Screen flow — never a fake install button.
 */
export function InstallAppCard() {
  const [dismissed, setDismissed] = useState(true);
  const [checked, setChecked] = useState(false);
  const { canPromptInstall, installed, promptInstall } = usePwaInstallPrompt();

  useEffect(() => {
    getSetting(DISMISSED_KEY, false).then((value) => {
      setDismissed(value);
      setChecked(true);
    });
  }, []);

  if (getAppMode() !== "PWA_WEB_APP") return null;
  if (!checked || dismissed || installed || isStandaloneDisplayMode()) return null;

  const ios = isIOSDevice();
  if (!ios && !canPromptInstall) return null; // Nothing actionable to show yet (criteria not met, or unsupported browser).

  function dismiss() {
    setDismissed(true);
    setSetting(DISMISSED_KEY, true);
  }

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-secondary/60 p-3.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Download className="h-4.5 w-4.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-navy">Install the app</p>
        {ios && !canPromptInstall ? (
          <p className="mt-0.5 flex flex-wrap items-center gap-1 text-xs leading-relaxed text-muted-foreground">
            Tap <Share className="inline h-3.5 w-3.5" /> Share, then{" "}
            <PlusCircle className="inline h-3.5 w-3.5" /> Add to Home Screen.
          </p>
        ) : (
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            Add Dr. Monzer to your home screen for quick, full-screen access.
          </p>
        )}
        {!ios && canPromptInstall && (
          <Button
            size="sm"
            className="mt-2 h-8 cursor-pointer text-xs"
            onClick={() => promptInstall()}
          >
            Install
          </Button>
        )}
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 cursor-pointer rounded-full p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-navy"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

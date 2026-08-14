import { useEffect, useState } from "react";
import { Stethoscope } from "lucide-react";

import { OnboardingStepShell } from "@/app-native/onboarding/OnboardingStepShell";
import { getPracticeDoctor, requestDoctorConnection } from "@/services/doctorService";

export function ConnectDoctorStep({ onNext }: { onNext: () => Promise<void> }) {
  const [doctor, setDoctor] = useState<{ id: string; full_name: string | null } | null>(null);
  const [requested, setRequested] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getPracticeDoctor().then(setDoctor);
  }, []);

  async function handleConnect() {
    if (!doctor || saving) return;
    setSaving(true);
    await requestDoctorConnection(doctor.id);
    setSaving(false);
    setRequested(true);
  }

  async function handleNext() {
    if (saving) return;
    await onNext();
  }

  return (
    <OnboardingStepShell
      step="connect_doctor"
      title="Connect With Your Doctor"
      subtitle="Optional — Dr. Monzer can review your progress and assign a nutrition program once connected."
      onNext={handleNext}
      nextLabel={requested ? "Continue" : "Not Now"}
      saving={false}
    >
      {doctor ? (
        <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
            <Stethoscope className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-bold text-navy">
              {doctor.full_name ?? "Dr. Monzer Allan"}
            </p>
            <p className="text-xs text-muted-foreground">
              {requested ? "Request sent" : "Nutrition Specialist & Pharmacist"}
            </p>
          </div>
          {!requested && (
            <button
              type="button"
              onClick={handleConnect}
              disabled={saving}
              className="cursor-pointer rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-turquoise disabled:opacity-60"
            >
              {saving ? "Sending…" : "Connect"}
            </button>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No doctor is available to connect with right now.
        </p>
      )}
    </OnboardingStepShell>
  );
}

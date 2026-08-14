import { useState } from "react";

import { OnboardingStepShell } from "@/app-native/onboarding/OnboardingStepShell";
import { Switch } from "@/components/ui/switch";
import { updateMyPrivacySettings, type PrivacySettings } from "@/services/privacyService";

const ROWS: { key: keyof PrivacySettings; label: string; defaultOn: boolean }[] = [
  { key: "share_meals_with_friends", label: "Meals & calories", defaultOn: true },
  { key: "share_steps_with_friends", label: "Steps", defaultOn: true },
  { key: "share_activity_with_friends", label: "Activity/movement", defaultOn: true },
  { key: "share_program_progress_with_friends", label: "Program progress", defaultOn: true },
  { key: "share_meal_photos_with_friends", label: "Meal photos", defaultOn: false },
  { key: "share_weight_with_friends", label: "Weight", defaultOn: false },
];

export function PrivacyStep({ onNext }: { onNext: () => Promise<void> }) {
  const [values, setValues] = useState<Record<string, boolean>>(
    Object.fromEntries(ROWS.map((r) => [r.key, r.defaultOn])),
  );
  const [saving, setSaving] = useState(false);

  async function handleNext() {
    if (saving) return;
    setSaving(true);
    await updateMyPrivacySettings(values as Partial<PrivacySettings>);
    setSaving(false);
    await onNext();
  }

  return (
    <OnboardingStepShell
      step="privacy"
      title="Your Privacy"
      subtitle="Choose what friends can see. Your doctor only sees data once you're connected — health conditions, allergies, and medications are never shared with friends."
      onNext={handleNext}
      saving={saving}
    >
      <div className="space-y-1 rounded-2xl border border-border/70 bg-card p-2 shadow-sm">
        {ROWS.map((row) => (
          <div key={row.key} className="flex items-center justify-between px-2 py-2.5">
            <span className="text-sm font-semibold text-navy">{row.label}</span>
            <Switch
              checked={values[row.key]}
              onCheckedChange={(checked) => setValues((v) => ({ ...v, [row.key]: checked }))}
            />
          </div>
        ))}
      </div>
    </OnboardingStepShell>
  );
}

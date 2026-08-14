import { useState } from "react";

import { OnboardingStepShell } from "@/app-native/onboarding/OnboardingStepShell";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { setBasicProfile, type FullProfile } from "@/services/profileService";

const USERNAME_PATTERN = /^[a-z0-9_.]{3,24}$/;

export function BasicsStep({
  profile,
  onNext,
}: {
  profile: FullProfile | null;
  onNext: () => Promise<void>;
}) {
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [username, setUsername] = useState(profile?.username ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = fullName.trim().length >= 2 && USERNAME_PATTERN.test(username.trim().toLowerCase());

  async function handleNext() {
    if (!valid || saving) return;
    setSaving(true);
    setError(null);
    const result = await setBasicProfile({
      fullName: fullName.trim(),
      username: username.trim().toLowerCase(),
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    await onNext();
  }

  return (
    <OnboardingStepShell
      step="basics"
      title="Tell us about you"
      subtitle="Your username is how friends and your doctor can find you."
      onNext={handleNext}
      nextDisabled={!valid}
      saving={saving}
    >
      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Full name
          </label>
          <Input
            className="mt-1.5"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Doe"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Username
          </label>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="text-sm text-muted-foreground">@</span>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="jane_fit"
            />
          </div>
        </div>
        {error && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </OnboardingStepShell>
  );
}

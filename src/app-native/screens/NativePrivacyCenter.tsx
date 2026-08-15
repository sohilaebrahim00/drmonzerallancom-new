import { useEffect, useState } from "react";
import { CircleNotch } from "@phosphor-icons/react";

import { AppScreen } from "@/app-native/components/AppScreen";
import { Switch } from "@/components/ui/switch";
import {
  getMyPrivacySettings,
  updateMyPrivacySettings,
  type PrivacySettings,
} from "@/services/privacyService";
import { getBlockedUsers, unblockUser, type FriendshipRow } from "@/services/friendsService";

const ROWS: { key: keyof PrivacySettings; label: string }[] = [
  { key: "share_meals_with_friends", label: "Meals" },
  { key: "share_meal_photos_with_friends", label: "Meal Photos" },
  { key: "share_calories_with_friends", label: "Calories" },
  { key: "share_steps_with_friends", label: "Steps" },
  { key: "share_activity_with_friends", label: "Movement" },
  { key: "share_program_progress_with_friends", label: "Program Progress" },
];

export default function NativePrivacyCenter() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [blocked, setBlocked] = useState<FriendshipRow[]>([]);

  function refresh() {
    Promise.all([getMyPrivacySettings(), getBlockedUsers()]).then(([s, b]) => {
      setSettings(s);
      setBlocked(b);
      setLoading(false);
    });
  }

  useEffect(refresh, []);

  async function toggle(key: keyof PrivacySettings, value: boolean) {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
    await updateMyPrivacySettings({ [key]: value });
  }

  if (loading) {
    return (
      <AppScreen
        title="Privacy & Sharing"
        back
        className="flex min-h-[50vh] items-center justify-center"
      >
        <CircleNotch className="h-7 w-7 animate-spin text-primary" />
      </AppScreen>
    );
  }

  return (
    <AppScreen title="Privacy & Sharing" back className="mx-auto w-full max-w-lg px-4 pb-8 pt-3">
      <p className="mb-1.5 px-1 text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground/80">
        Doctor Access
      </p>
      <p className="rounded-2xl bg-app-surface p-3.5 text-xs leading-relaxed text-muted-foreground">
        Your doctor can see your health profile, meals, program, steps, weight, and activity while
        you have an active doctor connection. This isn&apos;t controlled by the toggles below —
        ending the connection in Account → My Program ends this access.
      </p>

      <p className="mb-1.5 mt-5 px-1 text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground/80">
        What Friends Can See
      </p>
      <div className="space-y-0.5 rounded-2xl bg-app-surface p-1.5">
        {ROWS.map((row) => (
          <div key={row.key} className="flex items-center justify-between rounded-xl px-3 py-3">
            <span className="text-sm font-semibold text-navy">{row.label}</span>
            <Switch
              checked={Boolean(settings?.[row.key])}
              onCheckedChange={(checked) => toggle(row.key, checked)}
            />
          </div>
        ))}
        <div className="flex items-center justify-between rounded-xl px-3 py-3 opacity-60">
          <span className="text-sm font-semibold text-navy">Weight</span>
          <span className="text-xs text-muted-foreground">Always private</span>
        </div>
      </div>
      <p className="mt-1.5 px-1 text-[0.65rem] text-muted-foreground">
        Health conditions, allergies, medications, and doctor notes are never shown to friends.
      </p>

      <p className="mb-1.5 mt-5 px-1 text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground/80">
        Blocked Users
      </p>
      {blocked.length === 0 ? (
        <p className="px-1 text-sm text-muted-foreground">You haven&apos;t blocked anyone.</p>
      ) : (
        <div className="divide-y divide-border/50 rounded-2xl bg-app-surface px-3">
          {blocked.map((b) => (
            <div key={b.id} className="flex items-center gap-3 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-primary">
                {(b.other?.full_name ?? "?").charAt(0).toUpperCase()}
              </span>
              <p className="min-w-0 flex-1 truncate text-sm font-semibold text-navy">
                {b.other?.full_name ?? "Member"}
              </p>
              <button
                type="button"
                onClick={() => b.other && unblockUser(b.other.id).then(refresh)}
                className="shrink-0 cursor-pointer rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-navy"
              >
                Unblock
              </button>
            </div>
          ))}
        </div>
      )}
    </AppScreen>
  );
}

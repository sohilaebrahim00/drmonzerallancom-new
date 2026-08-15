import { useEffect, useState } from "react";

import { BellSlash } from "@phosphor-icons/react";

import { AppScreen } from "@/app-native/components/AppScreen";
import { useResolvedLocation } from "@/hooks/use-resolved-location";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supportsScheduledBackgroundNotifications } from "@/lib/capabilities";
import { PRAYER_LABELS, REMINDER_OFFSETS, REMINDER_PRAYERS } from "@/config/prayer";
import { computeUpcomingSchedule } from "@/services/prayerTimesService";
import {
  cancelAllReminders,
  getReminderPrefs,
  requestNotificationPermission,
  rescheduleAllReminders,
  setReminderPrefs,
  type ReminderPrefs,
} from "@/services/prayerNotificationService";

export default function NativeNotificationSettings() {
  const { coords, prefs } = useResolvedLocation();
  const [reminderPrefs, setReminders] = useState<ReminderPrefs | null>(null);
  const [notifStatus, setNotifStatus] = useState<"idle" | "granted" | "denied" | "unavailable">(
    "idle",
  );

  useEffect(() => {
    getReminderPrefs().then(setReminders);
  }, []);

  const scheduleReady = Boolean(coords && prefs);
  const upcomingCount = scheduleReady ? computeUpcomingSchedule(coords!, prefs!).length : 0;
  const reminderSupportAvailable = supportsScheduledBackgroundNotifications();

  async function toggleReminder(prayer: (typeof REMINDER_PRAYERS)[number], enabled: boolean) {
    if (!reminderPrefs) return;
    const next = { ...reminderPrefs, enabled: { ...reminderPrefs.enabled, [prayer]: enabled } };
    setReminders(next);
    await setReminderPrefs(next);
    if (notifStatus !== "granted") {
      const outcome = await requestNotificationPermission();
      setNotifStatus(outcome);
      if (outcome !== "granted") return;
    }
    if (coords && prefs) await rescheduleAllReminders(coords, prefs, next);
  }

  async function updateOffset(minutes: (typeof REMINDER_OFFSETS)[number]["minutes"]) {
    if (!reminderPrefs) return;
    const next = { ...reminderPrefs, offsetMinutes: minutes };
    setReminders(next);
    await setReminderPrefs(next);
    if (coords && prefs) await rescheduleAllReminders(coords, prefs, next);
  }

  async function disableAll() {
    if (!reminderPrefs) return;
    const next = {
      ...reminderPrefs,
      enabled: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false },
    };
    setReminders(next);
    await setReminderPrefs(next);
    await cancelAllReminders();
  }

  return (
    <AppScreen title="Notifications" back className="mx-auto w-full max-w-lg px-4 py-4">
      <p className="text-xs text-muted-foreground">
        Prayer reminders are scheduled on this device only — never sent from a server.
        {reminderSupportAvailable &&
          scheduleReady &&
          ` Currently covering the next ${upcomingCount} day(s).`}
      </p>

      {!reminderSupportAvailable && (
        <Alert className="mt-4 border-border/70 bg-secondary/60">
          <BellSlash className="h-4 w-4" />
          <AlertDescription>
            Scheduled prayer reminders aren&apos;t available in the browser app yet — this requires
            the installed Android or iPhone app. Prayer times themselves still work here.
          </AlertDescription>
        </Alert>
      )}

      {reminderSupportAvailable && reminderPrefs && (
        <div className="mt-4 space-y-1 rounded-2xl border border-border/70 bg-card p-2 shadow-sm">
          {REMINDER_PRAYERS.map((prayer) => (
            <div key={prayer} className="flex items-center justify-between px-2 py-2.5">
              <span className="text-sm font-semibold text-navy">{PRAYER_LABELS[prayer]}</span>
              <Switch
                checked={reminderPrefs.enabled[prayer]}
                onCheckedChange={(checked) => toggleReminder(prayer, checked)}
              />
            </div>
          ))}
        </div>
      )}

      {reminderSupportAvailable && reminderPrefs && (
        <div className="mt-4">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Remind me
          </label>
          <select
            value={reminderPrefs.offsetMinutes}
            onChange={(e) =>
              updateOffset(Number(e.target.value) as (typeof REMINDER_OFFSETS)[number]["minutes"])
            }
            className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-navy outline-none"
          >
            {REMINDER_OFFSETS.map((o) => (
              <option key={o.minutes} value={o.minutes}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {notifStatus === "denied" && (
        <Alert className="mt-4 border-amber-300 bg-amber-50 text-amber-900">
          <AlertDescription>
            Notifications aren't allowed for this app — enable them in your device settings to
            receive prayer reminders.
          </AlertDescription>
        </Alert>
      )}

      {reminderSupportAvailable && (
        <button
          type="button"
          onClick={disableAll}
          className="mt-4 text-xs font-semibold text-muted-foreground underline-offset-2 hover:text-navy hover:underline"
        >
          Turn off all reminders
        </button>
      )}
    </AppScreen>
  );
}

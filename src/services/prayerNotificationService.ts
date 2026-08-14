import { LocalNotifications } from "@capacitor/local-notifications";

import {
  PRAYER_LABELS,
  REMINDER_PRAYERS,
  DEFAULT_REMINDER_OFFSET_MINUTES,
  type ReminderOffsetMinutes,
  type ReminderPrayerName,
} from "@/config/prayer";
import { isNativePlatform } from "@/hooks/use-native-platform";
import { getSetting, setSetting } from "@/services/appSettingsService";
import type { Coords, PrayerPrefs } from "@/services/prayerTimesService";
import { computeUpcomingSchedule } from "@/services/prayerTimesService";

const REMINDER_PREFS_KEY = "prayer.reminders";
const SCHEDULED_IDS_KEY = "prayer.reminders.scheduledIds";

export interface ReminderPrefs {
  enabled: Record<ReminderPrayerName, boolean>;
  offsetMinutes: ReminderOffsetMinutes;
}

const DEFAULT_REMINDER_PREFS: ReminderPrefs = {
  enabled: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true },
  offsetMinutes: DEFAULT_REMINDER_OFFSET_MINUTES,
};

export async function getReminderPrefs(): Promise<ReminderPrefs> {
  return getSetting(REMINDER_PREFS_KEY, DEFAULT_REMINDER_PREFS);
}

export async function setReminderPrefs(prefs: ReminderPrefs): Promise<void> {
  await setSetting(REMINDER_PREFS_KEY, prefs);
}

export type NotificationPermissionOutcome = "granted" | "denied" | "unavailable";

/** Only call from an explicit user action inside Prayer Settings — never on launch. */
export async function requestNotificationPermission(): Promise<NotificationPermissionOutcome> {
  if (!isNativePlatform()) return "unavailable";
  try {
    const check = await LocalNotifications.checkPermissions();
    if (check.display === "granted") return "granted";
    const result = await LocalNotifications.requestPermissions();
    return result.display === "granted" ? "granted" : "denied";
  } catch {
    return "unavailable";
  }
}

/** Deterministic per-day-per-prayer id keeps reschedules idempotent (Capacitor ids are 32-bit ints). */
function notificationId(date: Date, prayer: ReminderPrayerName): number {
  const epochDay = Math.floor(date.getTime() / 86_400_000);
  const prayerIndex = REMINDER_PRAYERS.indexOf(prayer);
  return (epochDay % 100000) * 10 + prayerIndex;
}

/**
 * Recomputes and reschedules all prayer reminders for the lookahead window.
 * Always cancels every previously-scheduled reminder id first, so re-running
 * this (app open, prefs change, location change) never produces duplicates.
 * No-op on web — prayer reminders are on-device local notifications only.
 */
export async function rescheduleAllReminders(
  coords: Coords,
  prayerPrefs: PrayerPrefs,
  reminderPrefs: ReminderPrefs,
): Promise<{ scheduled: number }> {
  if (!isNativePlatform()) return { scheduled: 0 };

  const previousIds = await getSetting<number[]>(SCHEDULED_IDS_KEY, []);
  if (previousIds.length > 0) {
    await LocalNotifications.cancel({ notifications: previousIds.map((id) => ({ id })) });
  }

  const schedule = computeUpcomingSchedule(coords, prayerPrefs);
  const now = Date.now();
  const notifications: {
    id: number;
    title: string;
    body: string;
    schedule: { at: Date };
  }[] = [];

  for (const day of schedule) {
    for (const prayer of REMINDER_PRAYERS) {
      if (!reminderPrefs.enabled[prayer]) continue;
      const fireAt = new Date(day.times[prayer].getTime() - reminderPrefs.offsetMinutes * 60000);
      if (fireAt.getTime() <= now) continue;

      const label = PRAYER_LABELS[prayer];
      notifications.push({
        id: notificationId(day.date, prayer),
        title: `${label} Prayer`,
        body:
          reminderPrefs.offsetMinutes === 0
            ? `It's time for ${label} prayer.`
            : `${label} prayer is in ${reminderPrefs.offsetMinutes} minutes.`,
        schedule: { at: fireAt },
      });
    }
  }

  if (notifications.length > 0) {
    await LocalNotifications.schedule({ notifications });
  }
  await setSetting(
    SCHEDULED_IDS_KEY,
    notifications.map((n) => n.id),
  );

  return { scheduled: notifications.length };
}

export async function cancelAllReminders(): Promise<void> {
  const previousIds = await getSetting<number[]>(SCHEDULED_IDS_KEY, []);
  if (previousIds.length > 0 && isNativePlatform()) {
    await LocalNotifications.cancel({ notifications: previousIds.map((id) => ({ id })) });
  }
  await setSetting(SCHEDULED_IDS_KEY, []);
}

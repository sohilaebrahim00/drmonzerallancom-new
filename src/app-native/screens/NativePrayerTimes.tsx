import { useEffect, useMemo, useState } from "react";
import { Bell, CircleNotch, MapPin, Sun } from "@phosphor-icons/react";

import { AppScreen } from "@/app-native/components/AppScreen";
import { NativeSheet } from "@/app-native/components/NativeSheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PRAYER_LABELS, PRAYER_NAMES, REMINDER_PRAYERS } from "@/config/prayer";
import { CITIES } from "@/data/cities";
import { useResolvedLocation } from "@/hooks/use-resolved-location";
import {
  computeUpcomingSchedule,
  findNextPrayer,
  formatCountdown,
  formatTimeInZone,
} from "@/services/prayerTimesService";
import {
  getReminderPrefs,
  requestNotificationPermission,
  rescheduleAllReminders,
  setReminderPrefs,
  type ReminderPrefs,
} from "@/services/prayerNotificationService";
import { cn } from "@/lib/utils";

export default function NativePrayerTimes() {
  const {
    prefs,
    coords,
    state: locationState,
    requesting,
    useMyLocation,
    pickCity,
  } = useResolvedLocation();
  const [now, setNow] = useState(() => new Date());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [reminderPrefs, setReminders] = useState<ReminderPrefs | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    getReminderPrefs().then(setReminders);
  }, []);

  const schedule = useMemo(() => {
    if (!coords || !prefs) return null;
    return computeUpcomingSchedule(coords, prefs);
  }, [coords, prefs]);

  const nextPrayer = useMemo(
    () => (schedule ? findNextPrayer(schedule, now) : null),
    [schedule, now],
  );
  const today = schedule?.[0];

  async function toggleReminder(prayer: (typeof REMINDER_PRAYERS)[number], enabled: boolean) {
    if (!reminderPrefs) return;
    const next = { ...reminderPrefs, enabled: { ...reminderPrefs.enabled, [prayer]: enabled } };
    setReminders(next);
    await setReminderPrefs(next);
    await requestNotificationPermission();
    if (coords && prefs) await rescheduleAllReminders(coords, prefs, next);
  }

  return (
    <AppScreen
      title="Prayer Times"
      back
      headerRight={
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          aria-label="Reminder settings"
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-navy"
        >
          <Bell className="h-4.5 w-4.5" />
        </button>
      }
      className="mx-auto w-full max-w-lg px-4 pb-6 pt-3"
    >
      {locationState === "resolving" && (
        <div className="flex justify-center py-16" role="status">
          <CircleNotch className="h-7 w-7 animate-spin text-primary" />
        </div>
      )}

      {(locationState === "needed" || locationState === "denied") && (
        <div className="rounded-2xl border border-border/70 bg-card p-5 text-center shadow-sm">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
            <MapPin className="h-5 w-5" />
          </span>
          <p className="mt-3 font-display text-base font-bold text-navy">
            Where should we calculate from?
          </p>
          {locationState === "denied" && (
            <p className="mt-1 text-xs text-muted-foreground">
              Location unavailable — choose a city.
            </p>
          )}
          <div className="mt-4 flex flex-col items-center gap-2.5">
            <Button
              onClick={useMyLocation}
              disabled={requesting}
              className="w-full max-w-xs cursor-pointer"
            >
              {requesting ? (
                <CircleNotch className="h-4 w-4 animate-spin" />
              ) : (
                <MapPin className="h-4 w-4" />
              )}
              Use My Location
            </Button>
            <select
              aria-label="Choose a city"
              defaultValue=""
              onChange={(e) => e.target.value && pickCity(e.target.value)}
              className="h-10 w-full max-w-xs rounded-full border border-border bg-background px-4 text-sm text-navy outline-none"
            >
              <option value="" disabled>
                Choose a city instead…
              </option>
              {CITIES.map((city) => (
                <option key={city.name} value={city.name}>
                  {city.name}, {city.country}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {today && nextPrayer && (
        <>
          <div className="rounded-2xl border border-turquoise/40 bg-gradient-to-br from-navy to-primary p-5 text-white shadow-sm">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-turquoise">
              <Sun className="h-3.5 w-3.5" /> Next Prayer
            </div>
            <p className="mt-1.5 font-display text-3xl font-extrabold">
              {PRAYER_LABELS[nextPrayer.name]}
            </p>
            <p className="mt-1 text-sm text-white/80">
              {formatTimeInZone(nextPrayer.time, coords?.timezone)} ·{" "}
              {formatCountdown(nextPrayer.time, now)} remaining
            </p>
          </div>

          <div className="mt-3 flex items-center gap-1.5 px-0.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {prefs?.manualCity ? prefs.manualCity.name : "Your current location"}
          </div>

          <div className="mt-2 rounded-2xl border border-border/70 bg-card p-2 shadow-sm">
            {PRAYER_NAMES.map((name) => {
              const isNext =
                nextPrayer.name === name &&
                today.times[name].getTime() === nextPrayer.time.getTime();
              return (
                <div
                  key={name}
                  className={cn(
                    "flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm",
                    isNext && "bg-secondary",
                  )}
                >
                  <span className={cn("font-semibold", isNext ? "text-primary" : "text-navy")}>
                    {PRAYER_LABELS[name]}
                  </span>
                  <span className={cn(isNext ? "font-bold text-primary" : "text-muted-foreground")}>
                    {formatTimeInZone(today.times[name], coords?.timezone)}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}

      <NativeSheet open={sheetOpen} onOpenChange={setSheetOpen} title="Prayer Reminders">
        {reminderPrefs &&
          REMINDER_PRAYERS.map((prayer) => (
            <div key={prayer} className="flex items-center justify-between py-2.5">
              <span className="text-sm font-semibold text-navy">{PRAYER_LABELS[prayer]}</span>
              <Switch
                checked={reminderPrefs.enabled[prayer]}
                onCheckedChange={(c) => toggleReminder(prayer, c)}
              />
            </div>
          ))}
      </NativeSheet>
    </AppScreen>
  );
}

import { useEffect, useState } from "react";

import { AppScreen } from "@/app-native/components/AppScreen";
import {
  CALCULATION_METHODS,
  MADHABS,
  type CalculationMethodId,
  type MadhabId,
} from "@/config/prayer";
import { CITIES } from "@/data/cities";
import { useResolvedLocation } from "@/hooks/use-resolved-location";
import { getPrayerPrefs, setPrayerPrefs, type PrayerPrefs } from "@/services/prayerTimesService";
import { getReminderPrefs, rescheduleAllReminders } from "@/services/prayerNotificationService";

export default function NativePrayerSettings() {
  const { coords } = useResolvedLocation();
  const [prefs, setPrefs] = useState<PrayerPrefs | null>(null);

  useEffect(() => {
    getPrayerPrefs().then(setPrefs);
  }, []);

  async function updatePrefs(patch: Partial<PrayerPrefs>) {
    if (!prefs) return;
    const next = { ...prefs, ...patch };
    setPrefs(next);
    await setPrayerPrefs(next);
    if (coords) {
      const reminderPrefs = await getReminderPrefs();
      await rescheduleAllReminders(coords, next, reminderPrefs);
    }
  }

  if (!prefs) return null;

  return (
    <AppScreen title="Prayer Settings" back className="mx-auto w-full max-w-lg px-4 py-4">
      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Calculation Method
          </label>
          <select
            value={prefs.calculationMethod}
            onChange={(e) =>
              updatePrefs({ calculationMethod: e.target.value as CalculationMethodId })
            }
            className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-navy outline-none"
          >
            {CALCULATION_METHODS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Asr Method (Madhab)
          </label>
          <select
            value={prefs.madhab}
            onChange={(e) => updatePrefs({ madhab: e.target.value as MadhabId })}
            className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-navy outline-none"
          >
            {MADHABS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Location
          </label>
          <select
            value={prefs.manualCity?.name ?? ""}
            onChange={(e) => {
              const city = CITIES.find((c) => c.name === e.target.value) ?? null;
              updatePrefs({ manualCity: city });
            }}
            className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-navy outline-none"
          >
            <option value="">Use device location</option>
            {CITIES.map((city) => (
              <option key={city.name} value={city.name}>
                {city.name}, {city.country}
              </option>
            ))}
          </select>
        </div>
      </div>
    </AppScreen>
  );
}

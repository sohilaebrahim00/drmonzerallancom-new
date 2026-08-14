import { useEffect, useState } from "react";

import { CITIES } from "@/data/cities";
import {
  coordsFromPrefs,
  getPrayerPrefs,
  requestDeviceLocation,
  setPrayerPrefs,
  type Coords,
  type PrayerPrefs,
} from "@/services/prayerTimesService";

export type LocationState = "resolving" | "needed" | "granted" | "denied" | "manual";

/**
 * Shared "where is the user" resolution used by both Prayer Times and
 * Qibla: manual-city preference first (no permission prompt), otherwise the
 * visitor explicitly taps "Use My Location" on whichever screen they're on.
 * Persisted once via `prayer.prefs.manualCity` — deliberately shared between
 * the two features rather than asking the visitor to pick a city twice.
 */
export function useResolvedLocation() {
  const [prefs, setPrefs] = useState<PrayerPrefs | null>(null);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [state, setState] = useState<LocationState>("resolving");
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getPrayerPrefs().then((loaded) => {
      if (cancelled) return;
      setPrefs(loaded);
      const manual = coordsFromPrefs(loaded);
      if (manual) {
        setCoords(manual);
        setState("manual");
      } else {
        setState("needed");
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function useMyLocation() {
    setRequesting(true);
    const outcome = await requestDeviceLocation();
    setRequesting(false);
    if (outcome.status === "granted") {
      setCoords(outcome.coords);
      setState("granted");
    } else {
      setState("denied");
    }
  }

  async function pickCity(cityName: string) {
    if (!prefs) return;
    const city = CITIES.find((c) => c.name === cityName);
    if (!city) return;
    const nextPrefs = { ...prefs, manualCity: city };
    setPrefs(nextPrefs);
    await setPrayerPrefs(nextPrefs);
    setCoords({ latitude: city.latitude, longitude: city.longitude, timezone: city.timezone });
    setState("manual");
  }

  return { prefs, coords, state, requesting, useMyLocation, pickCity };
}

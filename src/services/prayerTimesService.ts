import { CalculationMethod, Coordinates, Madhab, PrayerTimes } from "adhan";
import { Geolocation } from "@capacitor/geolocation";

import {
  DEFAULT_CALCULATION_METHOD,
  DEFAULT_MADHAB,
  PRAYER_NAMES,
  PRAYER_SCHEDULE_LOOKAHEAD_DAYS,
  type CalculationMethodId,
  type MadhabId,
  type PrayerName,
} from "@/config/prayer";
import { CITIES, type City } from "@/data/cities";
import { getSetting, setSetting } from "@/services/appSettingsService";

const PREFS_KEY = "prayer.prefs";

export interface PrayerPrefs {
  calculationMethod: CalculationMethodId;
  madhab: MadhabId;
  /** Set once the visitor picks a fallback city (denied/unavailable location). */
  manualCity: City | null;
}

const DEFAULT_PREFS: PrayerPrefs = {
  calculationMethod: DEFAULT_CALCULATION_METHOD,
  madhab: DEFAULT_MADHAB,
  manualCity: null,
};

export interface Coords {
  latitude: number;
  longitude: number;
  /** IANA timezone, when known (from a manually-picked city). Device GPS
   * coordinates use the browser/device's own current timezone instead. */
  timezone?: string;
}

export async function getPrayerPrefs(): Promise<PrayerPrefs> {
  return getSetting(PREFS_KEY, DEFAULT_PREFS);
}

export async function setPrayerPrefs(prefs: PrayerPrefs): Promise<void> {
  await setSetting(PREFS_KEY, prefs);
}

export type LocationOutcome =
  | { status: "granted"; coords: Coords }
  | { status: "denied" }
  | { status: "unavailable" };

/**
 * Requests device location ONLY when called — never on app launch. Callers
 * (Prayer Times / Qibla screens) trigger this from an explicit user action
 * on that screen, matching the "don't request permission just to open the
 * app" requirement.
 */
export async function requestDeviceLocation(): Promise<LocationOutcome> {
  try {
    const permission = await Geolocation.checkPermissions();
    let status = permission.location;
    if (status === "prompt" || status === "prompt-with-rationale") {
      const requested = await Geolocation.requestPermissions();
      status = requested.location;
    }
    if (status !== "granted") return { status: "denied" };

    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: false,
      timeout: 10000,
    });
    return {
      status: "granted",
      coords: { latitude: position.coords.latitude, longitude: position.coords.longitude },
    };
  } catch {
    return { status: "unavailable" };
  }
}

/** Resolves usable coordinates from the current prefs — manual city only, no device call. */
export function coordsFromPrefs(prefs: PrayerPrefs): Coords | null {
  if (!prefs.manualCity) return null;
  return {
    latitude: prefs.manualCity.latitude,
    longitude: prefs.manualCity.longitude,
    timezone: prefs.manualCity.timezone,
  };
}

export function findCityByName(name: string): City | undefined {
  return CITIES.find((c) => c.name === name);
}

function buildParams(prefs: PrayerPrefs) {
  const params = CalculationMethod[prefs.calculationMethod]();
  params.madhab = prefs.madhab === "Hanafi" ? Madhab.Hanafi : Madhab.Shafi;
  return params;
}

export type PrayerTimesForDay = Record<PrayerName, Date>;

export function computePrayerTimesForDate(
  coords: Coords,
  date: Date,
  prefs: PrayerPrefs,
): PrayerTimesForDay {
  const coordinates = new Coordinates(coords.latitude, coords.longitude);
  const params = buildParams(prefs);
  const times = new PrayerTimes(coordinates, date, params);
  return {
    fajr: times.fajr,
    sunrise: times.sunrise,
    dhuhr: times.dhuhr,
    asr: times.asr,
    maghrib: times.maghrib,
    isha: times.isha,
  };
}

/** Precomputes several upcoming days — used both for display and for scheduling reminders. */
export function computeUpcomingSchedule(
  coords: Coords,
  prefs: PrayerPrefs,
  days: number = PRAYER_SCHEDULE_LOOKAHEAD_DAYS,
): { date: Date; times: PrayerTimesForDay }[] {
  const schedule: { date: Date; times: PrayerTimesForDay }[] = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  for (let i = 0; i < days; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    schedule.push({ date, times: computePrayerTimesForDate(coords, date, prefs) });
  }
  return schedule;
}

export interface NextPrayer {
  name: PrayerName;
  time: Date;
}

/** Finds the next upcoming prayer, rolling over to tomorrow's Fajr after tonight's Isha. */
export function findNextPrayer(
  schedule: { date: Date; times: PrayerTimesForDay }[],
  now: Date = new Date(),
): NextPrayer | null {
  for (const day of schedule) {
    for (const name of PRAYER_NAMES) {
      const time = day.times[name];
      if (time.getTime() > now.getTime()) {
        return { name, time };
      }
    }
  }
  return null;
}

export function formatCountdown(target: Date, now: Date = new Date()): string {
  const diffMs = Math.max(target.getTime() - now.getTime(), 0);
  const totalMinutes = Math.round(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `in ${minutes}m`;
  return `in ${hours}h ${minutes}m`;
}

export function formatTimeInZone(date: Date, timezone?: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: timezone,
  }).format(date);
}

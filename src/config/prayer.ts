export const PRAYER_NAMES = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"] as const;
export type PrayerName = (typeof PRAYER_NAMES)[number];

/** Sunrise is informational only — it isn't a prayer, so it's excluded from reminders. */
export const REMINDER_PRAYERS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
export type ReminderPrayerName = (typeof REMINDER_PRAYERS)[number];

export const PRAYER_LABELS: Record<PrayerName, string> = {
  fajr: "Fajr",
  sunrise: "Sunrise",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
};

export const CALCULATION_METHODS = [
  { id: "MuslimWorldLeague", label: "Muslim World League" },
  { id: "Egyptian", label: "Egyptian General Authority" },
  { id: "Karachi", label: "University of Islamic Sciences, Karachi" },
  { id: "UmmAlQura", label: "Umm Al-Qura University, Makkah" },
  { id: "Dubai", label: "Dubai (UAE)" },
  { id: "MoonsightingCommittee", label: "Moonsighting Committee" },
  { id: "NorthAmerica", label: "ISNA (North America)" },
  { id: "Kuwait", label: "Kuwait" },
  { id: "Qatar", label: "Qatar" },
  { id: "Singapore", label: "Singapore" },
  { id: "Tehran", label: "Tehran" },
  { id: "Turkey", label: "Turkey (Diyanet)" },
] as const;
export type CalculationMethodId = (typeof CALCULATION_METHODS)[number]["id"];
export const DEFAULT_CALCULATION_METHOD: CalculationMethodId = "MuslimWorldLeague";

export const MADHABS = [
  { id: "Shafi", label: "Shafi'i / Maliki / Hanbali" },
  { id: "Hanafi", label: "Hanafi" },
] as const;
export type MadhabId = (typeof MADHABS)[number]["id"];
export const DEFAULT_MADHAB: MadhabId = "Shafi";

export const REMINDER_OFFSETS = [
  { minutes: 0, label: "At prayer time" },
  { minutes: 5, label: "5 minutes before" },
  { minutes: 10, label: "10 minutes before" },
  { minutes: 15, label: "15 minutes before" },
] as const;
export type ReminderOffsetMinutes = (typeof REMINDER_OFFSETS)[number]["minutes"];
/** Non-intrusive by default, per spec: reminders fire at prayer time unless the user changes it. */
export const DEFAULT_REMINDER_OFFSET_MINUTES: ReminderOffsetMinutes = 0;

/** Standard, widely-published Kaaba reference coordinates (Great Mosque, Mecca). */
export const KAABA_COORDINATES = { latitude: 21.4225, longitude: 39.8262 };

/** How many upcoming days of prayer times to precompute for local notification scheduling. */
export const PRAYER_SCHEDULE_LOOKAHEAD_DAYS = 3;

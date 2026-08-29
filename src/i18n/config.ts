/**
 * The two locales this site ships, and everything that differs between them.
 *
 * Deliberately not react-i18next: with three build targets and a service-worker
 * precache already close to its budget, the library's weight buys us features
 * we do not use. What we actually need is a dictionary, a fallback, a persisted
 * choice, and `dir` — plus correct plurals and locale-aware dates, which the
 * platform gives us for free via Intl.
 */
export const LOCALES = ["en", "ar"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

interface LocaleMeta {
  /** Shown in the language switcher, always in the language it selects. */
  readonly label: string;
  readonly dir: "ltr" | "rtl";
  /**
   * The tag handed to Intl — NOT the same as the locale code.
   *
   * `ar-u-nu-latn` pins the numbering system to Latin digits. Bare `ar`
   * currently resolves to `latn` in CLDR, but `ar-EG` and `ar-SA` resolve to
   * `arab` (١٢٣), and the bare-`ar` default is a CLDR decision that can change
   * under us. Pinning it explicitly costs nothing and removes the question.
   *
   * Latin digits are the deliberate choice here: prices are USD and the
   * doctor's own printed materials use Latin numerals, so Arabic-Indic digits
   * next to a currency symbol would read as a mistake rather than a
   * translation.
   */
  readonly intlTag: string;
}

export const LOCALE_META: Readonly<Record<Locale, LocaleMeta>> = {
  en: { label: "English", dir: "ltr", intlTag: "en-US" },
  ar: { label: "العربية", dir: "rtl", intlTag: "ar-u-nu-latn" },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function dirOf(locale: Locale): "ltr" | "rtl" {
  return LOCALE_META[locale].dir;
}

export function intlTagOf(locale: Locale): string {
  return LOCALE_META[locale].intlTag;
}

import { DEFAULT_LOCALE, type Locale } from "./config";

/**
 * Routes that render in English regardless of the reader's language.
 *
 * WHY THESE AND NOT OTHERS. The public site is translated. The signed-in area
 * is not: the account pages carry ~50 strings of untranslated chrome, and
 * translating that chrome would not make the page Arabic anyway, because the
 * content beside it — the doctor's program notes, consultation records and the
 * patient's own intake answers — is written in English by the people who wrote
 * it. A half-Arabic account page is the mixed state that reads as broken.
 *
 * The pages that were three strings from finished were translated instead. A
 * guard for those would have been more code than the translation.
 *
 * WHAT THIS OVERRIDES, precisely: the RENDERED locale, never the STORED
 * preference. A reader who chose Arabic, opened their account and went back to
 * a public page is still in Arabic. A preference that quietly erases itself is
 * the `__force_app_preview` shape and we are not shipping it twice.
 */
const ENGLISH_ONLY_PREFIXES = [
  "/account",
  "/my-program",
  // Staff surfaces, English by definition and out of translation scope.
  "/doctor",
  "/admin",
];

export function isEnglishOnlyRoute(pathname: string): boolean {
  return ENGLISH_ONLY_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

/**
 * The locale a given route should RENDER in, given what the reader asked for.
 * Everything that follows from the locale — strings, `dir`, `lang` — is derived
 * from this one value, so the direction can never disagree with the text.
 */
export function renderLocaleFor(pathname: string, requested: Locale): Locale {
  return isEnglishOnlyRoute(pathname) ? DEFAULT_LOCALE : requested;
}

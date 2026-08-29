import { DEFAULT_LOCALE, isLocale, type Locale } from "./config";
import { SHOW_LANGUAGE_SWITCH } from "@/config/features";

const STORAGE_KEY = "monzer.locale";

/**
 * Reading localStorage can throw, not just return null — Safari in private
 * mode and a WebView with site data blocked both raise on access. A language
 * preference is never worth taking the app down for.
 */
function safeRead(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeWrite(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* preference simply will not persist; the session still works */
  }
}

export function readStoredLocale(): Locale | null {
  const stored = safeRead(STORAGE_KEY);
  return isLocale(stored) ? stored : null;
}

export function storeLocale(locale: Locale): void {
  safeWrite(STORAGE_KEY, locale);
}

/**
 * An explicit choice always wins. Only a visitor who has never chosen gets
 * matched against their browser languages, and only on a language subtag, so
 * `ar-EG`, `ar-SA` and `ar` all land on Arabic.
 *
 * NOTE: when the `/ar/...` URL strategy from FIX_PLAN 5.1 is decided, the path
 * becomes the highest-priority source and slots in above the stored choice.
 * That is why resolution lives here rather than inside the provider.
 */
/**
 * An explicit `?lang=ar` in the URL, which overrides everything.
 *
 * This exists so the RTL layout stays reviewable on a real production build
 * while the switch is hidden — by me in tests, and by the owner when he wants
 * to see progress. It is deliberately not discoverable: no link points at it,
 * and an ordinary visitor will never type it.
 */
function readLocaleFromQuery(): Locale | null {
  if (typeof window === "undefined") return null;
  try {
    const value = new URLSearchParams(window.location.search).get("lang");
    return isLocale(value) ? value : null;
  } catch {
    return null;
  }
}

export function detectInitialLocale(): Locale {
  const forced = readLocaleFromQuery();
  if (forced) return forced;

  /**
   * While the switch is hidden, resolve to English and ignore every other
   * signal.
   *
   * Hiding the control alone would not have been enough, and the stored
   * preference is not even the worst case:
   *   - a visitor who already switched has "ar" in localStorage and would keep
   *     landing on a right-to-left English page with no way back, because the
   *     control that would let them undo it is gone;
   *   - worse, a visitor whose BROWSER is set to Arabic would be sent there on
   *     their very first visit without ever having opted in — and Arabic
   *     speakers are exactly this practice's audience, so that is the common
   *     case, not the edge one.
   *
   * The stored value is left untouched rather than cleared, so a visitor who
   * chose Arabic before gets it back automatically when the flag flips.
   */
  if (!SHOW_LANGUAGE_SWITCH) return DEFAULT_LOCALE;

  const stored = readStoredLocale();
  if (stored) return stored;

  if (typeof navigator !== "undefined") {
    const candidates = navigator.languages?.length ? navigator.languages : [navigator.language];
    for (const tag of candidates) {
      const base = tag?.split("-")[0]?.toLowerCase();
      if (isLocale(base)) return base;
    }
  }

  return DEFAULT_LOCALE;
}

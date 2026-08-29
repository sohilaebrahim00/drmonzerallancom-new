import { DEFAULT_LOCALE, isLocale, type Locale } from "./config";

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
export function detectInitialLocale(): Locale {
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

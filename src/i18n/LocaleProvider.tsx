import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { dirOf, type Locale } from "./config";
import { detectInitialLocale, storeLocale } from "./detect";
import { LocaleContext, type LocaleContextValue } from "./context";
import { createTranslator, isDictionaryLoaded, loadDictionary } from "./translate";
import { formatDate, formatNumber, formatPrice } from "./format";
import { arabicCoverage } from "./coverage";

export function LocaleProvider({ children }: { children: ReactNode }) {
  // Read once, lazily: detection touches localStorage and navigator, and
  // re-running it on every render would be both wasteful and wrong once the
  // visitor has switched away from their browser default.
  const [locale, setLocaleState] = useState<Locale>(() => detectInitialLocale());

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    storeLocale(next);
  }, []);

  /**
   * Non-English dictionaries are separate chunks, so there is a moment where
   * the locale is Arabic and its strings have not arrived.
   *
   * We hold the tree rather than painting English and swapping. Swapping would
   * not just replace words — it flips `dir` on <html>, so the whole layout
   * would mirror in front of the reader. A brief hold is the smaller cost, and
   * it only ever applies to a reader who asked for Arabic.
   *
   * The memoised `t` deliberately does NOT depend on load state: the translator
   * looks the dictionary up when it is CALLED, not when it is created, and the
   * gate below guarantees nothing renders before the chunk has settled.
   */
  const [settledLocale, setSettledLocale] = useState<Locale | null>(null);

  /**
   * Ready means "we are done waiting", NOT "the dictionary arrived". A locale
   * whose chunk failed to load is also ready: every key falls back to English,
   * so the reader gets an English page. Blocking forever on a flaky connection
   * would be the worse failure, and gating on `isDictionaryLoaded` alone would
   * do exactly that.
   */
  const ready = isDictionaryLoaded(locale) || settledLocale === locale;

  useEffect(() => {
    if (isDictionaryLoaded(locale)) return;
    let cancelled = false;
    loadDictionary(locale)
      .catch(() => {
        /* handled by the fallback described above */
      })
      .finally(() => {
        if (!cancelled) setSettledLocale(locale);
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  /**
   * `lang` and `dir` go on <html>, not on a wrapper div. Screen readers take
   * the pronunciation language from the document element, and `dir` there is
   * what flips Tailwind's `rtl:` variants and logical properties for the whole
   * tree — including anything portalled outside the React root, which a
   * wrapper div would miss (dialogs, toasts, the command menu).
   */
  useEffect(() => {
    const root = document.documentElement;
    root.lang = locale;
    root.dir = dirOf(locale);
  }, [locale]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    // Only meaningful once the Arabic chunk has actually landed; before that
    // every key would read as missing.
    if (!isDictionaryLoaded("ar")) return;
    const { translated, total, missing } = arabicCoverage();
    if (missing > 0) {
      console.info(
        `[i18n] Arabic: ${translated}/${total} keys translated, ${missing} falling back to English.`,
      );
    }
  }, [settledLocale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      dir: dirOf(locale),
      setLocale,
      t: createTranslator(locale),
      formatDate: (v, options) => formatDate(v, locale, options),
      formatNumber: (v, options) => formatNumber(v, locale, options),
      formatPrice,
    }),
    [locale, setLocale],
  );

  /**
   * Holding renders nothing for one paint. On a locale SWITCH this also
   * unmounts and remounts the tree, which loses in-progress form state — worth
   * knowing before the switch is turned on. Preloading the Arabic chunk when
   * the switch becomes visible would avoid it.
   */
  if (!ready) return null;

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

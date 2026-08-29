import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { dirOf, type Locale } from "./config";
import { detectInitialLocale, storeLocale } from "./detect";
import { LocaleContext, type LocaleContextValue } from "./context";
import { createTranslator } from "./translate";
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
    const { translated, total, missing } = arabicCoverage();
    if (missing > 0) {
      console.info(
        `[i18n] Arabic: ${translated}/${total} keys translated, ${missing} falling back to English.`,
      );
    }
  }, []);

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

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

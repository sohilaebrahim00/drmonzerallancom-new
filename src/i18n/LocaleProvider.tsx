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
   * REQUESTED vs RENDERED locale.
   *
   * Non-English dictionaries are separate chunks, so between "the reader asked
   * for Arabic" and "Arabic can be drawn" there is a gap. `locale` is what they
   * asked for; `activeLocale` is what the tree is currently rendered in, and it
   * only advances once the new dictionary has settled.
   *
   * THIS EXISTS TO PROTECT THE PURCHASE FORM. The previous version unmounted
   * the whole tree while the chunk was in flight. The switch sits in the header
   * on every page, including the one with the name, email and phone fields on
   * it, so a customer part-way through paying who decided they would rather
   * read in Arabic lost everything they had typed. A translation arriving a
   * beat late is a small cost; a half-typed phone number disappearing on a site
   * taking real payments is not, and some of those people do not start again.
   *
   * So nothing unmounts on a switch. The page keeps rendering in the locale it
   * already had — coherently, with matching `lang` and `dir` — and flips to the
   * new one atomically when it is ready. React keeps every form input mounted
   * throughout, so their values survive by construction rather than by our
   * remembering to save them.
   */
  const [activeLocale, setActiveLocale] = useState<Locale>(locale);
  const [firstPaintDone, setFirstPaintDone] = useState(() => isDictionaryLoaded(locale));

  useEffect(() => {
    if (isDictionaryLoaded(locale)) {
      setActiveLocale(locale);
      setFirstPaintDone(true);
      return;
    }
    let cancelled = false;
    loadDictionary(locale)
      .then(() => {
        if (!cancelled) setActiveLocale(locale);
      })
      .catch(() => {
        /*
         * THE CHUNK NEVER ARRIVED. Do NOT advance.
         *
         * Advancing would set lang/dir to Arabic while every string still
         * resolved to its English fallback — a mirrored, right-to-left English
         * checkout page. Measured, and it is worse than the switch appearing
         * not to take: the reader can still read and complete an unchanged
         * English page, and cannot easily read a flipped one.
         *
         * So the page stays exactly as it was. The requested locale is rolled
         * back so the control reflects what is actually on screen rather than
         * showing Arabic selected on an English page, and the reader can try
         * again. Nothing unmounts either way, so the form keeps its contents.
         */
        if (!cancelled) setLocaleState(activeLocale);
      })
      .finally(() => {
        if (!cancelled) setFirstPaintDone(true);
      });
    return () => {
      cancelled = true;
    };
  }, [locale, activeLocale]);

  /**
   * `lang` and `dir` go on <html>, not on a wrapper div. Screen readers take
   * the pronunciation language from the document element, and `dir` there is
   * what flips Tailwind's `rtl:` variants and logical properties for the whole
   * tree — including anything portalled outside the React root, which a
   * wrapper div would miss (dialogs, toasts, the command menu).
   */
  useEffect(() => {
    const root = document.documentElement;
    root.lang = activeLocale;
    root.dir = dirOf(activeLocale);
  }, [activeLocale]);

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
  }, [activeLocale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale: activeLocale,
      dir: dirOf(activeLocale),
      setLocale,
      t: createTranslator(activeLocale),
      formatDate: (v, options) => formatDate(v, activeLocale, options),
      formatNumber: (v, options) => formatNumber(v, activeLocale, options),
      formatPrice,
    }),
    [activeLocale, setLocale],
  );

  /*
   * Only the FIRST paint may hold, and only when there is nothing on screen to
   * lose. A later switch never reaches this line: activeLocale simply lags
   * until the chunk lands, so the tree — and every form input in it — stays
   * mounted throughout.
   */
  if (!firstPaintDone) return null;

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

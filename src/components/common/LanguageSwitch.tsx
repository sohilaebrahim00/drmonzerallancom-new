import { useState } from "react";

import { LOCALES, LOCALE_META, type Locale } from "@/i18n";
import { useLocale } from "@/i18n";
import { isDictionaryLoaded, loadDictionary } from "@/i18n/translate";
import { cn } from "@/lib/utils";
import { SHOW_LANGUAGE_SWITCH } from "@/config/features";

/**
 * The language switch.
 *
 * Each language is labelled in ITS OWN SCRIPT — العربية and English — never a
 * flag. Flags are countries; Arabic is spoken across more than twenty of them,
 * and picking one to stand for the language is both wrong and pointed.
 *
 * It changes state only. Nothing reloads and the route is untouched, so a
 * visitor reading /blog/how-much-protein stays exactly where they were. (Once
 * PHASE 13 gives Arabic its own /ar/* URLs this becomes a navigation instead,
 * and that is the phase that has to rewrite the current path.)
 *
 * Rendered as a two-option segmented control rather than a dropdown: with
 * exactly two languages a menu hides the choice behind a click for no gain,
 * and the brief asks for it to be visible without opening anything on mobile.
 */
export function LanguageSwitch({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();

  /**
   * Which language is being fetched right now, if any.
   *
   * THIS EXISTS BECAUSE TOUCH HAS NO HOVER. The preload below buys a desktop
   * reader a comfortable head start, and buys a touch reader almost nothing:
   * pointerdown fires as the finger lands, so the fetch and the tap are
   * simultaneous and a phone on a slow connection always takes the waiting
   * path. That path is safe — the page stays readable and no form loses its
   * contents — but it is SILENT, and a button that appears to do nothing gets
   * tapped again.
   */
  const [pendingLocale, setPendingLocale] = useState<Locale | null>(null);

  /**
   * Fetch the other language the moment someone shows intent, so the switch
   * has nothing to wait for when they actually click.
   *
   * ON INTENT, NOT ON MOUNT. Preloading when the header renders would hand the
   * Arabic chunk to every English visitor on every page — 18 KB gzipped for a
   * language most of them will never select, which is the exact cost the
   * dictionary split was done to remove. Hover and focus give a desktop reader
   * a comfortable head start; pointerdown gives a touch reader the gap between
   * finger-down and finger-up. If neither is enough, nothing breaks: the
   * provider keeps rendering the current language until the chunk lands.
   */
  const preload = (code: Locale) => {
    if (code === locale) return;
    void loadDictionary(code).catch(() => {
      /* The switch still works; the provider falls back to English per key. */
    });
  };

  /**
   * Switch, showing the wait when there is one.
   *
   * The dictionary is fetched HERE rather than left to the provider, so the
   * control knows when it is finished and can say so. If the chunk never
   * arrives the language is left alone — better a switch that visibly did not
   * take than a mirrored right-to-left English page.
   */
  const choose = (code: Locale) => {
    if (code === locale || pendingLocale) return;
    if (isDictionaryLoaded(code)) {
      setLocale(code);
      return;
    }
    setPendingLocale(code);
    loadDictionary(code)
      .then(() => setLocale(code))
      .catch(() => {
        /* Language unchanged. The reader can tap again. */
      })
      .finally(() => setPendingLocale(null));
  };

  /**
   * Hidden until the dictionaries cover the IN list — see SHOW_LANGUAGE_SWITCH
   * in src/config/features.ts for the removal condition and who decides it.
   * Returning null here hides the CONTROL only; the provider, dir/lang, the
   * Arabic font and every rtl: variant underneath stay live.
   */
  if (!SHOW_LANGUAGE_SWITCH) return null;

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-card/60 p-0.5 backdrop-blur-sm",
        className,
      )}
      role="group"
      aria-label="Language"
    >
      {LOCALES.map((code: Locale) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            onClick={() => choose(code)}
            onPointerEnter={() => preload(code)}
            onPointerDown={() => preload(code)}
            onFocus={() => preload(code)}
            aria-pressed={active}
            aria-busy={pendingLocale === code || undefined}
            disabled={pendingLocale !== null}
            /* lang on the button so a screen reader pronounces "العربية" with
               Arabic phonetics rather than spelling it out in English. */
            lang={code}
            /* The Arabic label gets a six-glyph face of its own — see
               fonts-arabic.css. Without it, one word costs an English visitor
               a whole Arabic font. */
            data-label-locale={code}
            className={cn(
              "cursor-pointer rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
              code === "ar" && "lang-switch-label-ar",
              /* The wait is shown ON THE CONTROL, not as an overlay: the page
                 itself is fine and readable, and covering it would be a lie
                 about what is happening. */
              pendingLocale === code && "animate-pulse opacity-70",
              pendingLocale !== null && pendingLocale !== code && "opacity-40",
              active ? "bg-primary text-primary-foreground" : "text-navy/70 hover:text-turquoise",
            )}
          >
            {LOCALE_META[code].label}
          </button>
        );
      })}
    </div>
  );
}

import { LOCALES, LOCALE_META, type Locale } from "@/i18n";
import { useLocale } from "@/i18n";
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
            onClick={() => setLocale(code)}
            aria-pressed={active}
            /* lang on the button so a screen reader pronounces "العربية" with
               Arabic phonetics rather than spelling it out in English. */
            lang={code}
            className={cn(
              "cursor-pointer rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
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

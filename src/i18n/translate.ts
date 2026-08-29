import { DEFAULT_LOCALE, intlTagOf, type Locale } from "./config";
import { isPluralEntry, type Entry, type TranslationParams } from "./types";
import { en, type TranslationKey } from "./dictionaries/en";
import { ar } from "./dictionaries/ar";

const DICTIONARIES: Record<Locale, Partial<Record<TranslationKey, Entry>>> = { en, ar };

/** Dev-only: one warning per missing key, not one per render. */
const warned = new Set<string>();

/**
 * Intl objects are expensive to construct and are used per render, so they are
 * built once per locale and kept.
 */
const pluralRulesCache = new Map<Locale, Intl.PluralRules>();

function pluralRulesFor(locale: Locale): Intl.PluralRules {
  let rules = pluralRulesCache.get(locale);
  if (!rules) {
    rules = new Intl.PluralRules(intlTagOf(locale));
    pluralRulesCache.set(locale, rules);
  }
  return rules;
}

const numberFormatCache = new Map<Locale, Intl.NumberFormat>();

function formatCount(value: number, locale: Locale): string {
  let nf = numberFormatCache.get(locale);
  if (!nf) {
    nf = new Intl.NumberFormat(intlTagOf(locale));
    numberFormatCache.set(locale, nf);
  }
  return nf.format(value);
}

/**
 * Chooses the plural form for `count` in `locale`.
 *
 * The category table is the platform's, never ours — `Intl.PluralRules` ships
 * with the browser and already knows that Arabic sends 3 to `few` and 11 to
 * `many`. Falling back to `other` covers a translator who filled in some forms
 * but not all, which is the normal state of a dictionary mid-translation.
 */
function selectForm(forms: Exclude<Entry, string>, count: number, locale: Locale): string {
  const category = pluralRulesFor(locale).select(count);
  return forms[category] ?? forms.other;
}

/**
 * Bidi isolation for interpolated values.
 *
 * U+2068 FIRST STRONG ISOLATE ... U+2069 POP DIRECTIONAL ISOLATE. The browser
 * treats what is between them as a self-contained run, takes its direction
 * from its own first strong character, and — crucially — does not let the
 * neutral characters on either side of it reorder.
 *
 * WHY NOT <bdi>: `t()` returns a string, not JSX, so an element cannot be
 * injected into the middle of one. These two characters are exactly what <bdi>
 * compiles down to in the bidi algorithm, they need no wrapper component, and
 * they work identically in an attribute (`aria-label`, `placeholder`) where an
 * element could not go at all.
 *
 * WHAT IT FIXES: "تم العثور على {count} سؤال" with count=17 is an Arabic
 * sentence containing a Latin-digit run. Without isolation the digits and the
 * neutral characters beside them can reorder — the classic "17" landing on the
 * wrong side of its own sentence. The same applies to any Latin value we
 * interpolate later: a price, "Google Meet", an email address.
 *
 * They are invisible, so they change rendering and nothing else. Do not use
 * `t()` output as a key for comparison or in a URL without stripping them.
 */
const FSI = "\u2068";
const PDI = "\u2069";

function interpolate(template: string, params: TranslationParams, locale: Locale): string {
  return template.replace(/\{(\w+)\}/g, (whole, name: string) => {
    const value = params[name];
    if (value === undefined) return whole;
    const rendered = typeof value === "number" ? formatCount(value, locale) : value;
    return FSI + rendered + PDI;
  });
}

/**
 * Call-site typing: a plural key REQUIRES `count`, a plain key does not accept
 * it. This is the part of react-i18next worth reproducing — forgetting `count`
 * on a plural key is the mistake that silently ships "{count} questions found"
 * with the braces still in it.
 */
export type ParamsFor<K extends TranslationKey> = (typeof en)[K] extends string
  ? [params?: TranslationParams]
  : [params: TranslationParams & { count: number }];

export type TranslateFn = <K extends TranslationKey>(key: K, ...args: ParamsFor<K>) => string;

/**
 * Resolution order: the active locale, then English, then the key itself.
 *
 * Returning the key rather than an empty string is deliberate — a missing
 * translation should be obvious on screen and greppable in a bug report, not
 * an invisible blank where a sentence belonged.
 */
export function createTranslator(locale: Locale): TranslateFn {
  return <K extends TranslationKey>(key: K, ...args: ParamsFor<K>): string => {
    const params = (args[0] ?? {}) as TranslationParams;
    const own = DICTIONARIES[locale][key];
    const entry: Entry | undefined = own ?? DICTIONARIES[DEFAULT_LOCALE][key];

    /**
     * The case that actually happens: the key exists in English but not yet in
     * Arabic, so the visitor gets English rather than a hole. Warned once per
     * key in development so the gap is visible while translating, and silent
     * in production — a warning a visitor cannot act on is just noise in their
     * console.
     */
    if (import.meta.env.DEV && own === undefined && locale !== DEFAULT_LOCALE && !warned.has(key)) {
      warned.add(key);
      console.warn(
        `[i18n] "${key}" has no ${locale} translation — falling back to ${DEFAULT_LOCALE}. ` +
          `Add it to src/i18n/dictionaries/${locale}.ts.`,
      );
    }

    /**
     * Unreachable through the typed API: TranslationKey is `keyof typeof en`,
     * so a key missing from English is a compile error. This is the last
     * resort for an untyped call. It returns the KEY rather than an empty
     * string on purpose — a visible `faq.cta` is greppable and obviously
     * wrong, whereas a blank space is invisible and ships unnoticed.
     */
    if (entry === undefined) {
      if (import.meta.env.DEV) console.warn(`[i18n] "${key}" is missing from every dictionary.`);
      return key;
    }

    if (isPluralEntry(entry)) {
      const count = typeof params.count === "number" ? params.count : 0;
      // The plural category must come from the locale the STRING is in. When
      // Arabic is missing and we fell back to English, asking Arabic's rules
      // for a category would look for `few` in a two-form entry and land on
      // `other` — right by luck for 3, wrong for 1.
      const entryLocale: Locale = DICTIONARIES[locale][key] ? locale : DEFAULT_LOCALE;
      return interpolate(selectForm(entry, count, entryLocale), params, locale);
    }

    return interpolate(entry, params, locale);
  };
}

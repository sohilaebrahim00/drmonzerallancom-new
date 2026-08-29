import { DEFAULT_LOCALE, intlTagOf, type Locale } from "./config";
import { isPluralEntry, type Entry, type TranslationParams } from "./types";
import { en, type TranslationKey } from "./dictionaries/en";
import { ar } from "./dictionaries/ar";

const DICTIONARIES: Record<Locale, Partial<Record<TranslationKey, Entry>>> = { en, ar };

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

function interpolate(template: string, params: TranslationParams, locale: Locale): string {
  return template.replace(/\{(\w+)\}/g, (whole, name: string) => {
    const value = params[name];
    if (value === undefined) return whole;
    return typeof value === "number" ? formatCount(value, locale) : value;
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
    const entry: Entry | undefined = DICTIONARIES[locale][key] ?? DICTIONARIES[DEFAULT_LOCALE][key];

    if (entry === undefined) return key;

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

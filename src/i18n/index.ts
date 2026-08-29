export { LOCALES, DEFAULT_LOCALE, LOCALE_META, isLocale, dirOf, intlTagOf } from "./config";
export type { Locale } from "./config";
export { LocaleProvider } from "./LocaleProvider";
export { useLocale, useTranslate } from "./useLocale";
export { formatDate, formatNumber, formatPrice } from "./format";
export { missingArabicKeys, arabicCoverage } from "./coverage";
export type { TranslationKey, SimpleTranslationKey } from "./dictionaries/en";
export type { Entry, PluralForms, TranslationParams } from "./types";

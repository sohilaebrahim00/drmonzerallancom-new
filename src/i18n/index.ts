export { LOCALES, DEFAULT_LOCALE, LOCALE_META, isLocale, dirOf, intlTagOf } from "./config";
export type { Locale } from "./config";
export { LocaleProvider } from "./LocaleProvider";
export { useLocale, useTranslate } from "./useLocale";
export type { TranslateFn } from "./translate";
export { formatDate, formatNumber, formatPrice } from "./format";
export { missingArabicKeys, arabicCoverage } from "./coverage";
export type { TranslationKey, SimpleTranslationKey } from "./dictionaries/en";
export {
  FAQ_CATEGORY_LABELS,
  ARTICLE_CATEGORY_LABELS,
  PRODUCT_CATEGORY_LABELS,
  VIDEO_CATEGORY_LABELS,
  CREDENTIAL_LABELS,
} from "./categoryLabels";
export type { Entry, PluralForms, TranslationParams } from "./types";
export { PACKAGE_LABELS, packageFeatures } from "./packageLabels";
export { FAQ_LABELS } from "./faqLabels";
export { productName, productShort, productHaystack } from "./productDisplay";
export {
  productFull,
  productHighlightText,
  productPriceLabel,
  specKeyText,
  specValueText,
  productMeta,
} from "./productDetailLabels";
export { videoTitle, videoCaption } from "./videoDisplay";
export { serviceTitle, serviceDescription, serviceHighlights } from "./serviceLabels";
export { articleTitle, articleExcerpt, articleHaystack } from "./articleLabels";

import type { Entry } from "../types";

/**
 * English is the source dictionary: its keys ARE the key type, so a typo in a
 * `t()` call is a compile error rather than a string that renders as its own
 * key in production.
 *
 * Keys are flat and dotted (`faq.resultCount`) rather than nested objects.
 * With the surface in FIX_PLAN 5.2 — around 280 files — a nested shape needs
 * recursive template-literal path types to stay type-safe, which is slow to
 * compile and produces unreadable errors. Flat keys are greppable: the string
 * in the editor is the string in the file.
 *
 * Convention: `<area>.<thing>`, and a plural entry is named for what it
 * counts, not for the sentence it appears in.
 *
 * SEEDED, NOT COMPLETE. These are the entries needed to prove the mechanism —
 * each one lifted from a string that exists in the tree today. Component
 * conversion is the next step, not this one.
 */
export const en = {
  // --- plural entries -------------------------------------------------
  // src/pages/FaqPage.tsx:115 — `{n} {n === 1 ? "question" : "questions"} found`
  "faq.resultCount": {
    one: "{count} question found",
    other: "{count} questions found",
  },
  // src/pages/ProductsIndexPage.tsx:84
  "products.resultCount": {
    one: "{count} product found",
    other: "{count} products found",
  },
  // src/app-native/screens/NativeNotificationSettings.tsx:74 — was "day(s)"
  "notifications.coverageDays": {
    one: "Currently covering the next day.",
    other: "Currently covering the next {count} days.",
  },
  // src/pages/AccountConsultationsPage.tsx:253 and three sibling screens
  "consultations.creditsRemaining": {
    one: "{count} of {limit} credit remaining",
    other: "{count} of {limit} credits remaining",
  },

  // --- simple entries -------------------------------------------------
  "common.language": "Language",
  "consultations.title": "Consultations",
  "faq.searchPlaceholder": "Search questions",
} as const satisfies Record<string, Entry>;

/** Every key that exists. Arabic is checked against this, and so is `t()`. */
export type TranslationKey = keyof typeof en;

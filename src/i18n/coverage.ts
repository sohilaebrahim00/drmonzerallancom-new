import { en, type TranslationKey } from "./dictionaries/en";
import { dictionaryFor } from "./translate";

/**
 * Which keys have no Arabic yet.
 *
 * The Arabic dictionary is intentionally `Partial` so a missing string falls
 * back to English instead of failing the build. That trade is only acceptable
 * if the gap is visible, so this is the thing that makes it visible: it is
 * logged once in development, and it is what a "how much Arabic is left"
 * question should be answered with rather than a guess.
 */
export function missingArabicKeys(): TranslationKey[] {
  // Reads the LOADED Arabic dictionary rather than importing it, so asking
  // this question does not drag the Arabic chunk into the entry bundle. Call
  // it after loadDictionary("ar") has resolved; before that every key counts
  // as missing, which is true — nothing is translated yet.
  const ar = dictionaryFor("ar");
  return (Object.keys(en) as TranslationKey[]).filter((key) => ar[key] === undefined);
}

export function arabicCoverage(): { translated: number; total: number; missing: number } {
  const total = Object.keys(en).length;
  const missing = missingArabicKeys().length;
  return { translated: total - missing, total, missing };
}

/**
 * The shape of one dictionary entry.
 *
 * Two kinds only, and the difference is visible in the data rather than in a
 * naming convention: a plain string, or a set of plural forms.
 */

/**
 * Plural forms, keyed by CLDR category.
 *
 * English has two categories (`one`, `other`). Arabic has six — `zero`, `one`,
 * `two`, `few`, `many`, `other` — and they are not decorative:
 *   0            -> zero
 *   1            -> one
 *   2            -> two   ("استشارتان", a dual form, not "2 استشارات")
 *   3-10, 103... -> few
 *   11-99, 111.. -> many
 *   100, 102...  -> other
 * `Intl.PluralRules` knows this table; we never encode the numbers ourselves.
 *
 * `other` is the only required form because it is the one category every
 * locale defines, which makes it the guaranteed fallback when a translator
 * has filled in some forms but not all.
 */
export type PluralForms = { other: string } & Partial<Record<Intl.LDMLPluralRule, string>>;

export type Entry = string | PluralForms;

export function isPluralEntry(entry: Entry): entry is PluralForms {
  return typeof entry !== "string";
}

/** Values interpolated into `{placeholders}`. `count` also drives plural selection. */
export type TranslationParams = Record<string, string | number>;

/**
 * Subsets Aref Ruqaa for the Arabic display face.
 *
 * WHY A STABLE SET, NOT THE GLYPHS CURRENTLY ON THE PAGE. It is tempting to
 * subset to exactly the characters the site renders today, which is much
 * smaller. It is also a trap: the moment the doctor adds a heading with a
 * letter we did not include, that letter silently falls back to a different
 * face mid-word, and Arabic is a joining script — a fallback glyph in the
 * middle of a word breaks the connection and looks like a rendering fault, not
 * a missing font. So the set is the complete modern Arabic writing system,
 * independent of current content.
 *
 * WHAT IS DELIBERATELY EXCLUDED, and this is the point of the file:
 *
 *   - ARABIC-INDIC DIGITS U+0660-0669 and the extended set U+06F0-06F9.
 *   - LATIN, including Latin digits, which the font also ships.
 *
 * Digits must never render in Ruq'ah. Prices, doses and quantities are shown
 * in Latin digits inside Arabic prose, and a calligraphic digit in a clinical
 * sentence is a misreading risk rather than a style choice. Excluding them
 * from the FILE is what makes that structural: even if a future stylesheet
 * puts Aref Ruqaa first in a stack for numeric text, the glyphs are not there
 * and the browser falls through to IBM Plex Sans Arabic. The unicode-range in
 * the CSS says the same thing a second time, so the rule survives either one
 * being edited by mistake.
 *
 * Usage: node scripts/subset-arabic-display-font.mjs <in.woff2> <out.woff2>
 */
import { readFile, writeFile } from "node:fs/promises";
import subsetFont from "subset-font";

/** Every codepoint the subset should keep, as a string of characters. */
function buildRetainedText() {
  const ranges = [
    // Arabic block, letters and marks — but NOT the digit runs.
    [0x0600, 0x065f], // signs, honorifics, combining marks
    [0x066a, 0x06ef], // punctuation and letters, skipping U+0660-0669 digits
    // U+06F0-06F9 (extended Arabic-Indic digits) skipped on purpose.
    [0x06fa, 0x06ff],
    [0x0750, 0x077f], // Arabic Supplement
    [0xfb50, 0xfdff], // Presentation Forms-A (ligatures, incl. Allah)
    [0xfe70, 0xfefc], // Presentation Forms-B
    // Punctuation and joining controls that Arabic text actually uses.
    [0x200c, 0x200f], // ZWNJ, ZWJ, LRM, RLM
    [0x2010, 0x2011], // hyphen, non-breaking hyphen
    [0x2013, 0x2014], // en dash, em dash — both appear in the copy
    [0x2018, 0x201d], // curly quotes
    [0x2026, 0x2026], // ellipsis
    [0x2066, 0x2069], // the bidi isolates interpolate() emits
  ];
  let out = "";
  for (const [lo, hi] of ranges) {
    for (let c = lo; c <= hi; c++) out += String.fromCodePoint(c);
  }
  return out;
}

const [, , input, output] = process.argv;
if (!input || !output) {
  console.error("usage: node scripts/subset-arabic-display-font.mjs <in.woff2> <out.woff2>");
  process.exit(2);
}

const original = await readFile(input);
const subset = await subsetFont(original, buildRetainedText(), { targetFormat: "woff2" });
await writeFile(output, subset);

const pct = ((1 - subset.length / original.length) * 100).toFixed(1);
console.log(
  `${input} -> ${output}: ${original.length} B -> ${subset.length} B (-${pct}%)`,
);

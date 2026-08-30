/**
 * The dictionary scanner, shared by build-translation-review.mjs and
 * i18n-audit.mjs.
 *
 * It lives here because it was duplicated once and the copy drifted: the
 * second version was a character scanner that could fail to advance, so the
 * audit hung at module load with no output at all. One implementation, two
 * importers.
 *
 * It is a line scanner rather than a regex on purpose. The dictionaries hold
 * apostrophes, em dashes, bidi isolates and escaped quotes, and a regex over
 * that reliably finds the wrong closing quote.
 */

/** Reads the first double-quoted JS string in `s`, honouring escapes. */
export function readQuoted(s) {
  const start = s.indexOf('"');
  if (start === -1) return null;
  let buf = "";
  for (let i = start + 1; i < s.length; i++) {
    const ch = s[i];
    if (ch === "\\") {
      buf += s[i + 1] === "n" ? "\n" : s[i + 1];
      i++;
      continue;
    }
    if (ch === '"') return buf;
    buf += ch;
  }
  return null;
}

/**
 * Parses a dictionary module into { key: string | { pluralForm: string } }.
 * Only entries indented exactly two spaces are read, which is what the
 * dictionaries use for top-level keys.
 */
export function parseDict(src) {
  const out = {};
  const lines = src.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith('  "')) continue;
    const endQuote = line.indexOf('":', 3);
    if (endQuote === -1) continue;
    const key = line.slice(3, endQuote);
    let rest = line.slice(endQuote + 2).trim();
    if (rest.startsWith("{")) {
      const forms = {};
      for (let j = i + 1; j < lines.length && !lines[j].trim().startsWith("}"); j++) {
        const t = lines[j].trim();
        const c = t.indexOf(":");
        if (c === -1) continue;
        const form = t.slice(0, c).trim();
        const v = readQuoted(t.slice(c + 1));
        if (v !== null) forms[form] = v;
      }
      out[key] = forms;
      continue;
    }
    if (rest === "") {
      rest = (lines[i + 1] || "").trim();
    }
    const v = readQuoted(rest);
    if (v !== null) out[key] = v;
  }
  return out;
}

/** Every plain-string value in a dictionary, trimmed. Plural forms included. */
export function dictValues(dict) {
  const out = new Set();
  for (const v of Object.values(dict)) {
    if (typeof v === "string") out.add(v.trim());
    else if (v && typeof v === "object") {
      for (const form of Object.values(v)) if (typeof form === "string") out.add(form.trim());
    }
  }
  return out;
}

// Deterministic, keyword-based retrieval over the generated knowledge base
// (see scripts/build-ai-knowledge.ts). No embeddings, no vector database —
// the current amount of website content doesn't need it. Scoring is plain
// substring/word-overlap matching, intentionally simple and auditable.

import knowledgeBase from "../../../src/ai/knowledge/generated-knowledge.json" with { type: "json" };
import type { Platform } from "./actionRegistry.ts";

export interface KnowledgeItem {
  id: string;
  category: string;
  title: string;
  content: string;
  keywords: string[];
  route?: string;
}

const ITEMS = knowledgeBase.items as KnowledgeItem[];

// Always-available baseline context so general questions ("who are you",
// "what is this website") never come back empty-handed.
const ALWAYS_INCLUDE_IDS = new Set(["doctor-profile", "site-navigation"]);

/**
 * ── THIS FUNCTION USED TO DELETE ARABIC ────────────────────────────────────
 *
 * It was `text.toLowerCase().replace(/[^a-z0-9\s]/g, " ")`. Every character
 * outside ASCII was replaced with a space, so an Arabic question normalised to
 * the empty string, produced zero scoring words, matched zero of the 90
 * knowledge items, and the assistant answered from nothing at all. Not a
 * degraded answer — an UNGROUNDED one, every time, for every Arabic visitor,
 * on a health product published under a doctor's name. Measured:
 *
 *   "كم تكلفة برنامج العلاج بريميوم؟"  ->  ""   scoring words: []
 *
 * Keeping the letters is necessary and not sufficient. Typed Arabic varies in
 * ways that are invisible to a reader but fatal to string equality, so the
 * same question typed by two people has to reduce to the same tokens:
 *
 *   harakat/tatweel   بُرْنامَج and برنامج are the same word; the marks are
 *                     optional and inconsistently typed
 *   alef forms        أ إ آ ٱ are all typed for ا, often by autocorrect
 *   taa marbuta       ة and ه are interchanged constantly in informal typing
 *   alef maqsura      ى and ي likewise
 *   hamza carriers    ؤ ئ reduce to و ي for matching purposes
 *   Arabic-Indic      ٠-٩ and ۰-۹ must become ASCII, because every price and
 *                     count in the knowledge base is stored in ASCII digits
 *   definite article  "برنامج" must match "البرنامج" — without stripping a
 *                     leading ال, the single most common noun form in the
 *                     data fails to match the way visitors actually type it
 */
const ARABIC_DIACRITICS = /[ً-ٰٟۖ-ۭـ]/g;
const ARABIC_INDIC = /[٠-٩۰-۹]/g;
/**
 * Everything that is not a letter, a digit or whitespace becomes a space.
 *
 * NOT a character-range allow-list. The first version of this kept the whole
 * Arabic block (U+0600–U+06FF), which also contains Arabic PUNCTUATION — so
 * "بريميوم؟" survived tokenisation with the question mark still attached and
 * could never equal the stored "بريميوم". Latin punctuation was being stripped
 * while Arabic punctuation was not, which is the same bug as before in
 * miniature: the code was written for one script and applied to two.
 *
 * Replacing with a space rather than deleting keeps English tokenisation
 * byte-identical to the old behaviour — "doctor's" splits to "doctor s" exactly
 * as it always did.
 */
const KEEP = /[^\p{L}\p{N}\s]/gu;

function foldArabic(text: string): string {
  return text
    .replace(ARABIC_DIACRITICS, "")
    .replace(ARABIC_INDIC, (d) => String((d.codePointAt(0)! & 0xf) % 10))
    .replace(/[أإآٱ]/g, "ا") // أ إ آ ٱ -> ا
    .replace(/ة/g, "ه") // ة -> ه
    .replace(/ى/g, "ي") // ى -> ي
    .replace(/ؤ/g, "و") // ؤ -> و
    .replace(/ئ/g, "ي"); // ئ -> ي
}

export function normalize(text: string): string {
  return foldArabic(text.toLowerCase()).replace(KEEP, " ");
}

/**
 * Strips a leading definite article, but only when a real word is left behind.
 * "الله" must not become "له"; "البرنامج" must become "برنامج".
 */
function stripAl(word: string): string {
  if (word.startsWith("ال") && word.length >= 5) return word.slice(2);
  return word;
}

export function words(text: string): string[] {
  return normalize(text)
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .map(stripAl);
}

/**
 * Keywords and titles are folded ONCE, at module load, with the same function
 * the query goes through.
 *
 * They used to be compared raw. That was invisible while everything on both
 * sides was ASCII, and would have silently defeated the Arabic keywords the
 * moment they were added: a stored "الأسعار" would never equal a query's
 * folded "اسعار". Both sides must pass through the same normaliser or the fix
 * to normalize() buys nothing.
 */
const INDEX = new Map<string, { keywords: string[]; titleWords: string[]; title: string }>(
  ITEMS.map((item) => [
    item.id,
    {
      keywords: [...new Set(item.keywords.map((k) => normalize(k).trim()).filter(Boolean))],
      titleWords: words(item.title),
      title: normalize(item.title).trim(),
    },
  ]),
);

function scoreItem(item: KnowledgeItem, queryWords: Set<string>, rawQuery: string): number {
  const idx = INDEX.get(item.id);
  if (!idx) return 0;
  let score = 0;
  for (const keyword of idx.keywords) {
    if (queryWords.has(keyword)) score += 3;
    else if (keyword.length > 2 && rawQuery.includes(keyword)) score += 1.5;
  }
  for (const w of idx.titleWords) {
    if (queryWords.has(w)) score += 2;
  }
  if (idx.title && rawQuery.includes(idx.title)) score += 4;
  return score;
}

export interface RetrievalOptions {
  /** Max specific (non-always-included) items returned. */
  maxItems?: number;
  /** Max total characters across all returned items' content. */
  maxChars?: number;
}

/**
 * Scores every knowledge item against the query (current message plus a
 * little recent conversation for follow-up questions like "how many
 * meetings does it include?" after "tell me about Premium"), returns the
 * top matches plus a small always-included baseline — never the entire
 * knowledge base.
 */
export function retrieveContext(
  query: string,
  recentContext = "",
  options: RetrievalOptions = {},
): KnowledgeItem[] {
  const maxItems = options.maxItems ?? 6;
  const maxChars = options.maxChars ?? 4000;

  const combinedQuery = `${recentContext} ${query}`.trim();
  const rawQuery = normalize(combinedQuery);
  const queryWords = new Set(words(combinedQuery));

  const scored = ITEMS.filter((item) => !ALWAYS_INCLUDE_IDS.has(item.id))
    .map((item) => ({ item, score: scoreItem(item, queryWords, rawQuery) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxItems)
    .map((entry) => entry.item);

  const always = ITEMS.filter((item) => ALWAYS_INCLUDE_IDS.has(item.id));
  const combined = [...always, ...scored];

  let charBudget = maxChars;
  const withinBudget: KnowledgeItem[] = [];
  for (const item of combined) {
    if (item.content.length > charBudget && withinBudget.length > 0) break;
    withinBudget.push(item);
    charBudget -= item.content.length;
  }
  return withinBudget;
}

/**
 * The allowlist for `kind: "route"` actions only — i.e. dynamic, per-item
 * routes (a specific product/article) that are identical on both platforms
 * by construction. Section-level navigation (packages, consultations,
 * account, contact, etc.) no longer goes through this mechanism at all —
 * see `_shared/actionRegistry.ts`'s `ACTION_CONCEPTS`, which is
 * platform-aware and is what the model actually uses for those.
 */
export function getKnownRoutes(platform: Platform): Set<string> {
  const routes = new Set<string>();
  for (const item of ITEMS) {
    if (item.route) routes.add(item.route);
  }
  // Universal routes that exist, with the same path, on every platform.
  routes.add("/");
  routes.add("/about");
  if (platform === "web") {
    // Web-only dynamic destination not covered by a concept.
    routes.add("/gallery");
  }
  return routes;
}

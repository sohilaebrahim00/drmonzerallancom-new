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

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
}

function words(text: string): string[] {
  return normalize(text)
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function scoreItem(item: KnowledgeItem, queryWords: Set<string>, rawQuery: string): number {
  let score = 0;
  for (const keyword of item.keywords) {
    if (queryWords.has(keyword)) score += 3;
    else if (rawQuery.includes(keyword)) score += 1.5;
  }
  const titleWords = words(item.title);
  for (const w of titleWords) {
    if (queryWords.has(w)) score += 2;
  }
  if (rawQuery.includes(normalize(item.title))) score += 4;
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

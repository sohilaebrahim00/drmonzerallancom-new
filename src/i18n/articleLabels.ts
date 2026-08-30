import type { SimpleTranslationKey } from "./dictionaries/en";
import type { Article } from "@/data/articles";
import type { TranslateFn } from "./translate";

/**
 * Article slug -> title and excerpt keys.
 *
 * These are dictionary keys rather than lazy modules on purpose: the blog
 * index and the home preview draw a card for every article, so a title has to
 * be available without fetching that article. The BODIES are the opposite case
 * and live in src/i18n/articles/<locale>/<slug>.ts — see articleBodies.ts.
 *
 * The slug stays the identity: it is the URL, the related-article lookup and
 * the React key. Title and excerpt are display only.
 */
export const ARTICLE_LABELS: Record<
  string,
  { title: SimpleTranslationKey; excerpt: SimpleTranslationKey }
> = {
  "sustainable-weight-loss-without-crash-diets": {
    title: "article.sustainableWeightLoss.title",
    excerpt: "article.sustainableWeightLoss.excerpt",
  },
  "eating-well-with-type-2-diabetes": {
    title: "article.type2Diabetes.title",
    excerpt: "article.type2Diabetes.excerpt",
  },
  "fueling-athletic-performance-and-recovery": {
    title: "article.athleticPerformance.title",
    excerpt: "article.athleticPerformance.excerpt",
  },
  "nutrition-through-every-trimester-of-pregnancy": {
    title: "article.pregnancyTrimesters.title",
    excerpt: "article.pregnancyTrimesters.excerpt",
  },
  "understanding-food-and-digestive-comfort": {
    title: "article.digestiveComfort.title",
    excerpt: "article.digestiveComfort.excerpt",
  },
  "heart-healthy-eating-for-cholesterol-and-blood-pressure": {
    title: "article.heartHealthy.title",
    excerpt: "article.heartHealthy.excerpt",
  },
  "how-much-protein-do-you-actually-need": {
    title: "article.howMuchProtein.title",
    excerpt: "article.howMuchProtein.excerpt",
  },
};

export function articleTitle(a: Article, t: TranslateFn): string {
  const k = ARTICLE_LABELS[a.slug];
  return k ? t(k.title) : a.title;
}

export function articleExcerpt(a: Article, t: TranslateFn): string {
  const k = ARTICLE_LABELS[a.slug];
  return k ? t(k.excerpt) : a.excerpt;
}

/**
 * Search haystack covering both languages, for the same reason as the FAQ and
 * product ones: an Arabic reader may still type "protein" or "omega".
 */
export function articleHaystack(a: Article, t: TranslateFn): string {
  const k = ARTICLE_LABELS[a.slug];
  const parts = [a.title, a.excerpt, a.category];
  if (k) parts.push(t(k.title), t(k.excerpt));
  return parts.join(" ").toLowerCase();
}

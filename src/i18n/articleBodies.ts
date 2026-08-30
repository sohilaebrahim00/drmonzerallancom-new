import type { ArticleSection } from "@/data/articles";
import type { Locale } from "./config";

/**
 * Translated article BODIES, split per article and per locale.
 *
 * WHY THIS IS NOT IN THE DICTIONARY. The Arabic dictionary is one chunk loaded
 * whenever the locale is Arabic — on every page. The seven article bodies are
 * ~14 kB raw / ~4 kB gzipped of prose that only matters on one route, so
 * putting them there would make an Arabic reader who lands on /packages and
 * never opens an article download all seven anyway. Per article, they are
 * ~2 kB each and only the one being read is fetched.
 *
 * Titles and excerpts are NOT here — they are dictionary keys, because the
 * blog index and the home preview render cards for every article and would
 * otherwise have to pull seven modules to draw seven headings.
 *
 * `import.meta.glob` (not a computed `import()`) is what makes this real:
 * Vite can only emit a chunk per file for an import specifier it can read
 * statically. A template path would quietly bundle every locale into one.
 *
 * ENGLISH IS ABSENT ON PURPOSE. English bodies stay inline in
 * src/data/articles.ts because src/app-native imports that module and is out
 * of scope to change. The asymmetry is deliberate and costs English readers
 * nothing — they already have those bodies.
 */
const MODULES = import.meta.glob<{ sections: ArticleSection[] }>("./articles/*/*.ts");

/**
 * The Arabic sections for one article, or null.
 *
 * Null is a real answer, not an error: an article with no translation module
 * falls back to its English body, which is the documented outcome for a
 * passage that cannot cross without changing clinical meaning.
 */
export async function loadArticleSections(
  locale: Locale,
  slug: string,
): Promise<ArticleSection[] | null> {
  if (locale === "en") return null;
  const load = MODULES[`./articles/${locale}/${slug}.ts`];
  if (!load) return null;
  try {
    const mod = await load();
    return mod.sections;
  } catch {
    // A chunk that fails to arrive falls back to English rather than blanking
    // the article, for the same reason the dictionary loader does.
    return null;
  }
}

/** Whether a translated body EXISTS, without fetching it. */
export function hasTranslatedBody(locale: Locale, slug: string): boolean {
  return locale !== "en" && `./articles/${locale}/${slug}.ts` in MODULES;
}

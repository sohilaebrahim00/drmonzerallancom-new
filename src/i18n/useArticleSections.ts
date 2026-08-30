import { useEffect, useState } from "react";

import type { Article, ArticleSection } from "@/data/articles";
import { useLocale } from "./useLocale";
import { hasTranslatedBody, loadArticleSections } from "./articleBodies";

/**
 * The sections to render for an article in the active locale.
 *
 * `pending` is true only while a translation that IS known to exist is in
 * flight. That distinction is the point: an article with no Arabic body is not
 * pending anything — it renders its English immediately, which is the correct
 * outcome, not a slow one. Callers should hold the body area only while
 * `pending`, never on the strength of `locale !== "en"` alone.
 */
export function useArticleSections(article: Article | undefined): {
  sections: ArticleSection[];
  pending: boolean;
  /** True when the reader is seeing English inside an Arabic page. */
  isEnglishFallback: boolean;
} {
  const { locale } = useLocale();
  // Accepts `undefined` so the caller can run this hook BEFORE its
  // "article not found" early return. A hook behind a conditional return is
  // the bug this signature exists to prevent.
  const slug = article?.slug;
  const expected = slug ? hasTranslatedBody(locale, slug) : false;
  const [translated, setTranslated] = useState<ArticleSection[] | null>(null);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setTranslated(null);
    setSettled(false);
    loadArticleSections(locale, slug)
      .then((sections) => {
        if (!cancelled) setTranslated(sections);
      })
      .finally(() => {
        if (!cancelled) setSettled(true);
      });
    return () => {
      cancelled = true;
    };
  }, [locale, slug]);

  const sections = translated ?? article?.sections ?? [];
  return {
    sections,
    pending: expected && !settled,
    isEnglishFallback: locale !== "en" && translated === null && settled,
  };
}

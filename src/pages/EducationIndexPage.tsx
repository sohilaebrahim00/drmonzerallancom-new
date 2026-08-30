import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowUpRight, Clock, Search } from "lucide-react";

import { Seo } from "@/components/seo/Seo";
import { ArticleCard } from "@/components/education/ArticleCard";
import { Photo } from "@/components/common/Photo";
import { Input } from "@/components/ui/input";
import { articles, categories, estimateReadingTime, type ArticleCategory } from "@/data/articles";
import { cn } from "@/lib/utils";
import { useTranslate, useLocale, ARTICLE_CATEGORY_LABELS } from "@/i18n";

export default function EducationIndexPage() {
  const t = useTranslate();
  const { locale } = useLocale();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<ArticleCategory | "All">("All");
  const featured = articles[0];

  useEffect(() => {
    const requested = searchParams.get("category");
    if (requested && (categories as string[]).includes(requested)) {
      setActiveCategory(requested as ArticleCategory);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    return articles.filter((article) => {
      if (!query.trim() && activeCategory === "All" && article.slug === featured?.slug) {
        return false;
      }
      const matchesCategory = activeCategory === "All" || article.category === activeCategory;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        article.title.toLowerCase().includes(q) ||
        article.excerpt.toLowerCase().includes(q) ||
        article.category.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, activeCategory, featured?.slug]);

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-16 sm:px-10 sm:py-20">
      <Seo
        title="Nutrition Blog & Education"
        description="Evidence-based nutrition articles covering weight management, clinical nutrition, sports nutrition, women's health, and more."
        path="/blog"
      />

      <div className="mx-auto max-w-2xl text-center">
        <p dir="auto" className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
          {t("blogPage.eyebrow")}
        </p>
        <h1
          dir="auto"
          className="mt-4 font-display text-3xl font-extrabold tracking-tight text-navy sm:text-4xl"
        >
          {t("blogPage.title")}
        </h1>
        <p dir="auto" className="mt-4 text-base leading-relaxed text-muted-foreground">
          {t("blogPage.lede")}
        </p>
        {/* Article titles and bodies stay English — those genuinely are the
            doctor's own writing, not product copy. Saying so plainly beats
            letting an Arabic reader discover it by clicking through. */}
        {locale !== "en" && (
          <p
            dir="rtl"
            lang="ar"
            className="mx-auto mt-4 max-w-xl rounded-xl border border-border/70 bg-secondary/40 px-4 py-3 text-sm leading-loose text-navy"
          >
            {t("blog.englishOnly")}
          </p>
        )}
      </div>

      {featured && (
        <div className="mt-12">
          <Link
            to={`/blog/${featured.slug}`}
            className="group grid grid-cols-1 overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-turquoise/50 hover:shadow-[0_30px_60px_-30px_rgba(23,35,59,0.35)] lg:grid-cols-[1.1fr_1fr]"
          >
            {/* The featured slot is a second card implementation, so it needed
                the photograph too — otherwise the most prominent article on
                the page is a gradient while five smaller cards below it are
                photographs, which reads as something failing to load. It is
                also this page's LCP element, hence eager. */}
            <div className="relative flex min-h-[14rem] items-center justify-center overflow-hidden bg-gradient-to-br from-navy via-primary to-turquoise/80">
              {featured.image ? (
                <Photo
                  base={`${featured.image.base}-card`}
                  width={featured.image.card.width}
                  height={featured.image.card.height}
                  alt={featured.image.alt}
                  priority
                  className="block h-full w-full"
                  imgClassName="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(min-width: 1024px) 628px, 100vw"
                />
              ) : (
                <featured.icon className="h-20 w-20 text-white/90 transition-transform duration-500 group-hover:scale-110" />
              )}
              <span className="absolute start-6 top-6 rounded-full bg-white/90 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-navy">
                {t("blogPage.featured")}
              </span>
            </div>
            <div className="flex flex-col justify-center gap-3 p-8 sm:p-10">
              <span className="w-fit rounded-full bg-secondary px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
                {t(ARTICLE_CATEGORY_LABELS[featured.category])}
              </span>
              <h2
                dir="auto"
                className="font-display text-2xl font-extrabold leading-tight text-navy sm:text-3xl"
              >
                {featured.title}
              </h2>
              <p dir="auto" className="text-sm leading-relaxed text-muted-foreground">
                {featured.excerpt}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" /> {estimateReadingTime(featured)}{" "}
                  {t("common.minRead")}
                </span>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:text-turquoise">
                  {t("blogPage.readArticle")}
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:-scale-x-100" />
                </span>
              </div>
            </div>
          </Link>
        </div>
      )}

      <div className="mx-auto mt-10 max-w-xl">
        <div className="relative">
          <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles…"
            aria-label="Search articles"
            className="ps-10"
          />
        </div>
      </div>

      <p
        dir="auto"
        className="mx-auto mt-8 max-w-xl text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"
      >
        {t("blogPage.topicExplorer")}
      </p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {(["All", ...categories] as const).map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveCategory(category)}
            aria-pressed={activeCategory === category}
            className={cn(
              "cursor-pointer rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors",
              activeCategory === category
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-navy/70 hover:border-turquoise hover:text-turquoise",
            )}
          >
            {category === "All" ? t("faqPage.categoryAll") : t(ARTICLE_CATEGORY_LABELS[category])}
          </button>
        ))}
      </div>

      <div className="mt-14">
        <h2 dir="auto" className="font-display text-lg font-bold text-navy">
          {t("blogPage.latestArticles")}
        </h2>
        <div className="mt-6">
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((article, index) => (
                <div key={article.slug}>
                  <ArticleCard article={article} />
                </div>
              ))}
            </div>
          ) : (
            <p dir="auto" className="py-16 text-center text-sm text-muted-foreground">
              No articles match your search. Try a different keyword or category.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

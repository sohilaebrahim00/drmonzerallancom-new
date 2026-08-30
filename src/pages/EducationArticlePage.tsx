import { Navigate, useParams } from "react-router-dom";
import { Clock, Calendar } from "lucide-react";

import { Seo } from "@/components/seo/Seo";
import { Photo } from "@/components/common/Photo";
import { PHOTO_FRAME } from "@/components/common/photoFrame";
import { ArticleCard } from "@/components/education/ArticleCard";
import { ShareButtons } from "@/components/education/ShareButtons";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getArticleBySlug, estimateReadingTime, getRelatedArticles } from "@/data/articles";
import { useArticleSections } from "@/i18n/useArticleSections";
import { articleSchema, breadcrumbSchema } from "@/lib/schema";
import { cn } from "@/lib/utils";
import { business } from "@/data/business";
import { useTranslate, useLocale, ARTICLE_CATEGORY_LABELS, articleTitle } from "@/i18n";

export default function EducationArticlePage() {
  const t = useTranslate();
  const { formatDate } = useLocale();
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? getArticleBySlug(slug) : undefined;
  // Called before the early return below, so the hook order is unconditional.
  const { sections, pending } = useArticleSections(article);

  if (!article) {
    return <Navigate to="/blog" replace />;
  }

  const Icon = article.icon;
  const readingTime = estimateReadingTime(article);
  const related = getRelatedArticles(article);
  const url = `${business.domain}/blog/${article.slug}`;
  // Was toLocaleDateString(undefined, ...), which follows the BROWSER locale
  // rather than the page locale — an Arabic page showed an English month name.
  const dateLabel = formatDate(article.date, { year: "numeric", month: "long", day: "numeric" });

  const jsonLd = [
    articleSchema(article, url),
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Blog", path: "/blog" },
      { name: article.title, path: `/blog/${article.slug}` },
    ]),
  ];

  return (
    <article className="mx-auto w-full max-w-3xl px-6 py-16 sm:px-10 sm:py-20">
      <Seo
        title={article.title}
        description={article.excerpt}
        path={`/blog/${article.slug}`}
        type="article"
        jsonLd={jsonLd}
        /* The article's own hero becomes its share card; articles without one
           fall through to the sitewide default inside Seo. The .jpg, not the
           .webp — WhatsApp will not render a WebP card. */
        image={
          article.image
            ? {
                path: `${article.image.base}-hero.jpg`,
                width: article.image.hero.width,
                height: article.image.hero.height,
                alt: article.image.alt,
              }
            : undefined
        }
      />

      {/* The hero is this page's LCP element, so it is preloaded as well as
          eager. The preload names the .webp because that is what a modern
          browser actually fetches from the <picture>; `imageSrcSet`+`type`
          keep the two in agreement so nothing is downloaded twice. */}
      {article.image && (
        <link
          rel="preload"
          as="image"
          href={`${article.image.base}-hero.webp`}
          type="image/webp"
          fetchPriority="high"
        />
      )}

      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">{t("common.home")}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/blog">{t("nav.blog")}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{articleTitle(article, t)}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Hero above the title, at content width (688px inside max-w-3xl) and
          16:9. The LCP element for this page: eager + high priority, matching
          the preload above. Native widths are 1400 or 960 depending on the
          article, so 688px never upscales either. */}
      {article.image && (
        <div className={cn(PHOTO_FRAME, "mt-6 aspect-[16/9] w-full")}>
          <Photo
            base={`${article.image.base}-hero`}
            width={article.image.hero.width}
            height={article.image.hero.height}
            alt={article.image.alt}
            priority
            className="block h-full w-full"
            imgClassName="h-full w-full object-cover"
            sizes="(min-width: 768px) 688px, 100vw"
          />
        </div>
      )}

      <div className="mt-6">
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
          {t(ARTICLE_CATEGORY_LABELS[article.category])}
        </span>
        <h1
          dir="auto"
          className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight text-navy sm:text-4xl"
        >
          {articleTitle(article, t)}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" /> {dateLabel}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" /> {t("common.minRead", { count: readingTime })}
          </span>
          <span dir="auto">{t("article.byline", { name: business.doctorName })}</span>
        </div>
      </div>

      <div>
        {/* Only for an article with no photograph. Where there IS a hero above
            the title this would be a second, redundant media block on the same
            page, so it is the fallback rather than a fixture. */}
        {!article.image && (
          <div className="mt-8 flex h-56 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/85 to-turquoise/70 sm:h-72">
            <Icon className="h-16 w-16 text-white/90" />
          </div>
        )}
      </div>

      <div className="mt-10 space-y-8" aria-busy={pending || undefined}>
        {/* Keyed by index, not by heading: once translated the heading is a
            DISPLAY string, and a display string is never an identity. The list
            is static and never reorders, so the index is stable here. */}
        {sections.map((section, i) => (
          <div key={i}>
            <h2 dir="auto" className="font-display text-xl font-bold text-navy">
              {section.heading}
            </h2>
            <div className="mt-3 space-y-4">
              {section.body.map((paragraph) => (
                <p
                  dir="auto"
                  key={paragraph}
                  className="text-base leading-relaxed text-muted-foreground"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-border/70 bg-secondary/40 p-5 text-xs leading-relaxed text-muted-foreground">
        {t("article.disclaimer")}
      </div>

      <div className="mt-8 border-t border-border/60 pt-6">
        <ShareButtons url={url} title={articleTitle(article, t)} />
      </div>

      {related.length > 0 && (
        <div className="mt-16">
          <h2 dir="auto" className="font-display text-xl font-bold text-navy">
            {t("article.related")}
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {related.map((item) => (
              <ArticleCard key={item.slug} article={item} />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

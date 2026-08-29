import { Navigate, useParams } from "react-router-dom";
import { Clock, Calendar } from "lucide-react";

import { Seo } from "@/components/seo/Seo";
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
import { articleSchema, breadcrumbSchema } from "@/lib/schema";
import { business } from "@/data/business";

export default function EducationArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? getArticleBySlug(slug) : undefined;

  if (!article) {
    return <Navigate to="/blog" replace />;
  }

  const Icon = article.icon;
  const readingTime = estimateReadingTime(article);
  const related = getRelatedArticles(article);
  const url = `${business.domain}/blog/${article.slug}`;
  const dateLabel = new Date(article.date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

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
      />

      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/blog">Blog</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{article.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-6">
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
          {article.category}
        </span>
        <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight text-navy sm:text-4xl">
          {article.title}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" /> {dateLabel}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" /> {readingTime} min read
          </span>
          <span>By {business.doctorName}</span>
        </div>
      </div>

      <div>
        <div className="mt-8 flex h-56 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/85 to-turquoise/70 sm:h-72">
          <Icon className="h-16 w-16 text-white/90" />
        </div>
      </div>

      <div className="mt-10 space-y-8">
        {article.sections.map((section) => (
          <div key={section.heading}>
            <h2 className="font-display text-xl font-bold text-navy">{section.heading}</h2>
            <div className="mt-3 space-y-4">
              {section.body.map((paragraph) => (
                <p key={paragraph} className="text-base leading-relaxed text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-border/70 bg-secondary/40 p-5 text-xs leading-relaxed text-muted-foreground">
        This article is for general educational purposes only and is not a substitute for
        personalized medical or nutritional advice. Please consult a qualified healthcare provider
        before making changes to your diet.
      </div>

      <div className="mt-8 border-t border-border/60 pt-6">
        <ShareButtons url={url} title={article.title} />
      </div>

      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="font-display text-xl font-bold text-navy">Related Articles</h2>
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

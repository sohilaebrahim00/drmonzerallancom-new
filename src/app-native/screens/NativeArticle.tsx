import { Navigate, useParams } from "react-router-dom";
import { Clock } from "lucide-react";

import { AppScreen } from "@/app-native/components/AppScreen";
import { getArticleBySlug, estimateReadingTime } from "@/data/articles";

/** Long-form content — scrolling is expected and correct here, per the no-long-scroll rule's own exception. */
export default function NativeArticle() {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? getArticleBySlug(slug) : undefined;

  if (!article) return <Navigate to="/blog" replace />;

  const dateLabel = new Date(article.date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <AppScreen title={article.category} back className="mx-auto w-full max-w-lg px-4 pb-10 pt-3">
      <p className="font-display text-2xl font-extrabold leading-tight text-navy">
        {article.title}
      </p>
      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
        <span>{dateLabel}</span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" /> {estimateReadingTime(article)} min read
        </span>
      </div>

      <div className="mt-5 space-y-5">
        {article.sections.map((section) => (
          <div key={section.heading}>
            <h2 className="font-display text-base font-bold text-navy">{section.heading}</h2>
            {section.body.map((paragraph, i) => (
              <p key={i} className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </div>
        ))}
      </div>
    </AppScreen>
  );
}

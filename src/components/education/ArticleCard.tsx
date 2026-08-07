import { Link } from "react-router-dom";
import { ArrowUpRight, Clock } from "lucide-react";

import type { Article } from "@/data/articles";
import { estimateReadingTime } from "@/data/articles";

const categoryGradients: Record<string, string> = {
  "Weight Management": "from-primary/85 to-turquoise/70",
  "Clinical Nutrition": "from-navy/85 to-primary/70",
  "Sports Nutrition": "from-green/80 to-turquoise/70",
  "Women's Health": "from-turquoise/85 to-secondary",
  "Family Nutrition": "from-primary/80 to-green/60",
  "Digestive Health": "from-turquoise/80 to-primary/60",
  "Heart Health": "from-navy/80 to-turquoise/60",
};

export function ArticleCard({
  article,
  featured = false,
}: {
  article: Article;
  featured?: boolean;
}) {
  const Icon = article.icon;
  const readingTime = estimateReadingTime(article);
  const gradient = categoryGradients[article.category] ?? "from-primary/80 to-turquoise/70";

  return (
    <Link
      to={`/blog/${article.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-turquoise/50 hover:shadow-[0_24px_50px_-24px_rgba(23,35,59,0.35)]"
    >
      <div
        className={`relative flex items-center justify-center bg-gradient-to-br ${gradient} ${featured ? "h-48" : "h-36"}`}
      >
        <Icon className="h-12 w-12 text-white/90 transition-transform duration-500 group-hover:scale-110" />
        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-navy">
          {article.category}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-6">
        <h3 className="font-display text-lg font-bold leading-snug text-navy transition-colors group-hover:text-primary">
          {article.title}
        </h3>
        <p className="flex-1 text-sm leading-relaxed text-muted-foreground">{article.excerpt}</p>
        <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> {readingTime} min read
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-primary group-hover:text-turquoise">
            Read
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

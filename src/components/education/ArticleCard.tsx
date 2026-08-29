import { Link } from "react-router-dom";
import { ArrowUpRight, Clock } from "lucide-react";

import type { Article } from "@/data/articles";
import { estimateReadingTime } from "@/data/articles";
import { Photo } from "@/components/common/Photo";
import { useTranslate, ARTICLE_CATEGORY_LABELS } from "@/i18n";

const categoryGradients: Record<string, string> = {
  "Weight Management": "from-primary/85 to-turquoise/70",
  "Clinical Nutrition": "from-navy/85 to-primary/70",
  "Sports Nutrition": "from-green/80 to-turquoise/70",
  "Women's Health": "from-turquoise/85 to-secondary",
  "Family Nutrition": "from-primary/80 to-green/60",
  "Digestive Health": "from-turquoise/80 to-primary/60",
  "Heart Health": "from-navy/80 to-turquoise/60",
};

/* `featured` is gone: its only job was choosing between h-48 and h-36, and
   both states are now a 16:9 box so every card in a grid is the same shape. */
export function ArticleCard({ article }: { article: Article }) {
  const t = useTranslate();
  const Icon = article.icon;
  const readingTime = estimateReadingTime(article);
  const gradient = categoryGradients[article.category] ?? "from-primary/80 to-turquoise/70";

  return (
    <Link
      to={`/blog/${article.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-turquoise/50 hover:shadow-[0_24px_50px_-24px_rgba(23,35,59,0.35)]"
    >
      {/* 16:9 for BOTH states. The old fixed h-36 / h-48 made a 384px-wide
          card 8:3, which crops a photograph badly, and it also meant the
          gradient fallback and a photo card were different shapes — a grid
          where one card is a different height reads as broken rather than as
          variety. The aspect box, radius and border are identical either way;
          only what fills them differs. */}
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        {article.image ? (
          <Photo
            base={`${article.image.base}-card`}
            width={article.image.card.width}
            height={article.image.card.height}
            alt={article.image.alt}
            className="block h-full w-full"
            imgClassName="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(min-width: 1024px) 384px, (min-width: 640px) 50vw, 100vw"
          />
        ) : (
          /* Not a placeholder for a missing file — the designed state for an
             article that has no photograph. */
          <div
            className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradient}`}
          >
            <Icon className="h-12 w-12 text-white/90 transition-transform duration-500 group-hover:scale-110" />
          </div>
        )}
        <span className="absolute start-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-navy">
          {/* Display only — categoryGradients above is keyed on the untranslated
              identity, and so is every filter and related-article comparison. */}
          {t(ARTICLE_CATEGORY_LABELS[article.category])}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-6">
        <h3
          dir="auto"
          className="font-display text-lg font-bold leading-snug text-navy transition-colors group-hover:text-primary"
        >
          {article.title}
        </h3>
        <p dir="auto" className="flex-1 text-sm leading-relaxed text-muted-foreground">
          {article.excerpt}
        </p>
        <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> {readingTime} {t("common.minRead")}
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-primary group-hover:text-turquoise">
            {t("common.read")}
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:-scale-x-100" />
          </span>
        </div>
      </div>
    </Link>
  );
}

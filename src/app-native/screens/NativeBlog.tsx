import { Link } from "react-router-dom";
import { Clock } from "@phosphor-icons/react";

import { AppScreen } from "@/app-native/components/AppScreen";
import { articles, estimateReadingTime } from "@/data/articles";

export default function NativeBlog() {
  const [featured, ...rest] = articles;

  return (
    <AppScreen title="Blog" back className="mx-auto w-full max-w-lg px-4 pb-6 pt-3">
      {featured && (
        <Link
          to={`/blog/${featured.slug}`}
          className="flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-navy to-primary p-5 text-white shadow-sm"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-turquoise">
            <featured.icon className="h-5 w-5" />
          </span>
          <p className="mt-3 font-display text-lg font-bold">{featured.title}</p>
          <p className="mt-1 line-clamp-2 text-sm text-white/80">{featured.excerpt}</p>
          <span className="mt-2 flex items-center gap-1 text-xs text-turquoise">
            <Clock className="h-3 w-3" /> {estimateReadingTime(featured)} min read
          </span>
        </Link>
      )}

      <div className="mt-4 space-y-2.5">
        {rest.map((article) => (
          <Link
            key={article.slug}
            to={`/blog/${article.slug}`}
            className="flex items-center gap-3 rounded-xl border border-border/70 bg-card p-3 shadow-sm"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
              <article.icon className="h-4.5 w-4.5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-navy">
                {article.title}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {article.category}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </AppScreen>
  );
}

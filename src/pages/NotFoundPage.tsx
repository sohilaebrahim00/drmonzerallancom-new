import { Link } from "react-router-dom";
import { Home, Search } from "lucide-react";

import { Seo } from "@/components/seo/Seo";
import { Reveal } from "@/components/common/Reveal";
import { useTranslate } from "@/i18n";

export default function NotFoundPage() {
  const t = useTranslate();
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center px-6 py-24 text-center sm:px-10">
      <Seo
        title="Page Not Found"
        description="The page you're looking for doesn't exist."
        path="/404"
        noindex
      />
      <Reveal direction="up">
        <p dir="auto" className="font-display text-7xl font-extrabold text-primary">
          404
        </p>
        <h1 dir="auto" className="mt-4 font-display text-2xl font-bold text-navy">
          {t("notFound.title")}
        </h1>
        <p dir="auto" className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          {t("notFound.body")}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-turquoise"
          >
            <Home className="h-4 w-4" /> {t("notFound.backHome")}
          </Link>
          <Link
            to="/blog"
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold text-navy transition-colors hover:border-turquoise hover:text-turquoise"
          >
            <Search className="h-4 w-4" /> {t("notFound.browseArticles")}
          </Link>
        </div>
      </Reveal>
    </div>
  );
}

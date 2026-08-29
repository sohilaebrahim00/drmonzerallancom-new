import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";
import { ArticleCard } from "@/components/education/ArticleCard";
import { articles } from "@/data/articles";
import { useTranslate } from "@/i18n";

export function EducationPreview() {
  const t = useTranslate();
  const featured = articles.slice(0, 3);

  return (
    <section
      id="education-preview"
      className="relative py-20 sm:py-28"
      aria-labelledby="education-preview-heading"
    >
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-10">
        <SectionHeading
          eyebrow={t("blog.eyebrow")}
          title={t("blog.title")}
          description={t("blog.description")}
        />

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((article, index) => (
            <Reveal key={article.slug} direction="up" delay={index * 0.08}>
              <ArticleCard article={article} />
            </Reveal>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            to="/blog"
            className="group inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-navy transition-all duration-300 hover:border-turquoise hover:text-turquoise"
          >
            Read the Blog
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:-scale-x-100" />
          </Link>
        </div>
      </div>
    </section>
  );
}

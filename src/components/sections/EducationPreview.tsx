import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";
import { ArticleCard } from "@/components/education/ArticleCard";
import { articles } from "@/data/articles";

export function EducationPreview() {
  const featured = articles.slice(0, 3);

  return (
    <section
      id="education-preview"
      className="relative py-20 sm:py-28"
      aria-labelledby="education-preview-heading"
    >
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-10">
        <SectionHeading
          eyebrow="Education"
          title="Learn The Science Behind The Advice"
          description="Free, evidence-based articles covering the topics that matter most to your health."
        />

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((article, index) => (
            <Reveal key={article.slug} direction="up" delay={index * 0.08}>
              <ArticleCard article={article} featured />
            </Reveal>
          ))}
        </div>

        <Reveal direction="up" delay={0.2} className="mt-10 flex justify-center">
          <Link
            to="/education"
            className="group inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-navy transition-all duration-300 hover:border-turquoise hover:text-turquoise"
          >
            View All Articles
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

import { Link } from "react-router-dom";
import { Apple, Baby, Bike, Droplets, HeartPulse, Soup, type LucideIcon } from "lucide-react";

import { SectionHeading } from "@/components/common/SectionHeading";
import { categories, type ArticleCategory } from "@/data/articles";
import { useTranslate } from "@/i18n";

const TOPIC_ICONS: Partial<Record<ArticleCategory, LucideIcon>> = {
  "Weight Management": Bike,
  "Clinical Nutrition": Droplets,
  "Sports Nutrition": Bike,
  "Women's Health": Baby,
  "Family Nutrition": Apple,
  "Digestive Health": Soup,
  "Heart Health": HeartPulse,
};

export function ContentDiscovery() {
  const t = useTranslate();
  return (
    <section className="relative py-20 sm:py-28" aria-labelledby="content-discovery-heading">
      <div className="mx-auto w-full max-w-6xl px-6 sm:px-10">
        <SectionHeading eyebrow={t("discovery.eyebrow")} title={t("discovery.title")} />

        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((category, index) => {
            const Icon = TOPIC_ICONS[category] ?? Apple;
            return (
              <div key={category}>
                <Link
                  to={`/blog?category=${encodeURIComponent(category)}`}
                  className="group flex h-full flex-col items-center gap-3 rounded-2xl border border-border/70 bg-card p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-turquoise/50"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-primary transition-transform duration-300 group-hover:scale-110">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="text-sm font-semibold text-navy">{category}</span>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductsEmptyState } from "@/components/products/ProductsEmptyState";
import { getFeaturedProducts } from "@/data/products";
import { useTranslate } from "@/i18n";

export function ProductsPreview() {
  const t = useTranslate();
  const products = getFeaturedProducts();

  return (
    <section
      id="products-preview"
      className="relative py-20 sm:py-28"
      aria-labelledby="products-preview-heading"
    >
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-10">
        <SectionHeading
          eyebrow={t("products.eyebrow")}
          title={t("products.title")}
          description={t("products.description")}
        />

        <div className="mt-14">
          {products.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product, index) => (
                <Reveal key={product.id} direction="up" delay={index * 0.08}>
                  <ProductCard product={product} />
                </Reveal>
              ))}
            </div>
          ) : (
            <div>
              <ProductsEmptyState />
            </div>
          )}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            to="/products"
            className="group inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-navy transition-all duration-300 hover:border-turquoise hover:text-turquoise"
          >
            {t("productsPreview.viewAll")}
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:-scale-x-100" />
          </Link>
        </div>

        <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-relaxed text-muted-foreground/80">
          {t("productsPreview.disclaimer")}
        </p>
      </div>
    </section>
  );
}

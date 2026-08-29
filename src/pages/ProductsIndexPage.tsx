import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Seo } from "@/components/seo/Seo";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductsEmptyState } from "@/components/products/ProductsEmptyState";
import { BookingButton } from "@/components/booking/BookingButton";
import { Input } from "@/components/ui/input";
import { getPublishedProducts, productCategories, type ProductCategory } from "@/data/products";
import { cn } from "@/lib/utils";
import { useTranslate, PRODUCT_CATEGORY_LABELS, productHaystack } from "@/i18n";
import { business } from "@/data/business";

export default function ProductsIndexPage() {
  const t = useTranslate();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<ProductCategory | "All">("All");
  const allProducts = getPublishedProducts();

  const filtered = useMemo(() => {
    return allProducts.filter((product) => {
      const matchesCategory = activeCategory === "All" || product.category === activeCategory;
      const q = query.trim().toLowerCase();
      const matchesQuery = !q || productHaystack(product, t).includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [allProducts, query, activeCategory, t]);

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-16 sm:px-10 sm:py-20">
      <Seo
        title="Wellness Products & Health Devices"
        description="Explore Dr. Monzer Allan's selection of branded wellness products, supplements, and home health-monitoring devices."
        path="/products"
      />

      <div className="mx-auto max-w-2xl text-center">
        <p dir="auto" className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
          Products
        </p>
        <h1
          dir="auto"
          className="mt-4 font-display text-3xl font-extrabold tracking-tight text-navy sm:text-4xl"
        >
          {t("productsPage.title")}
        </h1>
        <p dir="auto" className="mt-4 text-base leading-relaxed text-muted-foreground">
          {t("productsPage.lede", { name: business.doctorName })}
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-xl">
        <div className="relative">
          <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            aria-label="Search products"
            className="ps-10"
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {(["All", ...productCategories] as const).map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveCategory(category)}
            aria-pressed={activeCategory === category}
            className={cn(
              "cursor-pointer rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors",
              activeCategory === category
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-navy/70 hover:border-turquoise hover:text-turquoise",
            )}
          >
            {category === "All" ? t("faqPage.categoryAll") : t(PRODUCT_CATEGORY_LABELS[category])}
          </button>
        ))}
      </div>

      <p
        dir="auto"
        className="mt-6 text-center text-xs font-medium text-muted-foreground"
        role="status"
      >
        {filtered.length} {filtered.length === 1 ? "product" : "products"} found
      </p>

      <div className="mt-8">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((product, index) => (
              <div key={product.id}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : allProducts.length > 0 ? (
          <p dir="auto" className="py-16 text-center text-sm text-muted-foreground">
            No products match your search.
            <br />
            Try another product name or category.
          </p>
        ) : (
          <ProductsEmptyState />
        )}
      </div>

      <div className="mx-auto mt-14 max-w-2xl rounded-2xl border border-border/70 bg-card p-6 text-center shadow-sm sm:p-8">
        <h2 dir="auto" className="font-display text-lg font-bold text-navy">
          Have Questions About Any Product?
        </h2>
        <p dir="auto" className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Book a consultation with Dr. Monzer Allan to talk through what fits your routine, or reach
          out about a specific product directly.
        </p>
        <div className="mt-5 flex justify-center">
          <BookingButton label="Book a Consultation" />
        </div>
      </div>

      <p
        dir="auto"
        className="mx-auto mt-10 max-w-2xl text-center text-xs leading-relaxed text-muted-foreground/80"
      >
        Product information is provided for general informational purposes only. Dietary supplements
        are not intended to diagnose, treat, cure, or prevent any disease. Consult a qualified
        healthcare professional before using a supplement, especially if you are pregnant, nursing,
        taking medication, managing a medical condition, or considering use for a child. Use
        health-monitoring devices according to their official instructions and seek professional
        medical advice when needed.
      </p>
    </div>
  );
}

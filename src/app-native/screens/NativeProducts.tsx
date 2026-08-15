import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MagnifyingGlass } from "@phosphor-icons/react";

import { AppScreen } from "@/app-native/components/AppScreen";
import { SoldOutBadge } from "@/components/products/SoldOutBadge";
import { getPublishedProducts, productCategories, type ProductCategory } from "@/data/products";
import { cn } from "@/lib/utils";

export default function NativeProducts() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ProductCategory | "All">("All");

  const products = useMemo(() => {
    const all = getPublishedProducts();
    return all.filter((p) => {
      const matchesCategory = category === "All" || p.category === category;
      const matchesQuery =
        !query.trim() || p.name.toLowerCase().includes(query.trim().toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [query, category]);

  return (
    <AppScreen title="Products" tabBar className="mx-auto w-full max-w-xl px-4 pb-6 pt-3">
      <div className="relative">
        <MagnifyingGlass className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products…"
          className="h-11 w-full rounded-full border border-border bg-card pl-10 pr-4 text-sm text-navy outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
        {(["All", ...productCategories] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={cn(
              "shrink-0 cursor-pointer whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
              category === c
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-navy/70 hover:border-turquoise",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {products.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          No products match your search.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {products.map((product) => (
            <Link
              key={product.slug}
              to={`/products/${product.slug}`}
              className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm"
            >
              <div className="relative aspect-square w-full bg-secondary">
                <img
                  src={product.mainImage}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
                {product.availability === "sold-out" && (
                  <SoldOutBadge className="absolute bottom-2 left-2" />
                )}
              </div>
              <div className="p-2.5">
                <p className="line-clamp-2 text-xs font-semibold text-navy">{product.name}</p>
                <p className="mt-0.5 text-[0.65rem] text-muted-foreground">{product.category}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppScreen>
  );
}

import type { Product } from "@/data/products";
import type { TranslateFn } from "./translate";
import { PRODUCT_LABELS } from "./productLabels";

/** Display name, falling back to the stored English if a slug has no keys. */
export function productName(p: Product, t: TranslateFn): string {
  const k = PRODUCT_LABELS[p.slug];
  return k ? t(k.name) : p.name;
}

export function productShort(p: Product, t: TranslateFn): string {
  const k = PRODUCT_LABELS[p.slug];
  return k ? t(k.short) : p.shortDescription;
}

/**
 * Search haystack covering BOTH languages, for the same reason as the FAQ one:
 * an Arabic reader types Arabic, but the same reader types "Omega-3" or
 * "CoQ10" in Latin because that is what is printed on the bottle. Searching
 * one language only fails one of those.
 */
export function productHaystack(p: Product, t: TranslateFn): string {
  const k = PRODUCT_LABELS[p.slug];
  const parts = [p.name, p.category, p.strength ?? "", p.shortDescription];
  if (k) parts.push(t(k.name), t(k.short));
  return parts.join(" ").toLowerCase();
}

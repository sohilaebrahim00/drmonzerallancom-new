/**
 * Manual food search + barcode lookup — genuinely live, not an
 * "architecture-only" placeholder. Uses Open Food Facts
 * (https://world.openfoodfacts.org), a free, public, no-API-key-required
 * nutrition database (documented at https://openfoodfacts.github.io/openfoodfacts-server/api/) —
 * chosen specifically because it needs no secret/credential this
 * environment doesn't have, unlike a commercial provider (USDA FoodData
 * Central, Nutritionix, etc.), any of which would require an API key this
 * project doesn't have configured. If a commercial provider is added
 * later, swap the implementation here; nothing else in the app depends on
 * which provider is behind these two functions.
 *
 * Barcode lookup (api/v2/product) is called directly from the client —
 * confirmed by a real browser fetch test to send permissive CORS, and
 * there is no secret in the request. Text search does NOT send CORS
 * headers (confirmed the same way — a direct browser fetch fails with
 * "Failed to fetch"), so it routes through the food-search Edge Function
 * instead, which does a plain server-to-server fetch (no CORS applies
 * there) and forwards no credential — same non-secret request, just made
 * from a place CORS doesn't block.
 */
import { supabase } from "@/lib/supabase";

export interface FoodDatabaseResult {
  name: string;
  brand: string | null;
  servingDescription: string | null;
  caloriesPerServing: number;
  proteinGrams: number;
  carbohydrateGrams: number;
  fatGrams: number;
  source: "openfoodfacts";
}

const BASE_URL = "https://world.openfoodfacts.org";

function toResult(product: Record<string, unknown>): FoodDatabaseResult | null {
  const nutriments = product.nutriments as Record<string, number> | undefined;
  const name = (product.product_name as string) || (product.generic_name as string);
  if (!name || !nutriments) return null;

  // Prefer per-serving values when the product defines a serving size;
  // fall back to per-100g, which is the one field Open Food Facts always
  // has for entries with any nutrition data at all.
  const hasServing = typeof nutriments["energy-kcal_serving"] === "number";
  const calories = hasServing
    ? nutriments["energy-kcal_serving"]
    : (nutriments["energy-kcal_100g"] ?? 0);
  const protein = hasServing ? nutriments["proteins_serving"] : (nutriments["proteins_100g"] ?? 0);
  const carbs = hasServing
    ? nutriments["carbohydrates_serving"]
    : (nutriments["carbohydrates_100g"] ?? 0);
  const fat = hasServing ? nutriments["fat_serving"] : (nutriments["fat_100g"] ?? 0);

  return {
    name: name.slice(0, 120),
    brand: (product.brands as string)?.split(",")[0]?.trim().slice(0, 60) || null,
    servingDescription: hasServing ? ((product.serving_size as string) ?? "1 serving") : "per 100g",
    caloriesPerServing: Math.round(calories) || 0,
    proteinGrams: Math.round((protein ?? 0) * 10) / 10,
    carbohydrateGrams: Math.round((carbs ?? 0) * 10) / 10,
    fatGrams: Math.round((fat ?? 0) * 10) / 10,
    source: "openfoodfacts",
  };
}

export async function searchFoodByName(query: string): Promise<FoodDatabaseResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2 || !supabase) return [];

  try {
    const { data, error } = await supabase.functions.invoke<{
      products?: Record<string, unknown>[];
    }>("food-search", { body: { query: trimmed } });
    if (error || !data) return [];
    const products = Array.isArray(data.products) ? data.products : [];
    return products
      .map((p) => toResult(p))
      .filter((r): r is FoodDatabaseResult => r !== null && r.caloriesPerServing > 0)
      .slice(0, 12);
  } catch {
    // Network failure, timeout, or the provider being unreachable — treated
    // as "no results" rather than a crash; the manual-entry fallback in the
    // UI still lets the visitor log the food themselves.
    return [];
  }
}

export type BarcodeLookupOutcome =
  | { ok: true; result: FoodDatabaseResult }
  | { ok: false; reason: "NOT_FOUND" | "UNAVAILABLE" };

export async function lookupFoodByBarcode(barcode: string): Promise<BarcodeLookupOutcome> {
  const cleaned = barcode.trim().replace(/\D/g, "");
  if (!cleaned) return { ok: false, reason: "NOT_FOUND" };

  try {
    const url = `${BASE_URL}/api/v2/product/${encodeURIComponent(cleaned)}.json?fields=product_name,generic_name,brands,serving_size,nutriments,status`;
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return { ok: false, reason: "UNAVAILABLE" };
    const data = await response.json();
    if (data.status !== 1 || !data.product) return { ok: false, reason: "NOT_FOUND" };
    const result = toResult(data.product);
    if (!result) return { ok: false, reason: "NOT_FOUND" };
    return { ok: true, result };
  } catch {
    return { ok: false, reason: "UNAVAILABLE" };
  }
}

/** Real Shape Detection API (Chrome/Edge/Android Chrome) — not installed as a plugin, a standards web API. iOS Safari and older browsers don't support it; the UI must feature-detect and fall back to manual barcode entry, never fake a scan. */
export function supportsLiveBarcodeScanning(): boolean {
  return typeof window !== "undefined" && "BarcodeDetector" in window;
}

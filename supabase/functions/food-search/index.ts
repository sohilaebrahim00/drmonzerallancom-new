// Supabase Edge Function (Deno) — proxies Open Food Facts' text-search API.
//
// Confirmed empirically (real browser fetch test, not assumed): Open Food
// Facts' product-by-barcode endpoint (api/v2/product/{barcode}.json) sends
// permissive CORS and can be called directly from the client — see
// src/services/foodDatabaseService.ts's lookupFoodByBarcode(), which does
// exactly that. Its *search* endpoints (the legacy cgi/search.pl and the
// newer search-a-licious API) do NOT send CORS headers and fail with
// "Failed to fetch" from a browser. This function exists solely to route
// around that — a server-to-server fetch has no CORS restriction — not
// because search needs a secret (Open Food Facts requires no API key at
// all; this proxy never reads or forwards any credential).
//
// NOT DEPLOYED. Deploy with `supabase functions deploy food-search`.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

import { corsHeaders } from "../_shared/cors.ts";
import { clientIp, isRateLimited } from "../_shared/rateLimit.ts";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 30;

serve(async (req) => {
  const CORS_HEADERS = corsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
  }

  // The one hop of x-forwarded-for a client cannot forge — keying on the raw
  // header meant a fresh bucket per request and no limit at all.
  const rateLimitKey = `ip:${clientIp(req)}`;
  if (isRateLimited(rateLimitKey, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS)) {
    return new Response(JSON.stringify({ error: "Too many requests." }), {
      status: 429,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  let body: { query?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const query = (body.query ?? "").trim().slice(0, 100);
  if (query.length < 2) {
    return new Response(JSON.stringify({ products: [] }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=15&fields=product_name,generic_name,brands,serving_size,nutriments`;

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) {
      return new Response(JSON.stringify({ products: [] }), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
    const data = await response.json();
    return new Response(JSON.stringify({ products: data.products ?? [] }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[food-search] Open Food Facts request failed:", error);
    return new Response(JSON.stringify({ products: [] }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});

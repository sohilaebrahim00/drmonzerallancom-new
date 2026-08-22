// Supabase Edge Function (Deno) — Food Scanner backend.
//
// NOT DEPLOYED. Deploy with `supabase functions deploy food-scan` after
// setting secrets (shared with ai-chat — no separate key needed):
//   GEMINI_API_KEY, GEMINI_MODEL (optional), SUPABASE_SERVICE_ROLE_KEY
//
// The mobile/web app never calls Gemini directly and never sees
// GEMINI_API_KEY — it POSTs a compressed image here, this function calls
// Gemini's multimodal endpoint, validates the structured result, and
// returns only the sanitized JSON.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { corsHeaders } from "../_shared/cors.ts";
import { callGemini, isGeminiConfigured } from "../_shared/gemini.ts";
import { isRateLimited } from "../_shared/rateLimit.ts";

// Mirrors `foodScannerRequiresMembership` in src/config/mobileApp.ts — see
// the comment there for why this can't be a single shared import.
const FOOD_SCANNER_REQUIRES_MEMBERSHIP = false;

// Mirrors FREE_DAILY_FOOD_SCAN_LIMIT in src/config/features.ts — same
// cross-runtime constraint as above (Deno Edge Functions can't import Vite
// frontend modules). Enforced against food_scan_events, a persisted daily
// counter — the existing per-minute isRateLimited() below only survives a
// single warm function instance and can't express a real daily ceiling.
const FREE_DAILY_FOOD_SCAN_LIMIT = 15;
const DAILY_LIMIT_MESSAGE = "You've reached today's food scan limit. Please try again tomorrow.";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

const RATE_LIMIT_WINDOW_MS = 60_000;
// Vision calls are heavier than a chat turn — a tighter limit than ai-chat's.
const RATE_LIMIT_MAX_REQUESTS = 6;

// Generous ceiling for an already client-compressed image (see
// src/services/foodScanService.ts, which resizes/compresses before upload).
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const MEMBERSHIP_REQUIRED_MESSAGE =
  "The Food Scanner is available to active members. Join a membership to unlock nutrition scanning.";

const NOT_CONFIGURED_RESPONSE = {
  foodDetected: false,
  foods: [],
  totalEstimatedCalories: 0,
  confidence: "low" as const,
  notes: "Food scanning is temporarily unavailable. Please try again later.",
};

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    foodDetected: { type: "BOOLEAN" },
    foods: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          estimatedPortion: { type: "STRING" },
          estimatedCalories: { type: "NUMBER" },
          proteinGrams: { type: "NUMBER" },
          carbohydrateGrams: { type: "NUMBER" },
          fatGrams: { type: "NUMBER" },
        },
        required: [
          "name",
          "estimatedPortion",
          "estimatedCalories",
          "proteinGrams",
          "carbohydrateGrams",
          "fatGrams",
        ],
      },
    },
    totalEstimatedCalories: { type: "NUMBER" },
    confidence: { type: "STRING", enum: ["low", "medium", "high"] },
    notes: { type: "STRING" },
  },
  required: ["foodDetected", "foods", "totalEstimatedCalories", "confidence", "notes"],
};

const SYSTEM_PROMPT = `You are a nutrition estimation assistant analyzing a photo of food for Dr. Monzer Allan's nutrition app.

Identify the visible food items and estimate, for each: a short name, portion size, calories, protein (grams), carbohydrates (grams), and fat (grams). Also return a total estimated calorie count across all items.

This is an ESTIMATE from a single photograph, not a laboratory measurement. Never imply exact/precise values — frame every number as an estimate, since ingredients, preparation method, and true portion size cannot be measured from an image.

If you cannot confidently identify any food in the image (blurry, empty plate/table, non-food subject, etc.), set foodDetected to false, return an empty foods array, totalEstimatedCalories to 0, and briefly explain why in notes. Do not guess or hallucinate food items that aren't clearly visible.

Set "confidence" to "low", "medium", or "high" based on image clarity and how much of the portion is visible.

You are not a doctor. Do not diagnose, comment on medical conditions, or give medical advice — stick to nutrition estimation only.

You must always respond with the required structured JSON matching the schema.`;

interface FoodItem {
  name: string;
  estimatedPortion: string;
  estimatedCalories: number;
  proteinGrams: number;
  carbohydrateGrams: number;
  fatGrams: number;
}

function clampNumber(value: unknown, max: number): number {
  const n = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return Math.min(Math.max(n, 0), max);
}

function validateAndSanitize(raw: unknown) {
  if (typeof raw !== "object" || raw === null) return null;
  const obj = raw as Record<string, unknown>;

  const foodDetected = typeof obj.foodDetected === "boolean" ? obj.foodDetected : false;
  const confidence = ["low", "medium", "high"].includes(obj.confidence as string)
    ? (obj.confidence as "low" | "medium" | "high")
    : "low";
  const notes = typeof obj.notes === "string" ? obj.notes.slice(0, 500) : "";

  const rawFoods = Array.isArray(obj.foods) ? obj.foods : [];
  const foods: FoodItem[] = rawFoods
    .filter((f): f is Record<string, unknown> => typeof f === "object" && f !== null)
    .slice(0, 12)
    .filter((f) => typeof f.name === "string" && f.name.trim())
    .map((f) => ({
      name: (f.name as string).slice(0, 80),
      estimatedPortion: typeof f.estimatedPortion === "string" ? f.estimatedPortion.slice(0, 40) : "1 serving",
      estimatedCalories: clampNumber(f.estimatedCalories, 5000),
      proteinGrams: clampNumber(f.proteinGrams, 500),
      carbohydrateGrams: clampNumber(f.carbohydrateGrams, 500),
      fatGrams: clampNumber(f.fatGrams, 500),
    }));

  const totalEstimatedCalories = clampNumber(obj.totalEstimatedCalories, 10000);

  return { foodDetected: foodDetected && foods.length > 0, foods, totalEstimatedCalories, confidence, notes };
}

serve(async (req) => {
  const CORS_HEADERS = corsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
  }

  const authHeader = req.headers.get("Authorization");
  let userId: string | null = null;
  if (authHeader?.startsWith("Bearer ")) {
    const { data } = await supabaseAdmin.auth.getUser(authHeader.slice("Bearer ".length));
    userId = data.user?.id ?? null;
  }

  if (FOOD_SCANNER_REQUIRES_MEMBERSHIP) {
    if (!userId) {
      return new Response(JSON.stringify({ error: MEMBERSHIP_REQUIRED_MESSAGE }), {
        status: 403,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
    const { data: subscription } = await supabaseAdmin
      .from("subscriptions")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();
    if (!subscription) {
      return new Response(JSON.stringify({ error: MEMBERSHIP_REQUIRED_MESSAGE }), {
        status: 403,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
  }

  const rateLimitKey = userId ?? req.headers.get("x-forwarded-for") ?? "anonymous";
  if (isRateLimited(rateLimitKey, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS)) {
    return new Response(
      JSON.stringify({ error: "We're receiving a high number of scans right now. Please try again shortly." }),
      { status: 429, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }

  if (userId) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("food_scan_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", since);
    if ((count ?? 0) >= FREE_DAILY_FOOD_SCAN_LIMIT) {
      return new Response(JSON.stringify({ error: DAILY_LIMIT_MESSAGE }), {
        status: 429,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
  }

  let body: { imageBase64?: string; mimeType?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const imageBase64 = typeof body.imageBase64 === "string" ? body.imageBase64 : "";
  const mimeType = typeof body.mimeType === "string" ? body.mimeType : "";

  if (!imageBase64 || !ALLOWED_MIME_TYPES.has(mimeType)) {
    return new Response(JSON.stringify({ error: "A JPEG, PNG, or WebP image is required." }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
  // Base64 is ~4/3 the size of the decoded bytes.
  const approxBytes = (imageBase64.length * 3) / 4;
  if (approxBytes > MAX_IMAGE_BYTES) {
    return new Response(JSON.stringify({ error: "Image is too large. Please try a smaller photo." }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  if (!isGeminiConfigured()) {
    return new Response(JSON.stringify(NOT_CONFIGURED_RESPONSE), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  if (userId) {
    // Counts against the daily cap regardless of outcome — a scan that
    // costs a real Gemini call is what the limit exists to bound.
    await supabaseAdmin.from("food_scan_events").insert({ user_id: userId });
  }

  const result = await callGemini({
    systemInstruction: SYSTEM_PROMPT,
    contents: [
      {
        role: "user",
        parts: [{ text: "Analyze this meal photo." }, { inlineData: { mimeType, data: imageBase64 } }],
      },
    ],
    responseSchema: RESPONSE_SCHEMA,
    temperature: 0.2,
    maxOutputTokens: 1200,
  });

  if (!result.ok) {
    console.error("[food-scan] Gemini call failed:", result.error);
    return new Response(JSON.stringify(NOT_CONFIGURED_RESPONSE), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(result.text);
  } catch {
    return new Response(JSON.stringify(NOT_CONFIGURED_RESPONSE), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const sanitized = validateAndSanitize(parsed) ?? NOT_CONFIGURED_RESPONSE;

  return new Response(JSON.stringify(sanitized), {
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
});

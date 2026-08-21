// Thin Gemini REST client for Supabase Edge Functions (Deno). The API key
// and model are read exclusively from server-side secrets — this file must
// never be imported by frontend code, and the key must never appear in a
// VITE_* variable.
//
// Required secret: GEMINI_API_KEY
// Optional secret: GEMINI_MODEL — single source of truth for the default
// lives right here (DEFAULT_GEMINI_MODEL) so it's never hardcoded in more
// than one place.

// "gemini-2.0-flash" (and even "gemini-2.5-flash") were retired by Google —
// requests now fail with 404 NOT_FOUND ("no longer available to new users").
// "gemini-flash-latest" is Google's own stable alias that always points at
// their current recommended flash model, so this file never needs to be
// updated again just because a dated model name is deprecated.
const DEFAULT_GEMINI_MODEL = "gemini-flash-latest";
const REQUEST_TIMEOUT_MS = 15_000;

export function getGeminiModel(): string {
  return Deno.env.get("GEMINI_MODEL")?.trim() || DEFAULT_GEMINI_MODEL;
}

export function isGeminiConfigured(): boolean {
  return Boolean(Deno.env.get("GEMINI_API_KEY"));
}

export type GeminiResult = { ok: true; text: string } | { ok: false; error: string };

export type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };
export type GeminiContent = { role: "user" | "model"; parts: GeminiPart[] };

/**
 * Calls Gemini's generateContent endpoint with a JSON response schema so the
 * model is constrained to return structured output. Never throws — always
 * resolves to a tagged result so the caller can fall back gracefully.
 * `parts` supports both plain text (ai-chat) and inline image data
 * (food-scan) — the same client serves both, no duplicated request logic.
 */
export async function callGemini(params: {
  systemInstruction: string;
  contents: GeminiContent[];
  responseSchema: object;
  temperature?: number;
  maxOutputTokens?: number;
}): Promise<GeminiResult> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    return { ok: false, error: "GEMINI_API_KEY is not configured." };
  }

  const model = getGeminiModel();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: params.systemInstruction }] },
        contents: params.contents,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: params.responseSchema,
          temperature: params.temperature ?? 0.4,
          maxOutputTokens: params.maxOutputTokens ?? 700,
        },
      }),
    });

    if (!res.ok) {
      // Google's error body is structured ({error: {code, status, message}})
      // and never echoes back the API key or request content, so it's safe
      // to log server-side (never returned to the client) — this is what
      // makes a future failure (wrong model name, billing/access issue,
      // quota) diagnosable from `supabase functions logs ai-chat` instead of
      // requiring a manual curl reproduction every time.
      let detail = `status ${res.status}`;
      try {
        const errBody = await res.json();
        if (errBody?.error?.status || errBody?.error?.message) {
          detail = `${errBody.error.status ?? res.status}: ${errBody.error.message ?? ""}`.trim();
        }
      } catch {
        /* body wasn't JSON — keep the plain status */
      }
      return { ok: false, error: `Gemini request failed (${detail})` };
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string" || !text.trim()) {
      return { ok: false, error: "Gemini returned an empty response." };
    }
    return { ok: true, text };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: message.includes("abort") ? "Gemini request timed out." : "Gemini request failed." };
  } finally {
    clearTimeout(timeout);
  }
}

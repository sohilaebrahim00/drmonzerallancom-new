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
// Bounded so a slow/overloaded Gemini can never keep a visitor staring at
// "Thinking..." for anywhere near a minute. MAX_ATTEMPTS bounds total
// attempts (1 initial + 1 retry); RETRY_BASE_DELAY_MS is a short fixed
// backoff (with jitter) before that single retry. Worst case is
// REQUEST_TIMEOUT_MS * MAX_ATTEMPTS + one backoff — ~24.5s here — which the
// frontend's own failsafe timeout (see aiChatService.ts) is set just above.
const REQUEST_TIMEOUT_MS = 12_000;
const MAX_ATTEMPTS = 2;
const RETRY_BASE_DELAY_MS = 400;

// HTTP statuses worth retrying — transient server/capacity problems, never
// the caller's fault. Any other 4xx (400 malformed, 401/403 auth, 404 bad
// model) is permanent and must fail immediately.
const RETRYABLE_HTTP_STATUSES = new Set([429, 500, 502, 503, 504]);
// Gemini's own structured `error.status` string for transient overload —
// checked in addition to the HTTP status since Google sometimes pairs it
// with a 503, but the string is the authoritative signal.
const RETRYABLE_GEMINI_STATUSES = new Set(["UNAVAILABLE", "RESOURCE_EXHAUSTED", "DEADLINE_EXCEEDED", "ABORTED", "INTERNAL"]);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getGeminiModel(): string {
  return Deno.env.get("GEMINI_MODEL")?.trim() || DEFAULT_GEMINI_MODEL;
}

export function isGeminiConfigured(): boolean {
  return Boolean(Deno.env.get("GEMINI_API_KEY"));
}

export type GeminiResult = { ok: true; text: string } | { ok: false; error: string };

export type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };
export type GeminiContent = { role: "user" | "model"; parts: GeminiPart[] };

/** Outcome of a single HTTP attempt — internal only, never returned from callGemini directly. */
type AttemptResult =
  | { ok: true; text: string }
  | { ok: false; retryable: boolean; detail: string };

/**
 * One request/response cycle against Gemini's generateContent endpoint,
 * including its own timeout. Never throws — fetch/timeout/parse failures are
 * all captured into a tagged AttemptResult so the retry loop in callGemini
 * can decide whether to try again. `detail` is safe to log server-side (it
 * never contains the API key, prompt, history, or image data) but is not
 * necessarily safe to return to the client as-is.
 */
async function attemptGeminiRequest(
  url: string,
  requestBody: unknown,
  attempt: number,
  model: string,
): Promise<AttemptResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const startedAt = Date.now();

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify(requestBody),
    });
    const elapsedMs = Date.now() - startedAt;

    if (!res.ok) {
      // Google's error body is structured ({error: {code, status, message}})
      // and never echoes back the API key or request content, so it's safe
      // to log server-side (never returned to the client) — this is what
      // makes a future failure (wrong model name, billing/access issue,
      // quota) diagnosable from `supabase functions logs ai-chat` instead of
      // requiring a manual curl reproduction every time.
      let geminiStatus: string | undefined;
      let detail = `status ${res.status}`;
      try {
        const errBody = await res.json();
        if (errBody?.error?.status || errBody?.error?.message) {
          geminiStatus = errBody.error.status;
          detail = `${errBody.error.status ?? res.status}: ${errBody.error.message ?? ""}`.trim();
        }
      } catch {
        /* body wasn't JSON — keep the plain status */
      }
      const retryable =
        RETRYABLE_HTTP_STATUSES.has(res.status) || (geminiStatus ? RETRYABLE_GEMINI_STATUSES.has(geminiStatus) : false);
      console.warn(
        `[gemini] attempt ${attempt}/${MAX_ATTEMPTS} model=${model} elapsedMs=${elapsedMs} failed — http ${res.status}${geminiStatus ? `, status ${geminiStatus}` : ""}${retryable ? " — retrying" : " — not retryable"}`,
      );
      return { ok: false, retryable, detail };
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string" || !text.trim()) {
      console.warn(`[gemini] attempt ${attempt}/${MAX_ATTEMPTS} model=${model} elapsedMs=${elapsedMs} — empty response body`);
      return { ok: false, retryable: false, detail: "Gemini returned an empty response." };
    }
    console.log(`[gemini] attempt ${attempt}/${MAX_ATTEMPTS} model=${model} elapsedMs=${elapsedMs} — ok`);
    return { ok: true, text };
  } catch (err) {
    const elapsedMs = Date.now() - startedAt;
    const isAbort = err instanceof Error && err.name === "AbortError";
    const message = err instanceof Error ? err.message : "Unknown error";
    // A timeout (AbortError from our own controller) or a network-level
    // failure (fetch throws a TypeError, e.g. DNS/connection reset) are both
    // transient and worth retrying. Anything else is treated as permanent
    // out of caution.
    const retryable = isAbort || err instanceof TypeError;
    console.warn(
      `[gemini] attempt ${attempt}/${MAX_ATTEMPTS} model=${model} elapsedMs=${elapsedMs} threw — ${isAbort ? "timeout" : message}${retryable ? " — retrying" : " — not retryable"}`,
    );
    return { ok: false, retryable, detail: isAbort ? "Gemini request timed out." : "Gemini request failed." };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Calls Gemini's generateContent endpoint with a JSON response schema so the
 * model is constrained to return structured output. Never throws — always
 * resolves to a tagged result so the caller can fall back gracefully.
 * `parts` supports both plain text (ai-chat) and inline image data
 * (food-scan) — the same client serves both, no duplicated request logic.
 *
 * Transparently retries transient failures (429/500/502/503/504, Gemini
 * UNAVAILABLE-style statuses, and timeouts/network errors) up to
 * MAX_ATTEMPTS total attempts with exponential backoff + jitter. Permanent
 * errors (bad API key, invalid model, malformed request, other 4xx) fail
 * immediately on the first attempt.
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
  const requestBody = {
    systemInstruction: { parts: [{ text: params.systemInstruction }] },
    contents: params.contents,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: params.responseSchema,
      temperature: params.temperature ?? 0.4,
      maxOutputTokens: params.maxOutputTokens ?? 700,
    },
  };

  let lastDetail = "Unknown error";
  let attemptsMade = 0;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    attemptsMade = attempt;
    const result = await attemptGeminiRequest(url, requestBody, attempt, model);
    if (result.ok) return { ok: true, text: result.text };

    lastDetail = result.detail;
    if (!result.retryable || attempt === MAX_ATTEMPTS) break;

    const backoff = RETRY_BASE_DELAY_MS * 2 ** (attempt - 1) + Math.floor(Math.random() * 150);
    await sleep(backoff);
  }

  const attemptWord = attemptsMade === 1 ? "attempt" : "attempts";
  return { ok: false, error: `Gemini request failed after ${attemptsMade} ${attemptWord} (${lastDetail})` };
}

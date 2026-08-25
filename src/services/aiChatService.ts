import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getAppMode } from "@/hooks/use-native-platform";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatAction {
  type: "internal-route";
  label: string;
  route: string;
}

export type ChatIntent =
  | "membership"
  | "consultation"
  | "product"
  | "service"
  | "blog"
  | "video"
  | "account"
  | "navigation"
  | "general"
  | "medical-escalation";

export interface ChatResponse {
  answer: string;
  intent: ChatIntent;
  actions: ChatAction[];
  needsHuman: boolean;
}

export type SendChatMessageResult =
  | { ok: true; data: ChatResponse }
  | { ok: false; error: string; rateLimited?: boolean };

const UNAVAILABLE_MESSAGE =
  "Our virtual assistant is temporarily unavailable. You can still explore the website or contact our team.";
const RATE_LIMIT_MESSAGE =
  "We're receiving a high number of requests right now. Please try again shortly.";

// Client-side failsafe so the chat UI can never sit in "Thinking..."
// indefinitely, regardless of what happens between the browser and the
// Edge Function (not just inside it). The ai-chat function's own Gemini
// client bounds itself to ~24.5s worst case (2 attempts x 12s + one short
// backoff — see supabase/functions/_shared/gemini.ts); this is set a few
// seconds above that so a normal slow-but-completing request isn't cut off
// early, while a genuine hang still resolves to the same fallback message
// well under a minute.
const CLIENT_TIMEOUT_MS = 27_000;

/**
 * Calls the ai-chat Edge Function — the only place the Gemini API key is
 * ever used. The Supabase client automatically forwards the current user's
 * access token when signed in, so the backend (never the browser) decides
 * who the visitor is and what member data, if any, applies.
 *
 * `platform` tells the backend whether to resolve action concepts
 * (BOOK_CONSULTATION, VIEW_MEMBERSHIP, etc. — see
 * supabase/functions/_shared/actionRegistry.ts) against the marketing
 * website's route tree ("web"), or the shared app-experience route tree used
 * by both the PWA ("pwa") and the Capacitor app ("native") — those two are
 * always identical (same screens), only "web" genuinely differs. Some
 * concepts (the AI screen, Food Scanner, Prayer Times, Qibla) only exist in
 * the app experience. The backend still decides the actual destination;
 * this only tells it which map to use.
 */
export async function sendChatMessage(input: {
  message: string;
  currentPath: string;
  history: ChatMessage[];
}): Promise<SendChatMessageResult> {
  if (!supabase) {
    // The single most common cause of a permanently "unavailable" assistant:
    // this build was produced without VITE_SUPABASE_URL /
    // VITE_SUPABASE_PUBLISHABLE_KEY set (e.g. missing from the Netlify site's
    // environment variables at build time — .env.local never reaches a
    // deployed build). When that happens `supabase` is null and every call
    // here returns instantly, with no network request and no SDK error to
    // inspect — which is exactly why this needs its own explicit log rather
    // than falling through to the generic catch below. Logs only the two
    // env var NAMES, never a value/secret.
    console.error(
      "[aiChatService] Supabase client is not configured (isSupabaseConfigured =",
      isSupabaseConfigured,
      "). VITE_SUPABASE_URL and/or VITE_SUPABASE_PUBLISHABLE_KEY were not set when this build was produced — check the deployment's environment variables.",
    );
    return { ok: false, error: UNAVAILABLE_MESSAGE };
  }

  try {
    const { data, error } = await supabase.functions.invoke<ChatResponse & { error?: string }>(
      "ai-chat",
      {
        body: {
          message: input.message,
          currentPath: input.currentPath,
          history: input.history.slice(-12),
          platform:
            getAppMode() === "CAPACITOR_NATIVE"
              ? "native"
              : getAppMode() === "PWA_WEB_APP"
                ? "pwa"
                : "web",
        },
        timeout: CLIENT_TIMEOUT_MS,
      },
    );

    if (error) {
      // FunctionsHttpError/FunctionsRelayError/FunctionsFetchError from the
      // Supabase SDK — .context is the underlying fetch Response (status,
      // statusText) when available. Never contains the Gemini key or any
      // secret; safe to log in full for diagnosis.
      const context = (error as { context?: { status?: number; statusText?: string } }).context;
      const status = context?.status;
      console.error("[aiChatService] ai-chat invocation failed:", {
        name: (error as Error).name,
        message: (error as Error).message,
        status,
        statusText: context?.statusText,
      });
      if (status === 429) {
        return { ok: false, error: RATE_LIMIT_MESSAGE, rateLimited: true };
      }
      return { ok: false, error: UNAVAILABLE_MESSAGE };
    }

    if (!data || typeof data.answer !== "string") {
      console.error("[aiChatService] ai-chat returned an unexpected response shape:", data);
      return { ok: false, error: UNAVAILABLE_MESSAGE };
    }

    return {
      ok: true,
      data: {
        answer: data.answer,
        intent: data.intent,
        actions: Array.isArray(data.actions) ? data.actions : [],
        needsHuman: Boolean(data.needsHuman),
      },
    };
  } catch (err) {
    // A genuine thrown exception (network failure, CORS block, etc.) rather
    // than an SDK-reported error — previously swallowed silently, which is
    // exactly what made this class of bug invisible in the browser console.
    console.error("[aiChatService] Unexpected exception calling ai-chat:", err);
    return { ok: false, error: UNAVAILABLE_MESSAGE };
  }
}

import { supabase } from "@/lib/supabase";
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
      },
    );

    if (error) {
      const status = (error as { context?: { status?: number } }).context?.status;
      if (status === 429) {
        return { ok: false, error: RATE_LIMIT_MESSAGE, rateLimited: true };
      }
      return { ok: false, error: UNAVAILABLE_MESSAGE };
    }

    if (!data || typeof data.answer !== "string") {
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
  } catch {
    return { ok: false, error: UNAVAILABLE_MESSAGE };
  }
}

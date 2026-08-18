import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowUpRight,
  CalendarCheck,
  CreditCard,
  HeartPulse,
  Loader2,
  Package,
  Send,
  ShieldAlert,
  Sparkles,
  Video,
  X,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { business } from "@/data/business";
import { sendChatMessage, type ChatAction, type ChatMessage } from "@/services/aiChatService";
import { cn } from "@/lib/utils";

interface DisplayMessage extends ChatMessage {
  actions?: ChatAction[];
}

const PAGE_PROMPTS: { prefix: string; prompt: string; authedPrompt?: string }[] = [
  { prefix: "/packages", prompt: "Need help choosing a program?" },
  { prefix: "/products", prompt: "Looking for information about one of our products?" },
  { prefix: "/blog", prompt: "Looking for educational content on a specific topic?" },
  { prefix: "/gallery", prompt: "Want to see more from the practice?" },
  { prefix: "/faq", prompt: "Can't find the answer you're looking for?" },
  {
    prefix: "/account",
    prompt: "Have a question about signing in or your account?",
    authedPrompt: "How can I help with your program or consultations?",
  },
];

function usePagePrompt(isAuthed: boolean) {
  const { pathname } = useLocation();
  const match = PAGE_PROMPTS.find((p) => pathname.startsWith(p.prefix));
  if (!match) return "How can I help you today?";
  return isAuthed && match.authedPrompt ? match.authedPrompt : match.prompt;
}

const QUICK_ACTIONS = [
  { label: "Find the Right Program", icon: Sparkles },
  { label: "Check Consultation Credits", icon: CreditCard },
  { label: "Request a Consultation", icon: CalendarCheck },
  { label: "Explore Products", icon: Package },
  { label: "Ask About Nutrition Services", icon: HeartPulse },
  { label: "Watch Educational Videos", icon: Video },
];

function MessageBubble({ message }: { message: DisplayMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
          isUser
            ? "rounded-br-md bg-primary text-primary-foreground"
            : "rounded-bl-md border border-border/70 bg-card text-navy/90",
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {!isUser && message.actions && message.actions.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {message.actions.map((action) => (
              <Link
                key={`${action.route}-${action.label}`}
                to={action.route}
                className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-primary/30 bg-secondary px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:border-turquoise hover:text-turquoise"
              >
                {action.label}
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-border/70 bg-card px-3.5 py-2.5 text-sm text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Thinking…
      </div>
    </div>
  );
}

export default function ChatBody({
  onClose,
  initialMessage,
}: {
  onClose?: () => void;
  /** Auto-sent once on mount (e.g. a food-scan summary handed off from the Food Scanner). */
  initialMessage?: string;
}) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const pagePrompt = usePagePrompt(Boolean(user));
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => {
    if (initialMessage) handleSend(initialMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSend(rawText: string) {
    const text = rawText.trim();
    if (!text || sending) return;

    const priorHistory: ChatMessage[] = messages.map(({ role, content }) => ({ role, content }));
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setSending(true);

    const result = await sendChatMessage({
      message: text,
      currentPath: pathname,
      history: priorHistory,
    });
    setSending(false);

    if (!result.ok) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: result.error,
          actions: result.rateLimited
            ? []
            : [{ type: "internal-route", label: "Contact Team", route: "/contact" }],
        },
      ]);
      return;
    }

    const { answer, actions, needsHuman } = result.data;
    const hasContactAction = actions.some((a) => a.route === "/contact");
    const finalActions =
      needsHuman && !hasContactAction
        ? [
            ...actions,
            { type: "internal-route" as const, label: "Contact Team", route: "/contact" },
          ]
        : actions;

    setMessages((prev) => [...prev, { role: "assistant", content: answer, actions: finalActions }]);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    handleSend(input);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3 rounded-t-2xl bg-gradient-to-br from-navy to-primary p-5 text-white">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-display text-base font-bold">{business.doctorName}</p>
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-turquoise">
              AI Assistant
            </span>
          </div>
          <p className="text-xs text-white/70">Virtual Assistant</p>
          {messages.length === 0 && <p className="mt-1.5 text-xs text-white/85">{pagePrompt}</p>}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat"
            className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Hi, I&apos;m {business.doctorName}&apos;s virtual assistant. How can I help you today?
            </p>
            <div className="grid grid-cols-1 gap-1.5 pt-1">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => handleSend(action.label)}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/60 p-2.5 text-left text-sm font-medium text-navy transition-colors hover:border-turquoise hover:bg-secondary"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                    <action.icon className="h-4 w-4" />
                  </span>
                  {action.label}
                </button>
              ))}
            </div>
          </>
        ) : (
          messages.map((message, index) => <MessageBubble key={index} message={message} />)
        )}
        {sending && <ThinkingBubble />}
      </div>

      <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-border/60 p-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question…"
          maxLength={1000}
          aria-label="Message"
          className="h-10 flex-1 rounded-full border border-border bg-background px-4 text-sm text-navy outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          aria-label="Send message"
          className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-turquoise disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>

      <div className="flex items-start gap-2 border-t border-border/60 bg-secondary/40 px-4 py-2.5">
        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        <p className="text-[0.68rem] leading-relaxed text-muted-foreground">
          This assistant does not diagnose or replace a physician. For medical emergencies, contact
          your local emergency services.
        </p>
      </div>
    </div>
  );
}

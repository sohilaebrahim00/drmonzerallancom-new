import { useEffect, useRef, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { Loader2, Send } from "lucide-react";

import { AppScreen } from "@/app-native/components/AppScreen";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import {
  getMessages,
  markConversationRead,
  sendMessage,
  subscribeToConversation,
  type Message,
} from "@/services/messagingService";

export default function NativeMessageThread() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!conversationId) return;
    getMessages(conversationId).then((msgs) => {
      setMessages(msgs);
      setLoading(false);
      markConversationRead(conversationId);
    });

    const unsubscribe = subscribeToConversation(conversationId, (message) => {
      setMessages((prev) => [...prev, message]);
      markConversationRead(conversationId);
    });
    return unsubscribe;
  }, [conversationId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!conversationId || !input.trim() || sending) return;
    setSending(true);
    const text = input.trim();
    setInput("");
    const result = await sendMessage(conversationId, text);
    setSending(false);
    if (!result.ok) setInput(text);
  }

  return (
    <AppScreen title="Message" back scroll={false}>
      <div className="flex h-full min-h-0 flex-col">
        <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center pt-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            messages.map((m) => {
              const isMine = m.sender_id === user?.id;
              return (
                <div key={m.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                      isMine
                        ? "rounded-br-md bg-primary text-primary-foreground"
                        : "rounded-bl-md border border-border/70 bg-card text-navy/90",
                    )}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form
          onSubmit={onSubmit}
          className="native-safe-bottom flex items-center gap-2 border-t border-border/60 p-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message…"
            maxLength={2000}
            className="h-10 flex-1 rounded-full border border-border bg-background px-4 text-sm text-navy outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            aria-label="Send message"
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </AppScreen>
  );
}

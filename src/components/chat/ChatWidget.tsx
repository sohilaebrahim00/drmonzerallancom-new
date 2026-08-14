import { lazy, Suspense, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, MessageCircle } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";

// The conversation UI (message state, aiChatService, quick actions) and the
// mobile bottom-sheet shell (which pulls in the vaul drag/gesture library)
// are both lazy-loaded so neither ever delays the initial page render —
// they only download once a visitor is actually on mobile and/or opens the
// chat.
const ChatBody = lazy(() => import("./ChatBody"));
const MobileChatDrawer = lazy(() => import("./MobileChatDrawer"));

function ChatBodyFallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const launcher = (
    <motion.button
      type="button"
      aria-label="Open chat — Dr. Monzer Allan's virtual assistant"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4, type: "spring", stiffness: 260, damping: 18 }}
      className="group fixed bottom-6 right-5 z-40 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-navy text-white shadow-[0_10px_30px_-8px_rgba(37,63,164,0.6)] outline-none transition-transform duration-300 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-turquoise focus-visible:ring-offset-2 sm:bottom-8 sm:right-8"
    >
      <span
        className="absolute inset-0 -z-10 rounded-full bg-turquoise/40 blur-xl transition-opacity duration-300 group-hover:opacity-80 motion-safe:animate-pulse"
        aria-hidden="true"
      />
      <MessageCircle className="h-6 w-6" />
      <span
        className="absolute right-0.5 top-0.5 h-3 w-3 rounded-full bg-green ring-2 ring-navy"
        aria-hidden="true"
      />
    </motion.button>
  );

  if (isMobile) {
    return (
      <Suspense fallback={launcher}>
        <MobileChatDrawer open={open} onOpenChange={setOpen} launcher={launcher} />
      </Suspense>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{launcher}</PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        sideOffset={16}
        className="h-[32rem] w-[min(24rem,calc(100vw-2.5rem))] overflow-hidden rounded-2xl border border-white/40 bg-card/95 p-0 shadow-[0_30px_60px_-24px_rgba(23,35,59,0.45)] backdrop-blur-xl"
      >
        <Suspense fallback={<ChatBodyFallback />}>
          <ChatBody onClose={() => setOpen(false)} />
        </Suspense>
      </PopoverContent>
    </Popover>
  );
}

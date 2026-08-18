import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";

const ELIGIBLE_PREFIXES = ["/about", "/packages", "/blog", "/faq"];

export function StickyCta() {
  const { pathname } = useLocation();
  const [dismissed, setDismissed] = useState(false);
  const [pastHero, setPastHero] = useState(false);

  const eligible = ELIGIBLE_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  useEffect(() => {
    setDismissed(false);
    setPastHero(false);
  }, [pathname]);

  useEffect(() => {
    if (!eligible) return;
    const onScroll = () => setPastHero(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [eligible]);

  const visible = eligible && pastHero && !dismissed;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-6 left-5 z-30 flex items-center gap-2 rounded-full border border-border/70 bg-card/95 py-2 pl-4 pr-2 shadow-[0_20px_40px_-20px_rgba(23,35,59,0.4)] backdrop-blur-xl sm:bottom-8 sm:left-8"
        >
          <Link
            to="/packages"
            className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-navy transition-colors hover:text-primary"
          >
            <Sparkles className="h-4 w-4 text-primary" /> View Programs
          </Link>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-navy"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

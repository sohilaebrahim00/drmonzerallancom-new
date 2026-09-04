import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { useTranslate } from "@/i18n";
import { useFloatingSlot } from "@/components/common/floatingStack";

/**
 * Where the "View Programs" pill may appear.
 *
 * /packages IS DELIBERATELY ABSENT. The pill links to /packages, so on that
 * page it invited the visitor to the page they were already on — while sitting
 * on top of the Treatment cards' own "Start Your Program" buttons (measured:
 * 24% of one of them covered, on the live site, at a real scroll position on a
 * phone). A call to action that points at the current page and obscures the
 * real one is worse than no call to action.
 *
 * The rule for adding a prefix here: the pill must not be pointing at the
 * page's own primary action. /about, /blog and /faq are pages that inform; the
 * pill is the only route to the storefront from them, which is the job it
 * exists to do.
 */
const ELIGIBLE_PREFIXES = ["/about", "/blog", "/faq"];

export function StickyCta() {
  const { pathname } = useLocation();
  const t = useTranslate();
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

  // Publishes presence to the shared stack so BackToTop lifts clear of this
  // pill instead of sitting on top of its dismiss button. The pill itself is
  // order 0 on its side, so its own offset is always 0 — it registers for the
  // benefit of what stacks above it.
  useFloatingSlot("viewProgramsPill", visible);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-6 start-5 z-30 flex items-center gap-2 rounded-full border border-border/70 bg-card/95 py-2 ps-4 pe-2 shadow-[0_20px_40px_-20px_rgba(23,35,59,0.4)] backdrop-blur-xl sm:bottom-8 sm:start-8"
        >
          <Link
            to="/packages"
            className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-navy transition-colors hover:text-primary"
          >
            {/* Both strings were hardcoded English and shipped that way to
                Arabic visitors, on top of the purchase button, while the audit
                reported "0 reachable English strings across 20 routes". The
                translation already existed — the component simply never asked
                for it. */}
            <Sparkles className="h-4 w-4 text-primary" /> {t("cta.viewPrograms")}
          </Link>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label={t("cta.dismissViewPrograms")}
            className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-navy"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

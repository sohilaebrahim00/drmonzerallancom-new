import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { useTranslate } from "@/i18n";
import { useFloatingSlot } from "@/components/common/floatingStack";

/**
 * Where the "View Programs" pill may appear.
 *
 * ── THE RULE ───────────────────────────────────────────────────────────────
 * THE PILL EXISTS ONLY ON PAGES THAT HAVE NO OTHER ROUTE TO THE STOREFRONT.
 *
 * Do not add a prefix here without checking that page for its own call to
 * action first. If the page already has one, the pill is not helping — it is a
 * second button competing with the first, floating on top of it.
 *
 * Three pages were removed for exactly that reason, each measured on a phone
 * at real scroll positions rather than reasoned about:
 *
 *   /packages  the pill links to /packages, so it advertised the page the
 *              visitor was already on, while covering 24% of a Treatment
 *              card's own "Start Your Program" button
 *   /about     has its own "Explore Programs" button; the pill covered 38% of
 *              it in English
 *   /faq       same, 36%
 *
 * What is left is the two content surfaces a reader arrives on from search
 * with no purchase path anywhere in front of them. There the pill is the only
 * route to the storefront, which is the job it was added to do.
 */
const ELIGIBLE_PREFIXES = ["/blog", "/education"];

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

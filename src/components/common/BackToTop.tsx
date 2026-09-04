import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { useTranslate } from "@/i18n";
import { useFloatingSlot } from "@/components/common/floatingStack";

export function BackToTop() {
  const t = useTranslate();
  const [visible, setVisible] = useState(false);

  // Lifts above the View Programs pill while the pill is on screen, and drops
  // back to the edge when it isn't. Before this, both were pinned to the same
  // `bottom-6 start-5` and this button covered 95% of the pill — including the
  // pill's dismiss button, so the pill could not be closed.
  const slot = useFloatingSlot("backToTop", visible);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 640);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          initial={{ opacity: 0, y: 12, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.9 }}
          transition={{ duration: 0.25 }}
          aria-label={t("cta.backToTop")}
          style={{ marginBottom: slot.marginBottom }}
          className="fixed bottom-6 start-5 z-40 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_14px_30px_-12px_rgba(37,63,164,0.55)] transition-all duration-300 hover:-translate-y-1 hover:bg-turquoise focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:bottom-8 sm:start-8"
        >
          <ArrowUp className="h-5 w-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

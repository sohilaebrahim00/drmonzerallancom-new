import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronsLeftRight } from "lucide-react";

import { cn } from "@/lib/utils";

import { useTranslate } from "@/i18n";

interface CompareSliderProps {
  before: ReactNode;
  after: ReactNode;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}

export function CompareSlider({
  before,
  after,
  beforeLabel,
  afterLabel,
  className,
}: CompareSliderProps) {
  const t = useTranslate();
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [position, setPosition] = useState(50);

  /**
   * RTL: the LAYOUT mirrors, the PHOTOGRAPHS do not.
   *
   * "Before" moves to the inline-start — the right-hand side in Arabic — so
   * the comparison still runs in the reading direction, the same reasoning
   * that makes the not-medication band mirror. Applying the rule to one and
   * not the other would put two different logics on one page.
   *
   * What is deliberately NOT done is scaleX(-1) on the images. These are
   * photographs of a real table: flipping them reverses the fish, the
   * cutlery and the curtain, and anyone looking closely sees a picture that
   * is simply wrong. Mirroring the arrangement is the point; mirroring the
   * content is a defect.
   *
   * `position` is measured from the INLINE start throughout, so 0 is the left
   * edge in English and the right edge in Arabic.
   */
  const [isRtl, setIsRtl] = useState(false);
  useEffect(() => {
    const read = () => setIsRtl(getComputedStyle(document.documentElement).direction === "rtl");
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["dir", "lang"] });
    return () => mo.disconnect();
  }, []);

  /**
   * useCallback, and listed in the drag effect's deps, because this now closes
   * over `isRtl`. With a stale closure the window pointermove listener would
   * keep using left-to-right maths after a switch to Arabic — the handle would
   * track the pointer backwards. Clicks would have looked fine while dragging
   * was broken, since the click path gets a fresh closure on every render.
   */
  const updateFromClientX = useCallback(
    (clientX: number) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // Measured from whichever edge is the inline start.
      const fromStart = isRtl ? rect.right - clientX : clientX - rect.left;
      const pct = (fromStart / rect.width) * 100;
      setPosition(Math.min(100, Math.max(0, pct)));
    },
    [isRtl],
  );

  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (!draggingRef.current) return;
      updateFromClientX(e.clientX);
    }
    function onUp() {
      draggingRef.current = false;
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [updateFromClientX]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative aspect-[4/3] w-full touch-none select-none overflow-hidden rounded-2xl",
        className,
      )}
      onPointerDown={(e) => {
        draggingRef.current = true;
        updateFromClientX(e.clientX);
      }}
    >
      <div className="absolute inset-0">{after}</div>
      {/* "After" sits at the inline END — right in English, left in Arabic. */}
      <span className="absolute end-3 top-3 z-10 rounded-full bg-navy/70 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
        {afterLabel ?? t("beforeAfter.after")}
      </span>

      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          // Reveal "before" from the inline start: clip the far side away.
          // `inset()` has no logical form, so the side is chosen here rather
          // than in CSS.
          clipPath: isRtl ? `inset(0 0 0 ${100 - position}%)` : `inset(0 ${100 - position}% 0 0)`,
        }}
      >
        {before}
        {/* "Before" sits at the inline START — left in English, right in Arabic. */}
        <span className="absolute start-3 top-3 z-10 rounded-full bg-navy/70 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
          {beforeLabel ?? t("beforeAfter.before")}
        </span>
      </div>

      <div
        className="absolute inset-y-0 z-20 w-0.5 bg-white/80 shadow-[0_0_0_1px_rgba(23,35,59,0.15)]"
        style={{ insetInlineStart: `${position}%` }}
      >
        <button
          type="button"
          role="slider"
          aria-label="Drag to compare before and after"
          aria-valuenow={Math.round(position)}
          aria-valuemin={0}
          aria-valuemax={100}
          tabIndex={0}
          onKeyDown={(e) => {
            // Arrow keys follow the SCREEN, not the value: pressing left must
            // always move the handle left. Because `position` counts from the
            // inline start, that means the sign flips in RTL.
            const step = (delta: number) =>
              setPosition((p) => Math.min(100, Math.max(0, p + (isRtl ? -delta : delta))));
            if (e.key === "ArrowLeft") step(-5);
            if (e.key === "ArrowRight") step(5);
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            draggingRef.current = true;
          }}
          className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full bg-white text-navy shadow-[0_8px_20px_-6px_rgba(23,35,59,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronsLeftRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

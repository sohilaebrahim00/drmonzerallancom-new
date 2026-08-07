import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronsLeftRight } from "lucide-react";

import { cn } from "@/lib/utils";

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
  beforeLabel = "Before",
  afterLabel = "After",
  className,
}: CompareSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [position, setPosition] = useState(50);

  function updateFromClientX(clientX: number) {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, pct)));
  }

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
  }, []);

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
      <span className="absolute right-3 top-3 z-10 rounded-full bg-navy/70 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
        {afterLabel}
      </span>

      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        {before}
        <span className="absolute left-3 top-3 z-10 rounded-full bg-navy/70 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
          {beforeLabel}
        </span>
      </div>

      <div
        className="absolute inset-y-0 z-20 w-0.5 bg-white/80 shadow-[0_0_0_1px_rgba(23,35,59,0.15)]"
        style={{ left: `${position}%` }}
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
            if (e.key === "ArrowLeft") setPosition((p) => Math.max(0, p - 5));
            if (e.key === "ArrowRight") setPosition((p) => Math.min(100, p + 5));
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

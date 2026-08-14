import { cn } from "@/lib/utils";

export function SoldOutBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-navy/90 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-white shadow-sm backdrop-blur-sm",
        className,
      )}
    >
      Out of Stock
    </span>
  );
}

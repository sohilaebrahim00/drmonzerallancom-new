import { cn } from "@/lib/utils";
import { useTranslate } from "@/i18n";

export function SoldOutBadge({ className }: { className?: string }) {
  const t = useTranslate();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-navy/90 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-white shadow-sm backdrop-blur-sm",
        className,
      )}
    >
      {t("product.outOfStock")}
    </span>
  );
}

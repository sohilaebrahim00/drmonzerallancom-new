import { PackageSearch } from "lucide-react";

export function ProductsEmptyState() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border border-dashed border-border/70 bg-secondary/30 px-6 py-16 text-center">
      <PackageSearch className="h-8 w-8 text-primary/60" />
      <p className="font-display text-lg font-bold text-navy">Products Coming Soon</p>
      <p className="text-sm leading-relaxed text-muted-foreground">
        We're finalizing our first wellness products. Check back shortly, or reach out via the
        Contact page if you'd like to be notified.
      </p>
    </div>
  );
}

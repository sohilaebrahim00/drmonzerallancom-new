import { Skeleton } from "@/components/ui/skeleton";

/** Shaped like the real Daily Nutrition hero card — see NativeHome.tsx. */
export function NutritionCardSkeleton() {
  return (
    <div className="rounded-3xl bg-app-surface-secondary p-5">
      <div className="flex items-center gap-4">
        <Skeleton className="h-24 w-24 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2.5">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    </div>
  );
}

/** Shaped like Today's Program card. */
export function ProgramCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/60 bg-app-surface p-4">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-2 h-5 w-32" />
      <Skeleton className="mt-3 h-2 w-full rounded-full" />
      <Skeleton className="mt-3 h-9 w-full rounded-xl" />
    </div>
  );
}

/** Shaped like a compact meal row. */
export function MealRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-app-surface p-3">
      <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-3.5 w-10" />
    </div>
  );
}

export function MealListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <MealRowSkeleton key={i} />
      ))}
    </div>
  );
}

/** Shaped like a profile header (avatar + name + username). */
export function ProfileHeaderSkeleton() {
  return (
    <div className="flex items-center gap-3 p-1">
      <Skeleton className="h-14 w-14 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Loader2, Droplet, UtensilsCrossed, Zap } from "lucide-react";

import { AppScreen } from "@/app-native/components/AppScreen";
import { EmptyState } from "@/app-native/components/EmptyState";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { getMyMealsForDay } from "@/services/mealLogService";
import { getMyHydrationForDay } from "@/services/hydrationService";

type Filter = "all" | "meals" | "activity" | "water";

interface TimelineEntry {
  id: string;
  at: string;
  kind: "meal" | "activity" | "water";
  title: string;
  detail: string;
}

function dayBounds(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

const ICONS: Record<TimelineEntry["kind"], typeof UtensilsCrossed> = {
  meal: UtensilsCrossed,
  activity: Zap,
  water: Droplet,
};

export default function NativeDailyLog() {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    const today = new Date();
    const { start, end } = dayBounds(today);

    Promise.all([
      getMyMealsForDay(today),
      getMyHydrationForDay(today),
      supabase
        ? supabase
            .from("activity_logs")
            .select(
              "id, completed_at, duration_minutes, estimated_calories_burned, activity_library(name)",
            )
            .gte("completed_at", start)
            .lt("completed_at", end)
        : Promise.resolve({ data: [] }),
    ]).then(([meals, water, activities]) => {
      const list: TimelineEntry[] = [
        ...meals.map((m) => ({
          id: `meal-${m.id}`,
          at: m.meal_time,
          kind: "meal" as const,
          title: m.meal_type ? m.meal_type.charAt(0).toUpperCase() + m.meal_type.slice(1) : "Meal",
          detail: `${Math.round(m.total_calories)} kcal`,
        })),
        ...water.map((w) => ({
          id: `water-${w.id}`,
          at: w.logged_at,
          kind: "water" as const,
          title: "Water",
          detail: `${w.amount_ml} ml`,
        })),
        ...(activities.data ?? []).map((a) => ({
          id: `activity-${a.id}`,
          at: a.completed_at,
          kind: "activity" as const,
          title: (a.activity_library as unknown as { name?: string } | null)?.name ?? "Activity",
          detail: a.estimated_calories_burned
            ? `~${Math.round(a.estimated_calories_burned)} kcal · ${a.duration_minutes ?? "—"} min`
            : `${a.duration_minutes ?? "—"} min`,
        })),
      ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

      setEntries(list);
      setLoading(false);
    });
  }, []);

  const FILTER_KIND: Record<Exclude<Filter, "all">, TimelineEntry["kind"]> = {
    meals: "meal",
    activity: "activity",
    water: "water",
  };
  const filtered =
    filter === "all" ? entries : entries.filter((e) => e.kind === FILTER_KIND[filter]);

  const FILTERS: { value: Filter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "meals", label: "Meals" },
    { value: "activity", label: "Activity" },
    { value: "water", label: "Water" },
  ];

  return (
    <AppScreen title="Daily Log" back className="mx-auto w-full max-w-lg px-4 pb-8 pt-3">
      <div className="grid grid-cols-4 gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={cn(
              "cursor-pointer rounded-xl px-1 py-2 text-xs font-semibold transition-colors",
              filter === f.value
                ? "bg-secondary text-primary"
                : "text-muted-foreground hover:bg-app-surface-secondary",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={UtensilsCrossed}
            title="Nothing logged yet today"
            body="Meals, activity, and water you log today will appear here in order."
          />
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {filtered.map((entry) => {
            const Icon = ICONS[entry.kind];
            return (
              <div
                key={entry.id}
                className="flex items-center gap-3 rounded-xl border border-border/60 bg-app-surface p-3.5"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-navy">{entry.title}</p>
                  <p className="text-xs text-muted-foreground">{entry.detail}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(entry.at).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </AppScreen>
  );
}

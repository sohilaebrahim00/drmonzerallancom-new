import { useEffect, useState } from "react";
import { CircleNotch, Lightning } from "@phosphor-icons/react";

import { AppScreen } from "@/app-native/components/AppScreen";
import { EmptyState } from "@/app-native/components/EmptyState";
import { supabase } from "@/lib/supabase";

interface HistoryEntry {
  id: string;
  completed_at: string;
  duration_minutes: number | null;
  estimated_calories_burned: number | null;
  activity_name: string | null;
}

export default function NativeActivityHistory() {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase
      .from("activity_logs")
      .select(
        "id, completed_at, duration_minutes, estimated_calories_burned, activity_library(name)",
      )
      .order("completed_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setEntries(
          (data ?? []).map((row) => ({
            id: row.id,
            completed_at: row.completed_at,
            duration_minutes: row.duration_minutes,
            estimated_calories_burned: row.estimated_calories_burned,
            activity_name:
              (row.activity_library as unknown as { name?: string } | null)?.name ?? null,
          })),
        );
        setLoading(false);
      });
  }, []);

  return (
    <AppScreen title="Movement History" back className="mx-auto w-full max-w-lg px-4 pb-8 pt-3">
      {loading ? (
        <div className="flex justify-center py-10">
          <CircleNotch className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          icon={Lightning}
          title="No activity yet"
          body="Completed movement tasks will appear here."
        />
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-3 rounded-xl border border-border/60 bg-app-surface p-3.5"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                <Lightning className="h-4.5 w-4.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-navy">
                  {entry.activity_name ?? "Activity"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(entry.completed_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                  {entry.duration_minutes ? ` · ${entry.duration_minutes} min` : ""}
                </p>
              </div>
              {entry.estimated_calories_burned != null && (
                <span className="shrink-0 text-sm font-bold text-navy">
                  ~{Math.round(entry.estimated_calories_burned)}
                  <span className="ml-0.5 text-[0.65rem] font-normal text-muted-foreground">
                    kcal
                  </span>
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </AppScreen>
  );
}

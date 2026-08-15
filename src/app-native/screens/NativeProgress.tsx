import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

import { AppScreen } from "@/app-native/components/AppScreen";
import { EmptyState } from "@/app-native/components/EmptyState";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { getMyMealsInRange, type MealLog } from "@/services/mealLogService";
import { getMyWeightHistory } from "@/services/weightService";
import { supabase } from "@/lib/supabase";
import { ChartLineUp } from "@phosphor-icons/react";
import { getDemoMode } from "@/dev/demoMode";
import { DEMO_ACTIVITY_LOGS_TODAY, DEMO_STEP_LOG } from "@/dev/demoFixtures";

type Range = "today" | "7" | "30";
const RANGES: { value: Range; label: string; days: number }[] = [
  { value: "today", label: "Today", days: 1 },
  { value: "7", label: "7 Days", days: 7 },
  { value: "30", label: "30 Days", days: 30 },
];

interface Summary {
  calories: number;
  meals: number;
  activityCalories: number;
  activitiesCompleted: number;
  avgSteps: number;
}

function dailyCalories(meals: MealLog[], days: number): { label: string; kcal: number }[] {
  const byDate = new Map<string, number>();
  for (const meal of meals) {
    const key = new Date(meal.meal_time).toISOString().slice(0, 10);
    byDate.set(key, (byDate.get(key) ?? 0) + meal.total_calories);
  }
  const out: { label: string; kcal: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push({
      label: d.toLocaleDateString(undefined, { day: "numeric", month: "short" }),
      kcal: Math.round(byDate.get(key) ?? 0),
    });
  }
  return out;
}

export default function NativeProgress() {
  const { user } = useAuth();
  const [range, setRange] = useState<Range>("today");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [chartMeals, setChartMeals] = useState<MealLog[]>([]);
  const [latestWeight, setLatestWeight] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);

    // DEV-ONLY demo preview — the same fixed "today" snapshot regardless of
    // the selected range, since there's no real multi-day history to trend.
    if (getDemoMode()) {
      const activityCalories = DEMO_ACTIVITY_LOGS_TODAY.reduce(
        (sum, a) => sum + a.estimated_calories_burned,
        0,
      );
      setSummary({
        calories: 1540,
        meals: 4,
        activityCalories,
        activitiesCompleted: DEMO_ACTIVITY_LOGS_TODAY.length,
        avgSteps: DEMO_STEP_LOG.steps,
      });
      setChartMeals([]);
      setLatestWeight(68);
      setLoading(false);
      return;
    }

    if (!supabase) {
      setLoading(false);
      return;
    }
    const days = RANGES.find((r) => r.value === range)!.days;
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);

    Promise.all([
      getMyMealsInRange(start, new Date(end.getTime() + 86_400_000)),
      supabase
        .from("activity_logs")
        .select("estimated_calories_burned")
        .gte("completed_at", start.toISOString()),
      supabase.from("step_logs").select("steps").gte("date", start.toISOString().slice(0, 10)),
      getMyWeightHistory(days),
    ]).then(([meals, activityLogs, stepLogs, weightHistory]) => {
      const calories = meals.reduce((sum, m) => sum + m.total_calories, 0);
      const activityCalories = (activityLogs.data ?? []).reduce(
        (sum, a) => sum + (a.estimated_calories_burned ?? 0),
        0,
      );
      const steps = stepLogs.data ?? [];
      const avgSteps = steps.length
        ? Math.round(steps.reduce((s, r) => s + r.steps, 0) / steps.length)
        : 0;

      setSummary({
        calories,
        meals: meals.length,
        activityCalories,
        activitiesCompleted: (activityLogs.data ?? []).length,
        avgSteps,
      });
      setChartMeals(meals);
      setLatestWeight(weightHistory[0]?.weight_kg ?? null);
      setLoading(false);
    });
  }, [user, range]);

  const chartData = useMemo(
    () => dailyCalories(chartMeals, RANGES.find((r) => r.value === range)!.days),
    [chartMeals, range],
  );
  const hasAnyData = chartData.some((d) => d.kcal > 0);

  if (!user) {
    return (
      <AppScreen title="Progress" tabBar className="mx-auto w-full max-w-lg px-4 py-10 text-center">
        <p className="text-sm text-muted-foreground">Sign in to see your progress.</p>
      </AppScreen>
    );
  }

  return (
    <AppScreen title="Progress" tabBar className="mx-auto w-full max-w-lg px-4 pb-6 pt-3">
      <div className="grid grid-cols-3 gap-2">
        {RANGES.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => setRange(r.value)}
            className={cn(
              "cursor-pointer rounded-xl px-2 py-2.5 text-xs font-semibold transition-colors",
              range === r.value ? "bg-secondary text-primary" : "bg-app-surface text-navy/70",
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-4 h-40 animate-pulse rounded-2xl bg-app-surface-secondary" />
      ) : (
        range !== "today" && (
          <div className="mt-4 rounded-2xl border border-border/60 bg-app-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Calories
            </p>
            {hasAnyData ? (
              <div className="mt-2 h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 6, right: 4, left: 4, bottom: 0 }}>
                    <defs>
                      <linearGradient id="calorieFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#253fa4" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="#253fa4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: "#5b667d" }}
                      axisLine={false}
                      tickLine={false}
                      interval={range === "30" ? 6 : 0}
                    />
                    <Tooltip
                      cursor={{ stroke: "#dde6ee" }}
                      contentStyle={{ borderRadius: 10, border: "1px solid #dde6ee", fontSize: 12 }}
                      formatter={(value: number) => [`${value} kcal`, ""]}
                      labelFormatter={() => ""}
                    />
                    <Area
                      type="monotone"
                      dataKey="kcal"
                      stroke="#253fa4"
                      strokeWidth={2}
                      fill="url(#calorieFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="mt-2">
                <EmptyState
                  icon={ChartLineUp}
                  title="No data yet"
                  body="Log a meal to see your trend here."
                />
              </div>
            )}
          </div>
        )
      )}

      {!loading && (
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <StatCard label="Calories" value={`${Math.round(summary?.calories ?? 0)}`} />
          <StatCard label="Meals Logged" value={String(summary?.meals ?? 0)} />
          <StatCard
            label="Estimated Activity"
            value={`${Math.round(summary?.activityCalories ?? 0)} kcal`}
          />
          <StatCard
            label="Activities Completed"
            value={String(summary?.activitiesCompleted ?? 0)}
          />
          <StatCard label="Avg. Steps" value={String(summary?.avgSteps ?? 0)} />
          <StatCard label="Latest Weight" value={latestWeight ? `${latestWeight} kg` : "—"} />
        </div>
      )}
    </AppScreen>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-app-surface p-3.5">
      <p className="font-display text-lg font-bold text-navy">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

import { useEffect, useMemo, useState, type ComponentType } from "react";
import { Link } from "react-router-dom";
import {
  Camera,
  CalendarCheck,
  Check,
  Compass,
  Drop,
  Fire,
  Footprints,
  CircleNotch,
  Repeat,
  Sparkle,
  Sun,
  ForkKnife,
  VideoCamera,
} from "@phosphor-icons/react";

import { AppScreen } from "@/app-native/components/AppScreen";
import { CircularProgress } from "@/app-native/components/CircularProgress";
import { EmptyState } from "@/app-native/components/EmptyState";
import { InstallAppCard } from "@/app-native/components/InstallAppCard";
import {
  NutritionCardSkeleton,
  ProgramCardSkeleton,
  MealListSkeleton,
} from "@/app-native/components/AppSkeletons";
import { AppIcon } from "@/app-native/icons";
import { articles } from "@/data/articles";
import { useAuth } from "@/context/AuthContext";
import { useAppBoot } from "@/context/AppBootContext";
import NativeDoctorDashboard from "@/app-native/screens/NativeDoctorDashboard";
import { getMyCurrentTarget, type DailyTarget } from "@/services/bodyProfileService";
import { getMyMealsForDay, saveMealLog, type MealLog } from "@/services/mealLogService";
import { createPostMealActivityTask } from "@/services/activityService";
import { getMyPendingActivityTasks, type ActivityTask } from "@/services/activityService";
import { getMyHydrationForDay, getMyHydrationGoal } from "@/services/hydrationService";
import { getMyStepsForDate } from "@/services/stepService";
import {
  currentProgramDayNumber,
  getMyActiveProgram,
  getProgramDay,
  type NutritionProgram,
  type ProgramItem,
} from "@/services/programService";
import { cn } from "@/lib/utils";
import { useResolvedLocation } from "@/hooks/use-resolved-location";
import {
  computeUpcomingSchedule,
  findNextPrayer,
  formatCountdown,
  type NextPrayer,
} from "@/services/prayerTimesService";
import { computeQiblaBearing } from "@/services/qiblaService";
import { PRAYER_LABELS } from "@/config/prayer";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

function formatToday(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function NativeHome() {
  const { user } = useAuth();
  const { profile, role, status } = useAppBoot();
  const [firstName, setFirstName] = useState<string | null>(null);
  const [caloriesToday, setCaloriesToday] = useState(0);
  const [target, setTarget] = useState<DailyTarget | null>(null);
  const [stepsToday, setStepsToday] = useState<number | null>(null);
  const [activityTask, setActivityTask] = useState<ActivityTask | null>(null);
  const [program, setProgram] = useState<NutritionProgram | null>(null);
  const [programItems, setProgramItems] = useState<ProgramItem[]>([]);
  const [recentMeals, setRecentMeals] = useState<MealLog[]>([]);
  const [macrosToday, setMacrosToday] = useState({ protein: 0, carbs: 0, fat: 0 });
  const [waterMl, setWaterMl] = useState(0);
  const [waterGoalMl, setWaterGoalMl] = useState(2000);
  const [loading, setLoading] = useState(Boolean(user));
  const { coords } = useResolvedLocation();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);

    Promise.all([
      getMyMealsForDay(new Date()),
      getMyCurrentTarget(),
      getMyStepsForDate(new Date()),
      getMyPendingActivityTasks(),
      getMyActiveProgram(),
      getMyHydrationForDay(new Date()),
      getMyHydrationGoal(),
    ]).then(([meals, currentTarget, steps, tasks, activeProgram, water, waterGoal]) => {
      if (cancelled) return;
      setFirstName((profile?.full_name ?? user.email ?? "").split(" ")[0].split("@")[0] || null);
      setCaloriesToday(meals.reduce((sum, m) => sum + m.total_calories, 0));
      setMacrosToday({
        protein: meals.reduce((sum, m) => sum + m.total_protein_g, 0),
        carbs: meals.reduce((sum, m) => sum + m.total_carbs_g, 0),
        fat: meals.reduce((sum, m) => sum + m.total_fat_g, 0),
      });
      setRecentMeals(meals.slice(0, 3));
      setTarget(currentTarget);
      setStepsToday(steps?.steps ?? null);
      setActivityTask(tasks[0] ?? null);
      setProgram(activeProgram);
      setWaterMl(water.reduce((sum, w) => sum + w.amount_ml, 0));
      setWaterGoalMl(waterGoal.goal_ml);
      setLoading(false);

      if (activeProgram) {
        getProgramDay(activeProgram.id, currentProgramDayNumber(activeProgram), user.id).then(
          (day) => {
            if (!cancelled) setProgramItems(day?.items ?? []);
          },
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user, profile?.full_name]);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const nextPrayer: NextPrayer | null = useMemo(() => {
    if (!coords) return null;
    return findNextPrayer(
      computeUpcomingSchedule(coords, {
        calculationMethod: "MuslimWorldLeague",
        madhab: "Shafi",
        manualCity: null,
      }),
      now,
    );
  }, [coords, now]);

  const qiblaBearing = useMemo(
    () => (coords ? Math.round(computeQiblaBearing(coords)) : null),
    [coords],
  );

  // A doctor's Home IS the doctor dashboard — one persona, one destination
  // (see navTabs.ts). Wait for AppBoot to resolve the role first so a
  // patient never flashes the doctor dashboard for a frame.
  if (status === "ready" && (role === "doctor" || role === "admin")) {
    return <NativeDoctorDashboard />;
  }

  const remaining = target ? Math.max(Math.round(target.daily_target - caloriesToday), 0) : null;
  const ringValue = target ? Math.min(caloriesToday / target.daily_target, 1) : 0;
  const taskAvailable = activityTask && new Date(activityTask.available_at) <= now;
  const nextMealItem = programItems.find((i) => !i.completion) ?? null;
  const completedCount = programItems.filter((i) => i.completion === "completed").length;

  return (
    <AppScreen tabBar hideHeader className="mx-auto w-full px-4 pb-6 pt-3">
      {/* Compact top bar — avatar, greeting, date. Never a marketing hero. */}
      <div className="native-safe-top flex items-center justify-between gap-3 pb-4 pt-2">
        <div className="flex min-w-0 items-center gap-3">
          {user && (
            <Link
              to="/account"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-primary"
            >
              {(firstName ?? user.email ?? "U").charAt(0).toUpperCase()}
            </Link>
          )}
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-extrabold tracking-tight text-navy">
              {user
                ? `${greeting()}${firstName ? `, ${firstName}` : ""}`
                : "Welcome to Dr. Monzer Allan"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user ? formatToday() : "Your daily nutrition companion"}
            </p>
          </div>
        </div>
        {user ? (
          <Link
            to="/notifications"
            aria-label="Notifications"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-navy transition-colors hover:bg-secondary"
          >
            <AppIcon name="notifications" size="nav" />
          </Link>
        ) : (
          <img
            src="/ma-logo.png"
            alt=""
            className="h-9 w-9 shrink-0 rounded-full border border-border/70 object-contain p-1"
          />
        )}
      </div>

      <div className="mb-3">
        <InstallAppCard />
      </div>

      {/*
        Information hierarchy (§14): Nutrition → Program → Scan → Recent
        Meals dominate the main column; Daily Metrics → Movement → Quick
        Actions → Care → Prayer/Qibla form a single utility panel in the
        secondary column (§23). Program moved ABOVE Scan per §19 — one of
        the two main product differentiators, previously buried below
        several utilities.
      */}
      <div className="mt-3 lg:grid lg:grid-cols-3 lg:items-start lg:gap-6">
        {/* ── MAIN column ─────────────────────────────────────────── */}
        <div className="space-y-4 lg:col-span-2">
          {!user ? (
            <GuestWelcomeCard />
          ) : loading ? (
            <NutritionCardSkeleton />
          ) : (
            <>
              <DailyNutritionCard
                caloriesToday={caloriesToday}
                target={target}
                remaining={remaining}
                ringValue={ringValue}
              />
              <AIInsightLine caloriesToday={caloriesToday} target={target} program={program} />
              {(target?.protein_target_g || target?.carbs_target_g || target?.fat_target_g) && (
                <MacroSummaryRow macros={macrosToday} target={target} />
              )}
            </>
          )}

          {user &&
            (loading ? (
              <ProgramCardSkeleton />
            ) : program ? (
              <TodayProgramCard
                program={program}
                nextMealItem={nextMealItem}
                completedCount={completedCount}
                totalCount={programItems.length}
              />
            ) : (
              <EmptyState
                icon={ForkKnife}
                title="No active program yet"
                body="Your assigned nutrition program will appear here once your doctor sets one up."
                action={
                  <Link to="/account" className="text-xs font-semibold text-primary">
                    Connect With Doctor
                  </Link>
                }
              />
            ))}

          <ScanFeatureCard />

          {user && (
            <div>
              <div className="mb-2 flex items-center justify-between px-0.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Recent Meals
                </p>
                <Link to="/daily-log" className="text-xs font-semibold text-primary">
                  View Daily Log
                </Link>
              </div>
              {loading ? (
                <MealListSkeleton />
              ) : recentMeals.length === 0 ? (
                <EmptyState
                  icon={Camera}
                  title="No meals yet"
                  body="Scan your first meal to start tracking today's nutrition."
                  action={
                    <Link to="/food-scanner" className="text-xs font-semibold text-primary">
                      Scan Meal
                    </Link>
                  }
                />
              ) : (
                <div className="space-y-2">
                  {recentMeals.map((meal) => (
                    <RecentMealRow
                      key={meal.id}
                      meal={meal}
                      onLoggedAgain={(calories) => setCaloriesToday((c) => c + calories)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── SECONDARY column — one coherent utility panel (§23) ──── */}
        <div className="mt-4 space-y-3 lg:col-span-1 lg:mt-0">
          {user && !loading && (
            <div className="grid grid-cols-2 gap-2.5">
              <StatChip
                icon={Footprints}
                label="Steps"
                value={stepsToday != null ? stepsToday.toLocaleString() : "—"}
              />
              <Link to="/hydration" className="block">
                <StatChip
                  icon={Drop}
                  label="Water"
                  value={`${(waterMl / 1000).toFixed(1)}L / ${(waterGoalMl / 1000).toFixed(1)}L`}
                />
              </Link>
              <StatChip icon={Fire} label="Meals" value={String(recentMeals.length)} />
              {/* Program X/Y replaces the metric that used to duplicate the
                  Movement Task card below (§18) — the card itself remains
                  the one place movement info lives. */}
              <Link to={program ? "/my-program" : "/account"} className="block">
                <StatChip
                  icon={CalendarCheck}
                  label="Program"
                  value={program ? `${completedCount}/${programItems.length || "—"}` : "—"}
                />
              </Link>
            </div>
          )}

          {user && activityTask?.activity && (
            <Link
              to="/activity-task"
              className="flex items-center gap-3 rounded-2xl border border-turquoise/30 bg-turquoise/10 p-3.5"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-turquoise/20 text-turquoise">
                <AppIcon name="movement" size="small" weight="duotone" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold uppercase tracking-wide text-turquoise/90">
                  Suggested Movement
                </span>
                <span className="block text-sm font-bold text-navy">
                  {activityTask.activity.name}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {taskAvailable
                    ? "Ready now"
                    : `Ready ${formatCountdown(new Date(activityTask.available_at), now)}`}
                </span>
              </span>
            </Link>
          )}

          <div className="grid grid-cols-3 gap-2">
            <SmallQuickAction iconName="ai" label="Ask AI" to="/ai" />
            <SmallQuickAction iconName="progress" label="Progress" to="/progress" />
            <SmallQuickAction iconName="weight" label="Weight" to="/my-health" />
          </div>

          {/* Care / Consultation — a compact link, not a live-data card (§23/§14 item 9). */}
          <Link
            to="/consultations"
            className="flex items-center gap-3 rounded-2xl border border-border/60 bg-app-surface p-3.5"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
              <VideoCamera className="h-4.5 w-4.5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-bold text-navy">Consultations</span>
              <span className="block text-[0.65rem] text-muted-foreground">
                Book or view your care team
              </span>
            </span>
          </Link>

          {/* Prayer + Qibla — a compact utility, never competing with nutrition. */}
          <div className="flex divide-x divide-border/60 rounded-2xl border border-border/60 bg-app-surface">
            <Link to="/prayer-times" className="flex flex-1 items-center gap-2 p-3">
              <Sun className="h-4 w-4 shrink-0 text-primary" />
              <span className="min-w-0">
                <span className="block truncate text-xs font-bold text-navy">
                  {nextPrayer ? PRAYER_LABELS[nextPrayer.name] : "Prayer"}
                </span>
                <span className="block truncate text-[0.65rem] text-muted-foreground">
                  {nextPrayer ? formatCountdown(nextPrayer.time, now) : "Set location"}
                </span>
              </span>
            </Link>
            <Link to="/qibla" className="flex flex-1 items-center gap-2 p-3">
              <Compass className="h-4 w-4 shrink-0 text-primary" />
              <span className="min-w-0">
                <span className="block truncate text-xs font-bold text-navy">Qibla</span>
                <span className="block truncate text-[0.65rem] text-muted-foreground">
                  {qiblaBearing !== null ? `${qiblaBearing}°` : "Tap to find"}
                </span>
              </span>
            </Link>
          </div>

          <RecommendedArticleCard />
        </div>
      </div>
    </AppScreen>
  );
}

/** "Recommended for You" — one educational recommendation, kept firmly at the bottom (§27), never competing with primary daily controls. Reuses src/data/articles.ts, which is deliberately left on its existing icon library (shared with the marketing website's Education pages — see the report's icon-migration exceptions). */
function RecommendedArticleCard() {
  const article = articles[0];
  if (!article) return null;
  const ArticleIcon: ComponentType<{ className?: string }> = article.icon;

  return (
    <div>
      <p className="mb-1.5 px-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
        Recommended for You
      </p>
      <Link
        to={`/blog/${article.slug}`}
        className="flex items-center gap-3 rounded-2xl border border-border/60 bg-app-surface p-3"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
          <ArticleIcon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-semibold text-navy">{article.title}</span>
        </span>
      </Link>
    </div>
  );
}

function GuestWelcomeCard() {
  return (
    <div className="overflow-hidden rounded-3xl border border-border/60 bg-app-surface">
      <div className="grid gap-5 p-5 sm:grid-cols-5 sm:items-center sm:gap-4">
        <div className="sm:col-span-3">
          <p className="font-display text-xl font-extrabold tracking-tight text-navy">
            Your daily nutrition companion.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Track meals, understand your nutrition, follow your program, and stay connected with
            your doctor.
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <Link
              to="/join"
              className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-turquoise"
            >
              Create Free Account
            </Link>
            <Link
              to="/login"
              className="rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-navy transition-colors hover:border-turquoise"
            >
              Sign In
            </Link>
          </div>
        </div>
        <div className="hidden sm:col-span-2 sm:flex sm:justify-end">
          <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-white">
            <CircularProgress
              value={0.68}
              size={104}
              strokeWidth={8}
              progressClassName="text-primary"
              trackClassName="text-primary/15"
            >
              <Fire className="h-7 w-7 text-primary" />
            </CircularProgress>
          </div>
        </div>
      </div>
    </div>
  );
}

function DailyNutritionCard({
  caloriesToday,
  target,
  remaining,
  ringValue,
}: {
  caloriesToday: number;
  target: DailyTarget | null;
  remaining: number | null;
  ringValue: number;
}) {
  return (
    <div className="rounded-3xl bg-gradient-to-br from-navy to-primary p-5 text-white shadow-[0_20px_44px_-24px_rgba(23,35,59,0.55)]">
      <div className="flex items-center gap-4">
        <CircularProgress
          value={ringValue}
          size={92}
          strokeWidth={8}
          progressClassName="text-turquoise"
          trackClassName="text-white"
        >
          <div className="text-center leading-none">
            <p className="font-display text-xl font-extrabold">{Math.round(caloriesToday)}</p>
          </div>
        </CircularProgress>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
            Today&apos;s Nutrition
          </p>
          <p className="mt-0.5 font-display text-base font-bold">
            {Math.round(caloriesToday)}
            {target && (
              <span className="font-semibold text-white/70">
                {" "}
                of {Math.round(target.daily_target)} kcal
              </span>
            )}
          </p>
          {target?.source === "doctor" && (
            <p className="mt-0.5 text-[0.65rem] text-white/70">Target set by Dr. Monzer</p>
          )}
          {!target && (
            <p className="mt-0.5 text-[0.65rem] text-white/70">Set your target in My Health</p>
          )}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/15 pt-3.5 text-center">
        <div>
          <p className="font-display text-sm font-bold">{Math.round(caloriesToday)}</p>
          <p className="text-[0.65rem] text-white/70">Consumed</p>
        </div>
        <div>
          <p className="font-display text-sm font-bold">{remaining ?? "—"}</p>
          <p className="text-[0.65rem] text-white/70">Remaining</p>
        </div>
      </div>
    </div>
  );
}

/**
 * One deterministic, template-based sentence from real numbers already on
 * screen — never a Gemini call (§58: "Do not generate an insight if
 * context is insufficient"). Renders nothing rather than a vague/empty
 * insight when there isn't enough real data yet.
 */
function AIInsightLine({
  caloriesToday,
  target,
  program,
}: {
  caloriesToday: number;
  target: DailyTarget | null;
  program: NutritionProgram | null;
}) {
  if (caloriesToday <= 0 && !program) return null;

  let text: string | null = null;
  if (caloriesToday > 0 && target) {
    const remaining = Math.max(Math.round(target.daily_target - caloriesToday), 0);
    text = `You've logged ${Math.round(caloriesToday)} kcal today — about ${remaining} kcal remaining based on your target.`;
  } else if (caloriesToday > 0) {
    text = `You've logged ${Math.round(caloriesToday)} kcal today.`;
  }
  if (!text) return null;

  return (
    <div className="flex items-start gap-2.5 rounded-2xl bg-secondary/50 px-3.5 py-3">
      <Sparkle className="mt-0.5 h-4 w-4 shrink-0 text-primary" weight="fill" />
      <p className="text-xs leading-relaxed text-navy/85">{text}</p>
    </div>
  );
}

function MacroRow({
  label,
  consumed,
  target,
}: {
  label: string;
  consumed: number;
  target: number | null;
}) {
  const pct = target ? Math.min(consumed / target, 1) : 0;
  return (
    <div className="rounded-xl border border-border/60 bg-app-surface p-3">
      <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-bold text-navy">
        {Math.round(consumed)}
        {target && (
          <span className="font-normal text-muted-foreground"> / {Math.round(target)}g</span>
        )}
      </p>
      {target && (
        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct * 100}%` }} />
        </div>
      )}
    </div>
  );
}

function MacroSummaryRow({
  macros,
  target,
}: {
  macros: { protein: number; carbs: number; fat: number };
  target: DailyTarget;
}) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      <MacroRow label="Protein" consumed={macros.protein} target={target.protein_target_g} />
      <MacroRow label="Carbs" consumed={macros.carbs} target={target.carbs_target_g} />
      <MacroRow label="Fat" consumed={macros.fat} target={target.fat_target_g} />
    </div>
  );
}

function ScanFeatureCard() {
  return (
    <Link
      to="/food-scanner"
      className="group flex items-center gap-4 overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-secondary via-secondary to-white p-5 transition-transform active:scale-[0.99]"
    >
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-navy to-primary text-white shadow-[0_10px_24px_-10px_rgba(37,63,164,0.6)] transition-transform group-hover:scale-105">
        <Camera className="h-6 w-6" weight="duotone" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-base font-bold text-navy">Scan Your Meal</p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          AI-estimated nutrition breakdown from a photo.
        </p>
      </div>
      <span className="shrink-0 rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground">
        Scan Now
      </span>
    </Link>
  );
}

const MEAL_TYPE_LABEL: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

function TodayProgramCard({
  program,
  nextMealItem,
  completedCount,
  totalCount,
}: {
  program: NutritionProgram;
  nextMealItem: ProgramItem | null;
  completedCount: number;
  totalCount: number;
}) {
  const dayNumber = currentProgramDayNumber(program);
  return (
    <div className="rounded-2xl border border-primary/15 bg-app-surface p-4 shadow-[0_2px_14px_-6px_rgba(23,35,59,0.12)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <CalendarCheck className="h-4 w-4 text-primary" weight="duotone" />
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Today&apos;s Program
          </p>
        </div>
        <span className="text-xs font-semibold text-primary">Day {dayNumber} of 30</span>
      </div>
      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-turquoise"
          style={{ width: `${(dayNumber / 30) * 100}%` }}
        />
      </div>
      {totalCount > 0 && (
        <p className="mt-1.5 text-[0.7rem] text-muted-foreground">
          {completedCount} of {totalCount} completed today
        </p>
      )}

      {nextMealItem && (
        <div className="mt-3 rounded-xl bg-secondary/50 p-3">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-primary">
            Next Meal — {MEAL_TYPE_LABEL[nextMealItem.meal_type] ?? nextMealItem.meal_type}
          </p>
          <p className="mt-0.5 text-sm font-bold text-navy">{nextMealItem.title}</p>
          {nextMealItem.suggested_foods && (
            <p className="text-xs text-muted-foreground">{nextMealItem.suggested_foods}</p>
          )}
        </div>
      )}

      <div className="mt-3.5 flex gap-2.5">
        <Link
          to="/my-program"
          className="flex-1 rounded-xl border border-border py-2.5 text-center text-xs font-semibold text-navy"
        >
          View Program
        </Link>
        <Link
          to="/food-scanner"
          state={nextMealItem ? { programItemId: nextMealItem.id } : undefined}
          className="flex-1 rounded-xl bg-primary py-2.5 text-center text-xs font-semibold text-primary-foreground"
        >
          Scan This Meal
        </Link>
      </div>
    </div>
  );
}

/** "Log Again" reuses the exact items from a past meal_log — no new Gemini call, no new table (favorites would need one; this doesn't). */
function RecentMealRow({
  meal,
  onLoggedAgain,
}: {
  meal: MealLog;
  onLoggedAgain: (calories: number) => void;
}) {
  const [state, setState] = useState<"idle" | "saving" | "done">("idle");

  async function handleLogAgain() {
    if (state !== "idle" || meal.items.length === 0) return;
    setState("saving");
    const outcome = await saveMealLog({
      mealType: (meal.meal_type as "breakfast" | "lunch" | "dinner" | "snack") ?? null,
      items: meal.items.map((item) => ({
        name: item.name,
        estimatedPortion: item.estimatedPortion,
        estimatedCalories: item.estimatedCalories,
        proteinGrams: item.proteinGrams,
        carbohydrateGrams: item.carbohydrateGrams,
        fatGrams: item.fatGrams,
      })),
      aiConfidence: null,
      isOutsideProgram: true,
      sharedWithFriends: meal.shared_with_friends,
    });
    if (!outcome.ok) {
      setState("idle");
      return;
    }
    await createPostMealActivityTask(outcome.mealLogId);
    onLoggedAgain(meal.total_calories);
    setState("done");
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-app-surface p-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
        <ForkKnife className="h-4.5 w-4.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold capitalize text-navy">
          {meal.meal_type ?? "Meal"}
        </p>
        <p className="text-xs text-muted-foreground">
          {new Date(meal.meal_time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
        </p>
      </div>
      <span className="shrink-0 text-sm font-bold text-navy">
        {Math.round(meal.total_calories)}
        <span className="ml-0.5 text-[0.65rem] font-normal text-muted-foreground">kcal</span>
      </span>
      <button
        type="button"
        onClick={handleLogAgain}
        disabled={state !== "idle"}
        aria-label="Log again"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-primary disabled:opacity-60"
      >
        {state === "saving" ? (
          <CircleNotch className="h-4 w-4 animate-spin" />
        ) : state === "done" ? (
          <Check className="h-4 w-4 text-app-success" weight="bold" />
        ) : (
          <Repeat className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

function StatChip({
  icon: IconComponent,
  label,
  value,
}: {
  icon: typeof Footprints;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-app-surface p-3.5">
      <IconComponent className="h-4 w-4 text-primary" />
      <p className="mt-1.5 font-display text-base font-bold text-navy">{value}</p>
      <p className="text-[0.65rem] text-muted-foreground">{label}</p>
    </div>
  );
}

function SmallQuickAction({
  iconName,
  label,
  to,
}: {
  iconName: Parameters<typeof AppIcon>[0]["name"];
  label: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-app-surface py-3 text-center transition-colors hover:bg-secondary active:scale-[0.97]",
      )}
    >
      <AppIcon name={iconName} size="small" tone="primary" />
      <span className="text-[0.65rem] font-semibold text-navy">{label}</span>
    </Link>
  );
}

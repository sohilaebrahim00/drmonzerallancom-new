import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, CheckCircle, CircleNotch, ForkKnife } from "@phosphor-icons/react";

import { AppScreen } from "@/app-native/components/AppScreen";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/app-native/components/EmptyState";
import { ProgramCardSkeleton } from "@/app-native/components/AppSkeletons";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { PROGRAM_LENGTH_DAYS } from "@/config/features";
import {
  currentProgramDayNumber,
  getMyActiveProgram,
  getProgramDay,
  markProgramItemSkipped,
  type NutritionProgram,
  type ProgramDay,
} from "@/services/programService";

function DayStrip({
  todayNumber,
  selected,
  onSelect,
}: {
  todayNumber: number;
  selected: number;
  onSelect: (day: number) => void;
}) {
  const start = Math.max(1, Math.min(todayNumber - 2, PROGRAM_LENGTH_DAYS - 4));
  const days = Array.from({ length: 5 }, (_, i) => start + i).filter(
    (d) => d >= 1 && d <= PROGRAM_LENGTH_DAYS,
  );

  return (
    <div className="flex gap-2">
      {days.map((d) => {
        const isSelected = d === selected;
        const isToday = d === todayNumber;
        const isPast = d < todayNumber;
        return (
          <button
            key={d}
            type="button"
            onClick={() => onSelect(d)}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2.5 text-center transition-colors",
              isSelected
                ? "bg-primary text-primary-foreground"
                : isPast
                  ? "bg-app-surface-secondary text-muted-foreground"
                  : "bg-app-surface text-navy",
            )}
          >
            <span className="text-[0.6rem] font-semibold uppercase opacity-80">
              {isToday ? "Today" : `Day`}
            </span>
            <span className="text-sm font-bold">{d}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function NativeMyProgram() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<NutritionProgram | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [day, setDay] = useState<ProgramDay | null>(null);
  const [dayLoading, setDayLoading] = useState(false);

  async function reloadDay(activeProgram: NutritionProgram, dayNumber: number) {
    if (!user) return;
    setDayLoading(true);
    const d = await getProgramDay(activeProgram.id, dayNumber, user.id);
    setDay(d);
    setDayLoading(false);
  }

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    getMyActiveProgram().then(async (prog) => {
      setProgram(prog);
      if (prog) {
        const todayNumber = currentProgramDayNumber(prog);
        setSelectedDay(todayNumber);
        await reloadDay(prog, todayNumber);
      }
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleSkipItem(itemId: string) {
    await markProgramItemSkipped(itemId);
    if (program) await reloadDay(program, selectedDay);
  }

  function handleSelectDay(dayNumber: number) {
    setSelectedDay(dayNumber);
    if (program) reloadDay(program, dayNumber);
  }

  if (!user) {
    return (
      <AppScreen title="My Program" back className="mx-auto w-full max-w-lg px-4 py-10 text-center">
        <p className="text-sm text-muted-foreground">Sign in to see your program.</p>
      </AppScreen>
    );
  }

  if (loading) {
    return (
      <AppScreen title="My Program" back className="mx-auto w-full max-w-lg px-4 pb-8 pt-3">
        <ProgramCardSkeleton />
      </AppScreen>
    );
  }

  if (!program) {
    return (
      <AppScreen title="My Program" back className="mx-auto w-full max-w-lg px-4 py-10">
        <EmptyState
          icon={ForkKnife}
          title="No active program yet"
          body="Connect with Dr. Monzer from your Account to get a personalized 30-day nutrition program."
        />
      </AppScreen>
    );
  }

  const todayNumber = currentProgramDayNumber(program);
  const isViewingToday = selectedDay === todayNumber;
  const completedCount = day?.items.filter((i) => i.completion === "completed").length ?? 0;

  return (
    <AppScreen title="My Program" back className="mx-auto w-full max-w-lg px-4 pb-8 pt-3">
      <div className="rounded-3xl bg-gradient-to-br from-navy to-primary p-5 text-white shadow-[0_20px_44px_-24px_rgba(23,35,59,0.55)]">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
          {program.title}
        </p>
        <p className="mt-1 font-display text-2xl font-extrabold">
          Day {todayNumber} of {PROGRAM_LENGTH_DAYS}
        </p>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-turquoise"
            style={{ width: `${(todayNumber / PROGRAM_LENGTH_DAYS) * 100}%` }}
          />
        </div>
        {isViewingToday && (
          <p className="mt-2 text-xs text-white/80">
            {completedCount} of {day?.items.length ?? 0} items completed today
          </p>
        )}
      </div>

      <div className="mt-4">
        <DayStrip todayNumber={todayNumber} selected={selectedDay} onSelect={handleSelectDay} />
      </div>

      {day?.doctor_instructions && (
        <p className="mt-3 rounded-xl bg-app-surface-secondary p-3 text-xs leading-relaxed text-navy/80">
          {day.doctor_instructions}
        </p>
      )}

      <div className="mt-4 space-y-2.5">
        {dayLoading ? (
          <CircleNotch className="mx-auto h-5 w-5 animate-spin text-primary" />
        ) : (day?.items ?? []).length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            No meals planned for this day.
          </p>
        ) : (
          (day?.items ?? []).map((item) => {
            const completed = item.completion === "completed";
            return (
              <div
                key={item.id}
                className={cn(
                  "rounded-xl border p-3.5 transition-opacity",
                  completed
                    ? "border-border/40 bg-app-surface-secondary opacity-70"
                    : "border-border/60 bg-app-surface shadow-sm",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-primary">
                      {item.meal_type}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-navy">{item.title}</p>
                    {item.suggested_foods && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{item.suggested_foods}</p>
                    )}
                  </div>
                  {item.completion && (
                    <span
                      className={cn(
                        "flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase",
                        completed
                          ? "bg-app-success/10 text-app-success"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {completed && <CheckCircle className="h-3 w-3" />}
                      {item.completion}
                    </span>
                  )}
                </div>
                {!item.completion && isViewingToday && (
                  <div className="mt-2.5 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        navigate("/food-scanner", { state: { programItemId: item.id } })
                      }
                      className="h-8 flex-1 cursor-pointer text-xs"
                    >
                      <Camera className="h-3.5 w-3.5" /> Scan My Meal
                    </Button>
                    <button
                      type="button"
                      onClick={() => handleSkipItem(item.id)}
                      className="cursor-pointer rounded-lg border border-border px-3 text-xs font-semibold text-muted-foreground"
                    >
                      Skip
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </AppScreen>
  );
}

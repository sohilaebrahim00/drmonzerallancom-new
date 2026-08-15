import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CircleNotch, Play, Repeat, SkipForward, Timer } from "@phosphor-icons/react";

import { AppScreen } from "@/app-native/components/AppScreen";
import { Button } from "@/components/ui/button";
import { hapticSuccess } from "@/lib/haptics";
import {
  completeActivityTask,
  estimateCaloriesBurned,
  getActivityLibrary,
  getMyPendingActivityTasks,
  skipActivityTask,
  type ActivityLibraryEntry,
  type ActivityTask,
} from "@/services/activityService";
import { getMyBodyProfile } from "@/services/bodyProfileService";

export default function NativeActivityTask() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<ActivityTask | null>(null);
  const [library, setLibrary] = useState<ActivityLibraryEntry[]>([]);
  const [weightKg, setWeightKg] = useState<number | null>(null);
  const [state, setState] = useState<"idle" | "in-progress" | "done">("idle");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getMyPendingActivityTasks(), getActivityLibrary(), getMyBodyProfile()]).then(
      ([tasks, activities, bodyProfile]) => {
        setTask(tasks[0] ?? null);
        setLibrary(activities);
        setWeightKg(bodyProfile?.weight_kg ?? null);
        setLoading(false);
      },
    );
  }, []);

  async function handleDone() {
    if (!task || saving) return;
    setSaving(true);
    const duration = task.activity?.duration_minutes ?? 20;
    await completeActivityTask(task.id, duration);
    setSaving(false);
    setState("done");
    hapticSuccess();
  }

  async function handleSkip() {
    if (!task || saving) return;
    setSaving(true);
    await skipActivityTask(task.id);
    setSaving(false);
    navigate("/", { replace: true });
  }

  function handleChangeActivity() {
    if (!task || library.length === 0) return;
    const alternatives = library.filter((a) => a.id !== task.activity_id);
    const next = alternatives[Math.floor(Math.random() * alternatives.length)] ?? library[0];
    setTask({ ...task, activity: next, activity_id: next.id });
  }

  if (loading) {
    return (
      <AppScreen title="Activity" back className="flex min-h-[50vh] items-center justify-center">
        <CircleNotch className="h-7 w-7 animate-spin text-primary" />
      </AppScreen>
    );
  }

  if (!task || !task.activity) {
    return (
      <AppScreen title="Activity" back className="mx-auto w-full max-w-lg px-4 py-10 text-center">
        <p className="text-sm text-muted-foreground">No activity task is ready right now.</p>
      </AppScreen>
    );
  }

  const estimatedBurn = estimateCaloriesBurned(
    task.activity.met_value,
    task.activity.duration_minutes,
    weightKg,
  );
  const burnLow = Math.round(estimatedBurn * 0.75);
  const burnHigh = Math.round(estimatedBurn * 1.25);

  return (
    <AppScreen title="Suggested Movement" back className="mx-auto w-full max-w-lg px-4 pb-8 pt-3">
      <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-navy to-primary p-6 text-center text-white shadow-sm">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/15">
          <Timer className="h-6 w-6" />
        </span>
        <p className="mt-3 font-display text-2xl font-extrabold">{task.activity.name}</p>
        <p className="mt-1 text-sm text-white/80">{task.activity.duration_minutes} minutes</p>
        <p className="mt-3 text-xs uppercase tracking-wide text-white/70">Estimated Activity</p>
        <p className="text-lg font-bold">
          ~{burnLow}–{burnHigh} kcal
        </p>
      </div>

      {task.activity.instructions && (
        <p className="mt-4 rounded-xl border border-border/70 bg-secondary/40 p-3.5 text-sm leading-relaxed text-navy/80">
          {task.activity.instructions}
        </p>
      )}

      {state === "done" ? (
        <div className="mt-6 text-center">
          <p className="font-display text-lg font-bold text-navy">Nice work.</p>
          <p className="mt-1 text-sm text-muted-foreground">Your activity has been logged.</p>
          <Button
            onClick={() => navigate("/", { replace: true })}
            className="mt-4 w-full cursor-pointer"
          >
            Back to Home
          </Button>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-2.5">
          {state === "idle" ? (
            <Button onClick={() => setState("in-progress")} className="w-full cursor-pointer">
              <Play className="h-4 w-4" /> Start
            </Button>
          ) : (
            <Button onClick={handleDone} disabled={saving} className="w-full cursor-pointer">
              {saving ? <CircleNotch className="h-4 w-4 animate-spin" /> : "Done"}
            </Button>
          )}
          <div className="grid grid-cols-2 gap-2.5">
            <Button onClick={handleChangeActivity} variant="outline" className="cursor-pointer">
              <Repeat className="h-4 w-4" /> Change
            </Button>
            <Button
              onClick={handleSkip}
              disabled={saving}
              variant="outline"
              className="cursor-pointer"
            >
              <SkipForward className="h-4 w-4" /> Skip
            </Button>
          </div>
        </div>
      )}
    </AppScreen>
  );
}

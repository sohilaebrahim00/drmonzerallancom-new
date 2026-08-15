import { useEffect, useState } from "react";
import { Droplet, Loader2, Plus, Trash2 } from "lucide-react";

import { AppScreen } from "@/app-native/components/AppScreen";
import { CircularProgress } from "@/app-native/components/CircularProgress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { hapticTap } from "@/lib/haptics";
import { HYDRATION_QUICK_ADD_ML } from "@/config/features";
import {
  deleteHydrationLog,
  getMyHydrationForDay,
  getMyHydrationGoal,
  logHydration,
  setMyHydrationGoal,
  type HydrationGoal,
  type HydrationLog,
} from "@/services/hydrationService";

export default function NativeHydration() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<HydrationLog[]>([]);
  const [goal, setGoal] = useState<HydrationGoal | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [goalInput, setGoalInput] = useState("");
  const [editingGoal, setEditingGoal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    Promise.all([getMyHydrationForDay(new Date()), getMyHydrationGoal()]).then(([l, g]) => {
      setLogs(l);
      setGoal(g);
      setLoading(false);
    });
  }

  useEffect(refresh, []);

  const totalMl = logs.reduce((sum, l) => sum + l.amount_ml, 0);
  const goalMl = goal?.goal_ml ?? 2000;
  const progress = Math.min(totalMl / goalMl, 1);

  async function handleAdd(amountMl: number) {
    hapticTap();
    setError(null);
    const outcome = await logHydration(amountMl);
    if (!outcome.ok) {
      setError(outcome.error);
      return;
    }
    refresh();
  }

  async function handleSaveGoal() {
    const value = Number(goalInput);
    if (!value || value <= 0) return;
    const outcome = await setMyHydrationGoal(value);
    if (!outcome.ok) {
      setError(outcome.error);
      return;
    }
    setEditingGoal(false);
    setGoalInput("");
    refresh();
  }

  if (loading) {
    return (
      <AppScreen title="Hydration" back className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </AppScreen>
    );
  }

  return (
    <AppScreen title="Hydration" back className="mx-auto w-full max-w-lg px-4 pb-8 pt-3">
      <div className="flex flex-col items-center rounded-3xl border border-border/60 bg-app-surface p-6">
        <CircularProgress
          value={progress}
          size={128}
          strokeWidth={10}
          progressClassName="text-primary"
          trackClassName="text-primary/15"
        >
          <div className="text-center leading-none">
            <p className="font-display text-xl font-extrabold text-navy">
              {(totalMl / 1000).toFixed(1)}
            </p>
            <p className="text-[0.65rem] text-muted-foreground">
              of {(goalMl / 1000).toFixed(1)} L
            </p>
          </div>
        </CircularProgress>

        {editingGoal ? (
          <div className="mt-4 flex w-full max-w-[220px] gap-2">
            <Input
              type="number"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              placeholder="Goal in ml"
            />
            <Button onClick={handleSaveGoal} className="shrink-0 cursor-pointer">
              Save
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (goal?.source === "doctor") return;
              setGoalInput(String(goalMl));
              setEditingGoal(true);
            }}
            className="mt-2 text-xs font-semibold text-primary"
          >
            {goal?.source === "doctor" ? "Goal set by Dr. Monzer" : "Edit Goal"}
          </button>
        )}
      </div>

      {error && <p className="mt-3 text-center text-xs text-destructive">{error}</p>}

      <div className="mt-4 flex gap-2.5">
        {HYDRATION_QUICK_ADD_ML.map((ml) => (
          <Button
            key={ml}
            onClick={() => handleAdd(ml)}
            variant="outline"
            className="flex-1 cursor-pointer"
          >
            <Droplet className="h-4 w-4" /> +{ml} ml
          </Button>
        ))}
      </div>
      <div className="mt-2.5 flex gap-2">
        <Input
          type="number"
          value={customAmount}
          onChange={(e) => setCustomAmount(e.target.value)}
          placeholder="Custom amount (ml)"
        />
        <Button
          onClick={() => {
            const value = Number(customAmount);
            if (value > 0) {
              handleAdd(value);
              setCustomAmount("");
            }
          }}
          disabled={!customAmount}
          className="shrink-0 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <p className="mb-1.5 mt-6 px-1 text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground/80">
        Today&apos;s Entries
      </p>
      {logs.length === 0 ? (
        <p className="px-1 text-sm text-muted-foreground">No water logged yet today.</p>
      ) : (
        <div className="divide-y divide-border/50 rounded-2xl bg-app-surface px-3">
          {logs.map((l) => (
            <div key={l.id} className="flex items-center gap-3 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                <Droplet className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-navy">{l.amount_ml} ml</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(l.logged_at).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => deleteHydrationLog(l.id).then(refresh)}
                aria-label="Delete entry"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </AppScreen>
  );
}

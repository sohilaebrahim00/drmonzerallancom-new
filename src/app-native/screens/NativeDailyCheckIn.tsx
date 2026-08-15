import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { AppScreen } from "@/app-native/components/AppScreen";
import { Button } from "@/components/ui/button";
import { hapticSuccess, hapticTap } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import {
  getTodaysCheckin,
  saveTodaysCheckin,
  type EnergyLevel,
  type HungerLevel,
  type MoodLevel,
} from "@/services/checkinService";

function SegmentRow<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-1.5 grid grid-cols-3 gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => {
              hapticTap();
              onChange(opt.value);
            }}
            className={cn(
              "cursor-pointer rounded-xl border py-2.5 text-center text-xs font-semibold transition-colors",
              value === opt.value
                ? "border-primary bg-secondary text-primary"
                : "border-border/60 bg-app-surface text-navy hover:border-primary/40",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function NativeDailyCheckIn() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [energy, setEnergy] = useState<EnergyLevel | null>(null);
  const [hunger, setHunger] = useState<HungerLevel | null>(null);
  const [mood, setMood] = useState<MoodLevel | null>(null);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getTodaysCheckin().then((existing) => {
      if (existing) {
        setEnergy(existing.energy);
        setHunger(existing.hunger);
        setMood(existing.mood);
        setNote(existing.note ?? "");
      }
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    const outcome = await saveTodaysCheckin({ energy, hunger, mood, note });
    setSaving(false);
    if (outcome.ok) {
      hapticSuccess();
      setSaved(true);
    }
  }

  if (loading) {
    return (
      <AppScreen
        title="Daily Check-In"
        back
        className="flex min-h-[50vh] items-center justify-center"
      >
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </AppScreen>
    );
  }

  if (saved) {
    return (
      <AppScreen
        title="Daily Check-In"
        back
        className="mx-auto w-full max-w-lg px-4 py-14 text-center"
      >
        <p className="font-display text-lg font-bold text-navy">Check-in saved</p>
        <p className="mt-1 text-sm text-muted-foreground">
          This is private to you — only your doctor can see it if you&apos;re connected.
        </p>
        <Button onClick={() => navigate("/", { replace: true })} className="mt-5 cursor-pointer">
          Back to Home
        </Button>
      </AppScreen>
    );
  }

  return (
    <AppScreen title="Daily Check-In" back className="mx-auto w-full max-w-lg px-4 pb-8 pt-3">
      <p className="text-sm text-muted-foreground">
        A quick, optional check-in. This is private and never used to diagnose anything.
      </p>

      <div className="mt-5 space-y-5">
        <SegmentRow
          label="Energy"
          value={energy}
          onChange={setEnergy}
          options={[
            { value: "low", label: "Low" },
            { value: "normal", label: "Normal" },
            { value: "good", label: "Good" },
          ]}
        />
        <SegmentRow
          label="Hunger"
          value={hunger}
          onChange={setHunger}
          options={[
            { value: "low", label: "Low" },
            { value: "normal", label: "Normal" },
            { value: "high", label: "High" },
          ]}
        />
        <SegmentRow
          label="Mood (optional)"
          value={mood}
          onChange={setMood}
          options={[
            { value: "low", label: "Low" },
            { value: "neutral", label: "Neutral" },
            { value: "good", label: "Good" },
          ]}
        />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Note (optional)
          </p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Anything you'd like to note about today..."
            className="mt-1.5 w-full rounded-lg border border-border bg-background p-3 text-sm text-navy outline-none"
          />
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={saving || (!energy && !hunger && !mood && !note.trim())}
        className="mt-6 w-full cursor-pointer"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Check-In"}
      </Button>
    </AppScreen>
  );
}

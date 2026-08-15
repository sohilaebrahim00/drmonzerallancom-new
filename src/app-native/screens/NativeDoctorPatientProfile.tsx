import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { AppScreen } from "@/app-native/components/AppScreen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPublicProfile, type PublicProfileSummary } from "@/services/profileService";
import {
  getPatientBodyProfile,
  getPatientCurrentTarget,
  setDoctorOverrideTarget,
  type BodyProfile,
  type DailyTarget,
} from "@/services/bodyProfileService";
import { getPatientMealsInRange, type MealLog } from "@/services/mealLogService";
import {
  getPatientProgram,
  createBlankProgram,
  type NutritionProgram,
} from "@/services/programService";
import { getPatientCheckinsInRange, type DailyCheckin } from "@/services/checkinService";
import { supabase } from "@/lib/supabase";

export default function NativeDoctorPatientProfile() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<PublicProfileSummary | null>(null);
  const [bodyProfile, setBodyProfile] = useState<BodyProfile | null>(null);
  const [target, setTarget] = useState<DailyTarget | null>(null);
  const [meals7d, setMeals7d] = useState<MealLog[]>([]);
  const [program, setProgram] = useState<NutritionProgram | null>(null);
  const [checkins, setCheckins] = useState<DailyCheckin[]>([]);
  const [waterToday, setWaterToday] = useState<number | null>(null);
  const [overrideTarget, setOverrideTarget] = useState("");
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    if (!patientId) return;
    const since = new Date();
    since.setDate(since.getDate() - 7);
    Promise.all([
      getPublicProfile(patientId),
      getPatientBodyProfile(patientId),
      getPatientCurrentTarget(patientId),
      getPatientMealsInRange(patientId, since, new Date()),
      getPatientProgram(patientId),
      getPatientCheckinsInRange(patientId, since, new Date()),
      supabase
        ? supabase
            .from("hydration_logs")
            .select("amount_ml")
            .eq("user_id", patientId)
            .gte("logged_at", new Date().toISOString().slice(0, 10))
        : Promise.resolve({ data: null }),
    ]).then(([p, bp, t, meals, prog, checkinRows, water]) => {
      setProfile(p);
      setBodyProfile(bp);
      setTarget(t);
      setMeals7d(meals);
      setProgram(prog);
      setCheckins(checkinRows);
      setWaterToday(water.data ? water.data.reduce((sum, w) => sum + w.amount_ml, 0) : null);
      setLoading(false);
    });
  }, [patientId]);

  async function handleSetTarget() {
    if (!patientId || !overrideTarget) return;
    await setDoctorOverrideTarget(patientId, Number(overrideTarget));
    const updated = await getPatientCurrentTarget(patientId);
    setTarget(updated);
    setOverrideTarget("");
  }

  async function handleSaveNote() {
    if (!patientId || !note.trim() || !supabase) return;
    setSavingNote(true);
    const { data: userData } = await supabase.auth.getUser();
    await supabase
      .from("doctor_notes")
      .insert({ doctor_id: userData.user?.id, patient_id: patientId, note: note.trim() });
    setSavingNote(false);
    setNote("");
  }

  async function handleAssignProgram() {
    if (!patientId) return;
    const result = await createBlankProgram(patientId, new Date());
    if (result.ok) navigate(`/doctor/programs/${result.programId}/build`);
  }

  if (loading) {
    return (
      <AppScreen title="Patient" back className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </AppScreen>
    );
  }

  const weekCalories = meals7d.reduce((s, m) => s + m.total_calories, 0);

  return (
    <AppScreen
      title={profile?.full_name ?? "Patient"}
      back
      className="mx-auto w-full max-w-lg px-4 pb-8 pt-3"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-primary">
          {(profile?.full_name ?? "?").charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-bold text-navy">
            {profile?.full_name ?? "Patient"}
          </p>
          <p className="truncate text-xs text-muted-foreground">@{profile?.username}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <div className="rounded-xl border border-border/70 bg-card p-3.5 shadow-sm">
          <p className="text-[0.65rem] text-muted-foreground">Height / Weight</p>
          <p className="mt-1 font-display text-sm font-bold text-navy">
            {bodyProfile?.height_cm ?? "—"} cm / {bodyProfile?.weight_kg ?? "—"} kg
          </p>
        </div>
        <div className="rounded-xl border border-border/70 bg-card p-3.5 shadow-sm">
          <p className="text-[0.65rem] text-muted-foreground">Goal</p>
          <p className="mt-1 font-display text-sm font-bold capitalize text-navy">
            {bodyProfile?.goal?.replace("_", " ") ?? "—"}
          </p>
        </div>
        <div className="rounded-xl border border-border/70 bg-card p-3.5 shadow-sm">
          <p className="text-[0.65rem] text-muted-foreground">Daily Target</p>
          <p className="mt-1 font-display text-sm font-bold text-navy">
            {target ? `${Math.round(target.daily_target)} kcal` : "Not set"}
          </p>
        </div>
        <div className="rounded-xl border border-border/70 bg-card p-3.5 shadow-sm">
          <p className="text-[0.65rem] text-muted-foreground">7-Day Calories</p>
          <p className="mt-1 font-display text-sm font-bold text-navy">
            {Math.round(weekCalories)}
          </p>
        </div>
        <div className="rounded-xl border border-border/70 bg-card p-3.5 shadow-sm">
          <p className="text-[0.65rem] text-muted-foreground">Water Today</p>
          <p className="mt-1 font-display text-sm font-bold text-navy">
            {waterToday != null ? `${(waterToday / 1000).toFixed(1)} L` : "—"}
          </p>
        </div>
      </div>

      {checkins.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Daily Check-Ins (7 Days)
          </p>
          <div className="mt-2 space-y-2">
            {checkins.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-border/70 bg-card p-3 text-xs shadow-sm"
              >
                <p className="font-semibold text-navy">
                  {new Date(c.checkin_date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <p className="mt-0.5 text-muted-foreground">
                  {[
                    c.energy && `Energy: ${c.energy}`,
                    c.hunger && `Hunger: ${c.hunger}`,
                    c.mood && `Mood: ${c.mood}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {c.note && <p className="mt-1 text-navy/80">&ldquo;{c.note}&rdquo;</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {bodyProfile &&
        (bodyProfile.food_allergies.length > 0 || bodyProfile.health_conditions.length > 0) && (
          <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
            {bodyProfile.food_allergies.length > 0 && (
              <p>Allergies: {bodyProfile.food_allergies.join(", ")}</p>
            )}
            {bodyProfile.health_conditions.length > 0 && (
              <p>Conditions: {bodyProfile.health_conditions.join(", ")}</p>
            )}
          </div>
        )}

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Set Daily Target
        </p>
        <div className="mt-1.5 flex gap-2">
          <Input
            type="number"
            value={overrideTarget}
            onChange={(e) => setOverrideTarget(e.target.value)}
            placeholder="e.g. 1800"
          />
          <Button
            onClick={handleSetTarget}
            disabled={!overrideTarget}
            className="shrink-0 cursor-pointer"
          >
            Set
          </Button>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Program
        </p>
        {program ? (
          <Link
            to={`/doctor/programs/${program.id}/build`}
            className="mt-2 block rounded-xl border border-border/70 bg-card p-3.5 text-sm font-semibold text-primary shadow-sm"
          >
            {program.title} — {program.status}
          </Link>
        ) : (
          <Button onClick={handleAssignProgram} className="mt-2 w-full cursor-pointer">
            Assign 30-Day Program
          </Button>
        )}
      </div>

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Add Note
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Private note — never visible to friends or the patient's social feed."
          className="mt-1.5 w-full rounded-lg border border-border bg-background p-3 text-sm text-navy outline-none"
        />
        <Button
          onClick={handleSaveNote}
          disabled={!note.trim() || savingNote}
          className="mt-2 w-full cursor-pointer"
        >
          {savingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Note"}
        </Button>
      </div>
    </AppScreen>
  );
}

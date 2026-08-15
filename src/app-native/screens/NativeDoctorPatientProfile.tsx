import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  CalendarCheck,
  CircleNotch,
  Drop,
  Fire,
  Footprints,
  NotePencil,
  Scales,
  Target,
} from "@phosphor-icons/react";

import { AppScreen } from "@/app-native/components/AppScreen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
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
  currentProgramDayNumber,
  getPatientProgram,
  createBlankProgram,
  getProgramDay,
  type NutritionProgram,
  type ProgramDay,
} from "@/services/programService";
import { getPatientCheckinsInRange, type DailyCheckin } from "@/services/checkinService";
import { supabase } from "@/lib/supabase";
import { getDemoMode } from "@/dev/demoMode";
import { DEMO_PATIENT_DETAIL } from "@/dev/demoFixtures";

type Tab = "today" | "program" | "progress" | "30days" | "notes";

const TABS: { value: Tab; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "program", label: "Program" },
  { value: "progress", label: "Progress" },
  { value: "30days", label: "30 Days" },
  { value: "notes", label: "Notes" },
];

interface DoctorNoteRow {
  id: string;
  note: string;
  created_at: string;
}

export default function NativeDoctorPatientProfile() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("today");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<PublicProfileSummary | null>(null);
  const [bodyProfile, setBodyProfile] = useState<BodyProfile | null>(null);
  const [target, setTarget] = useState<DailyTarget | null>(null);
  const [mealsToday, setMealsToday] = useState<MealLog[]>([]);
  const [meals7d, setMeals7d] = useState<MealLog[]>([]);
  const [meals30d, setMeals30d] = useState<MealLog[]>([]);
  const [program, setProgram] = useState<NutritionProgram | null>(null);
  const [programDay, setProgramDay] = useState<ProgramDay | null>(null);
  const [checkins, setCheckins] = useState<DailyCheckin[]>([]);
  const [waterToday, setWaterToday] = useState<number | null>(null);
  const [stepsToday, setStepsToday] = useState<number | null>(null);
  const [notes, setNotes] = useState<DoctorNoteRow[]>([]);
  const [overrideTarget, setOverrideTarget] = useState("");
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    if (!patientId) return;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const since7 = new Date();
    since7.setDate(since7.getDate() - 7);
    const since30 = new Date();
    since30.setDate(since30.getDate() - 30);

    async function fetchWaterTodayMl(): Promise<number | null> {
      if (getDemoMode()) return DEMO_PATIENT_DETAIL[patientId!]?.waterTodayMl ?? null;
      if (!supabase) return null;
      const { data } = await supabase
        .from("hydration_logs")
        .select("amount_ml")
        .eq("user_id", patientId)
        .gte("logged_at", todayStart.toISOString());
      return data ? data.reduce((sum, w) => sum + w.amount_ml, 0) : null;
    }

    async function fetchStepsToday(): Promise<number | null> {
      if (getDemoMode()) return null;
      if (!supabase) return null;
      const { data } = await supabase
        .from("step_logs")
        .select("steps")
        .eq("user_id", patientId)
        .eq("date", todayStart.toISOString().slice(0, 10))
        .maybeSingle();
      return data?.steps ?? null;
    }

    async function fetchNotes(): Promise<DoctorNoteRow[]> {
      if (getDemoMode()) return [];
      if (!supabase) return [];
      const { data } = await supabase
        .from("doctor_notes")
        .select("id, note, created_at")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });
      return data ?? [];
    }

    Promise.all([
      getPublicProfile(patientId),
      getPatientBodyProfile(patientId),
      getPatientCurrentTarget(patientId),
      getPatientMealsInRange(patientId, todayStart, new Date()),
      getPatientMealsInRange(patientId, since7, new Date()),
      getPatientMealsInRange(patientId, since30, new Date()),
      getPatientProgram(patientId),
      getPatientCheckinsInRange(patientId, since7, new Date()),
      fetchWaterTodayMl(),
      fetchStepsToday(),
      fetchNotes(),
    ]).then(([p, bp, t, todayMeals, m7, m30, prog, checkinRows, water, steps, notesResult]) => {
      setProfile(p);
      setBodyProfile(bp);
      setTarget(t);
      setMealsToday(todayMeals);
      setMeals7d(m7);
      setMeals30d(m30);
      setProgram(prog);
      setCheckins(checkinRows);
      setWaterToday(water);
      setStepsToday(steps);
      setNotes(notesResult);
      setLoading(false);

      if (prog) {
        getProgramDay(prog.id, currentProgramDayNumber(prog), patientId).then(setProgramDay);
      }
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
    if (!patientId || !note.trim()) return;
    setSavingNote(true);
    if (getDemoMode()) {
      // DEV-ONLY demo preview — never writes a real doctor note.
      setSavingNote(false);
      setNote("");
      return;
    }
    if (!supabase) {
      setSavingNote(false);
      return;
    }
    const { data: userData } = await supabase.auth.getUser();
    const { data } = await supabase
      .from("doctor_notes")
      .insert({ doctor_id: userData.user?.id, patient_id: patientId, note: note.trim() })
      .select("id, note, created_at")
      .single();
    if (data) setNotes((prev) => [data, ...prev]);
    setSavingNote(false);
    setNote("");
  }

  async function handleAssignProgram() {
    if (!patientId) return;
    const result = await createBlankProgram(patientId, new Date());
    if (result.ok) navigate(`/doctor/programs/${result.programId}/build`);
  }

  const todayCalories = mealsToday.reduce((s, m) => s + m.total_calories, 0);
  const weekCalories = meals7d.reduce((s, m) => s + m.total_calories, 0);
  const weekAvgCalories = meals7d.length > 0 ? weekCalories / 7 : 0;
  const dayNumber = program ? currentProgramDayNumber(program) : null;

  const dayRows = useMemo(() => {
    const byDate = new Map<string, { calories: number; meals: number }>();
    for (const m of meals30d) {
      const key = new Date(m.meal_time).toISOString().slice(0, 10);
      const row = byDate.get(key) ?? { calories: 0, meals: 0 };
      row.calories += m.total_calories;
      row.meals += 1;
      byDate.set(key, row);
    }
    const out: { date: string; calories: number; meals: number }[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const row = byDate.get(key);
      out.push({ date: key, calories: row?.calories ?? 0, meals: row?.meals ?? 0 });
    }
    return out;
  }, [meals30d]);

  if (loading) {
    return (
      <AppScreen title="Patient" back className="flex min-h-[50vh] items-center justify-center">
        <CircleNotch className="h-7 w-7 animate-spin text-primary" />
      </AppScreen>
    );
  }

  return (
    <AppScreen
      title={profile?.full_name ?? "Patient"}
      back
      className="mx-auto w-full max-w-lg px-4 pb-8 pt-3"
    >
      {/* Profile summary header (§50) */}
      <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary text-base font-bold text-primary">
            {(profile?.full_name ?? "?").charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-base font-bold text-navy">
              {profile?.full_name ?? "Patient"}
            </p>
            <p className="truncate text-xs text-muted-foreground">@{profile?.username}</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border/60 pt-3 text-center">
          <div>
            <p className="text-xs font-bold text-navy">
              {dayNumber ? `Day ${dayNumber}/30` : "No Program"}
            </p>
            <p className="text-[0.6rem] text-muted-foreground">Program</p>
          </div>
          <div>
            <p className="truncate text-xs font-bold capitalize text-navy">
              {bodyProfile?.goal?.replace("_", " ") ?? "—"}
            </p>
            <p className="text-[0.6rem] text-muted-foreground">Goal</p>
          </div>
          <div>
            <p className="text-xs font-bold text-navy">
              {target ? `${Math.round(target.daily_target)} kcal` : "Not set"}
            </p>
            <p className="text-[0.6rem] text-muted-foreground">Daily Target</p>
          </div>
        </div>
      </div>

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

      {/* Tabs (§51) — avoid stacking everything on one huge page */}
      <div className="mt-4 flex gap-1 overflow-x-auto rounded-full bg-app-surface-secondary p-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={cn(
              "shrink-0 cursor-pointer rounded-full px-3.5 py-2 text-xs font-semibold transition-colors",
              tab === t.value ? "bg-white text-primary shadow-sm" : "text-muted-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "today" && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-2.5">
            <StatTile
              icon={Fire}
              value={`${Math.round(todayCalories)}${target ? `/${Math.round(target.daily_target)}` : ""}`}
              label="Calories"
            />
            <StatTile
              icon={Footprints}
              value={stepsToday != null ? stepsToday.toLocaleString() : "—"}
              label="Steps"
            />
            <StatTile
              icon={Drop}
              label="Water"
              value={waterToday != null ? `${(waterToday / 1000).toFixed(1)} L` : "—"}
            />
            <StatTile icon={CalendarCheck} value={String(mealsToday.length)} label="Meals Logged" />
          </div>

          {mealsToday.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Meals Today
              </p>
              <div className="mt-1.5 divide-y divide-border/50 rounded-xl border border-border/70 bg-card px-3">
                {mealsToday.map((m) => (
                  <div key={m.id} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="capitalize text-navy">{m.meal_type ?? "Meal"}</span>
                    <span className="font-semibold text-navy">
                      {Math.round(m.total_calories)} kcal
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(() => {
            const todaysCheckin = checkins.find(
              (c) => c.checkin_date === new Date().toISOString().slice(0, 10),
            );
            if (!todaysCheckin) return null;
            return (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Daily Check-In
                </p>
                <div className="mt-1.5 rounded-xl border border-border/70 bg-card p-3 text-xs shadow-sm">
                  <p className="text-navy">
                    {[
                      todaysCheckin.energy && `Energy: ${todaysCheckin.energy}`,
                      todaysCheckin.hunger && `Hunger: ${todaysCheckin.hunger}`,
                      todaysCheckin.mood && `Mood: ${todaysCheckin.mood}`,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "Checked in — no details provided."}
                  </p>
                  {todaysCheckin.note && (
                    <p className="mt-1 text-navy/80">&ldquo;{todaysCheckin.note}&rdquo;</p>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {tab === "program" && (
        <div className="mt-4 space-y-4">
          <div className="mt-1">
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

          {program ? (
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Day {dayNumber} of 30 — {program.status}
                </p>
                <Link
                  to={`/doctor/programs/${program.id}/build`}
                  className="text-xs font-semibold text-primary"
                >
                  Edit Program
                </Link>
              </div>
              {programDay?.doctor_instructions && (
                <p className="mt-1.5 rounded-xl bg-secondary/40 p-3 text-xs text-navy/80">
                  {programDay.doctor_instructions}
                </p>
              )}
              <div className="mt-2 space-y-2">
                {(programDay?.items ?? []).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-border/70 bg-card p-3 text-xs shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold capitalize text-primary">
                        {item.meal_type}
                      </span>
                      {item.completion && (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase",
                            item.completion === "completed"
                              ? "bg-app-success/10 text-app-success"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {item.completion}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 font-semibold text-navy">{item.title}</p>
                  </div>
                ))}
                {programDay && programDay.items.length === 0 && (
                  <p className="py-3 text-center text-xs text-muted-foreground">
                    No meals planned for this day yet.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <Button onClick={handleAssignProgram} className="w-full cursor-pointer">
              Assign 30-Day Program
            </Button>
          )}
        </div>
      )}

      {tab === "progress" && (
        <div className="mt-4 space-y-2.5">
          <p className="px-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Last 7 Days
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <StatTile
              icon={Fire}
              value={Math.round(weekCalories).toLocaleString()}
              label="Total Calories"
            />
            <StatTile
              icon={Target}
              value={Math.round(weekAvgCalories).toLocaleString()}
              label="Avg / Day"
            />
            <StatTile icon={CalendarCheck} value={String(meals7d.length)} label="Meals Logged" />
            <StatTile
              icon={Scales}
              value={bodyProfile?.weight_kg ? `${bodyProfile.weight_kg} kg` : "—"}
              label="Latest Weight"
            />
          </div>
        </div>
      )}

      {tab === "30days" && (
        <div className="mt-4">
          <p className="mb-1.5 px-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            30-Day History
          </p>
          <div className="divide-y divide-border/50 rounded-2xl border border-border/70 bg-card px-3">
            {dayRows.map((row) => (
              <div key={row.date} className="flex items-center justify-between py-2 text-xs">
                <span className="text-navy">
                  {new Date(row.date).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span
                  className={cn(
                    "font-semibold",
                    row.meals > 0 ? "text-navy" : "text-muted-foreground",
                  )}
                >
                  {row.meals > 0
                    ? `${Math.round(row.calories)} kcal · ${row.meals} meals`
                    : "No logs"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "notes" && (
        <div className="mt-4 space-y-4">
          <div>
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
              {savingNote ? (
                <CircleNotch className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <NotePencil className="h-4 w-4" /> Save Note
                </>
              )}
            </Button>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Previous Notes
            </p>
            {notes.length === 0 ? (
              <p className="mt-1.5 text-xs text-muted-foreground">No notes yet for this patient.</p>
            ) : (
              <div className="mt-1.5 space-y-2">
                {notes.map((n) => (
                  <div
                    key={n.id}
                    className="rounded-xl border border-border/70 bg-card p-3 text-xs shadow-sm"
                  >
                    <p className="text-navy">{n.note}</p>
                    <p className="mt-1 text-[0.65rem] text-muted-foreground">
                      {new Date(n.created_at).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </AppScreen>
  );
}

function StatTile({
  icon: IconComponent,
  value,
  label,
}: {
  icon: typeof Fire;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-3.5 shadow-sm">
      <IconComponent className="h-4 w-4 text-primary" />
      <p className="mt-1.5 font-display text-sm font-bold text-navy">{value}</p>
      <p className="text-[0.65rem] text-muted-foreground">{label}</p>
    </div>
  );
}

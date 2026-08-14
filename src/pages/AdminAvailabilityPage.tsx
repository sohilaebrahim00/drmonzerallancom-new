import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Video } from "lucide-react";

import { Seo } from "@/components/seo/Seo";
import { Reveal } from "@/components/common/Reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  listAdminAppointments,
  listAvailabilityExceptions,
  listDoctorAvailability,
  createAvailabilityException,
  deleteAvailabilityException,
  updateDoctorAvailability,
  type AdminAppointment,
  type AvailabilityException,
  type DoctorAvailabilityRow,
} from "@/services/adminAvailabilityService";
import { cn } from "@/lib/utils";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const EXCEPTION_TYPES = [
  "unavailable",
  "custom_hours",
  "holiday",
  "vacation",
  "personal_block",
  "extra_day",
];

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

export default function AdminAvailabilityPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<DoctorAvailabilityRow[]>([]);
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [range, setRange] = useState<"today" | "week" | "upcoming">("upcoming");
  const [savingId, setSavingId] = useState<string | null>(null);

  const [newException, setNewException] = useState({
    date: "",
    type: "unavailable",
    isAvailable: false,
    startTime: "",
    endTime: "",
    reason: "",
  });
  const [addingException, setAddingException] = useState(false);

  async function loadAll() {
    setLoading(true);
    const [availRes, excRes, apptRes] = await Promise.all([
      listDoctorAvailability(),
      listAvailabilityExceptions(),
      listAdminAppointments(range),
    ]);
    if (availRes.ok) setAvailability(availRes.data.availability);
    else setError(availRes.error);
    if (excRes.ok) setExceptions(excRes.data.exceptions);
    if (apptRes.ok) setAppointments(apptRes.data.appointments);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  async function handleAvailabilityChange(
    row: DoctorAvailabilityRow,
    patch: Partial<DoctorAvailabilityRow>,
  ) {
    setSavingId(row.id);
    const res = await updateDoctorAvailability({
      id: row.id,
      isActive: patch.is_active,
      startTime: patch.start_time,
      endTime: patch.end_time,
      slotDurationMinutes: patch.slot_duration_minutes,
    });
    setSavingId(null);
    if (res.ok) {
      setAvailability((prev) => prev.map((r) => (r.id === row.id ? res.data.availability : r)));
    }
  }

  async function handleAddException(e: React.FormEvent) {
    e.preventDefault();
    if (!newException.date) return;
    setAddingException(true);
    const res = await createAvailabilityException(newException);
    setAddingException(false);
    if (res.ok) {
      setExceptions((prev) =>
        [...prev, res.data.exception].sort((a, b) => a.date.localeCompare(b.date)),
      );
      setNewException({
        date: "",
        type: "unavailable",
        isAvailable: false,
        startTime: "",
        endTime: "",
        reason: "",
      });
    }
  }

  async function handleDeleteException(id: string) {
    const res = await deleteAvailabilityException(id);
    if (res.ok) setExceptions((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-16 sm:px-10 sm:py-20">
      <Seo
        title="Availability — Admin"
        description="Manage doctor availability."
        path="/admin/availability"
        noindex
      />

      <Reveal direction="up">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Admin</p>
        <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
          Consultation Availability
        </h1>
      </Reveal>

      {loading ? (
        <div className="mt-10 flex items-center justify-center py-16" role="status">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      ) : error ? (
        <Alert className="mt-6 border-amber-300 bg-amber-50 text-amber-900">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <div className="mt-8 space-y-10">
          {/* Recurring schedule */}
          <section>
            <h2 className="font-display text-lg font-bold text-navy">Recurring Weekly Schedule</h2>
            <div className="mt-4 space-y-3">
              {availability.map((row) => (
                <div
                  key={row.id}
                  className="flex flex-wrap items-center gap-4 rounded-xl border border-border/70 bg-card p-4"
                >
                  <label className="flex w-32 shrink-0 cursor-pointer items-center gap-2 text-sm font-semibold text-navy">
                    <input
                      type="checkbox"
                      checked={row.is_active}
                      onChange={(e) =>
                        handleAvailabilityChange(row, { is_active: e.target.checked })
                      }
                      className="h-4 w-4 cursor-pointer rounded border-border text-primary"
                    />
                    {DAY_NAMES[row.day_of_week]}
                  </label>
                  <div className="flex items-center gap-2 text-sm">
                    <Input
                      type="time"
                      defaultValue={row.start_time.slice(0, 5)}
                      onBlur={(e) => handleAvailabilityChange(row, { start_time: e.target.value })}
                      className="w-28"
                    />
                    <span className="text-muted-foreground">to</span>
                    <Input
                      type="time"
                      defaultValue={row.end_time.slice(0, 5)}
                      onBlur={(e) => handleAvailabilityChange(row, { end_time: e.target.value })}
                      className="w-28"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Slot</span>
                    <Input
                      type="number"
                      min={5}
                      defaultValue={row.slot_duration_minutes}
                      onBlur={(e) =>
                        handleAvailabilityChange(row, {
                          slot_duration_minutes: Number(e.target.value),
                        })
                      }
                      className="w-20"
                    />
                    <span className="text-muted-foreground">min</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{row.timezone}</span>
                  {savingId === row.id && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  )}
                </div>
              ))}
              {availability.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No recurring schedule configured yet.
                </p>
              )}
            </div>
          </section>

          {/* Exceptions */}
          <section>
            <h2 className="font-display text-lg font-bold text-navy">Availability Exceptions</h2>
            <form
              onSubmit={handleAddException}
              className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-border/70 bg-card p-4"
            >
              <div>
                <label className="block text-xs font-semibold text-muted-foreground">Date</label>
                <Input
                  type="date"
                  required
                  value={newException.date}
                  onChange={(e) => setNewException((p) => ({ ...p, date: e.target.value }))}
                  className="mt-1 w-40"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground">Type</label>
                <select
                  value={newException.type}
                  onChange={(e) => setNewException((p) => ({ ...p, type: e.target.value }))}
                  className="mt-1 h-9 w-40 rounded-md border border-border bg-background px-2 text-sm"
                >
                  {EXCEPTION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-navy">
                <input
                  type="checkbox"
                  checked={newException.isAvailable}
                  onChange={(e) =>
                    setNewException((p) => ({ ...p, isAvailable: e.target.checked }))
                  }
                  className="h-4 w-4 cursor-pointer rounded border-border text-primary"
                />
                Available (custom hours / extra day)
              </label>
              {newException.isAvailable && (
                <>
                  <Input
                    type="time"
                    placeholder="Start"
                    value={newException.startTime}
                    onChange={(e) => setNewException((p) => ({ ...p, startTime: e.target.value }))}
                    className="w-28"
                  />
                  <Input
                    type="time"
                    placeholder="End"
                    value={newException.endTime}
                    onChange={(e) => setNewException((p) => ({ ...p, endTime: e.target.value }))}
                    className="w-28"
                  />
                </>
              )}
              <Input
                placeholder="Reason (optional)"
                value={newException.reason}
                onChange={(e) => setNewException((p) => ({ ...p, reason: e.target.value }))}
                className="w-48"
              />
              <Button type="submit" disabled={addingException} size="sm" className="cursor-pointer">
                {addingException ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Add
              </Button>
            </form>

            <div className="mt-4 space-y-2">
              {exceptions.map((ex) => (
                <div
                  key={ex.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/60 p-3 text-sm"
                >
                  <div>
                    <span className="font-semibold text-navy">{ex.date}</span>{" "}
                    <span className="text-muted-foreground">
                      · {ex.type.replace("_", " ")} ·{" "}
                      {ex.is_available
                        ? `Available ${ex.start_time ?? ""}–${ex.end_time ?? ""}`
                        : "Blocked"}
                      {ex.reason ? ` · ${ex.reason}` : ""}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteException(ex.id)}
                    aria-label="Delete exception"
                    className="cursor-pointer text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {exceptions.length === 0 && (
                <p className="text-sm text-muted-foreground">No upcoming exceptions.</p>
              )}
            </div>
          </section>

          {/* Appointments */}
          <section>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-lg font-bold text-navy">Appointments</h2>
              <div className="flex gap-2">
                {(["today", "week", "upcoming"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRange(r)}
                    className={cn(
                      "cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition-colors",
                      range === r
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-navy/70 hover:border-turquoise",
                    )}
                  >
                    {r === "week" ? "This Week" : r}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {appointments.map((a) => (
                <div key={a.id} className="rounded-xl border border-border/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-navy">{a.clientName}</p>
                    <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold capitalize text-primary">
                      {a.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {a.clientEmail ?? "—"} · {a.packageName ?? "—"}
                  </p>
                  <p className="mt-1 text-sm text-navy">
                    {formatDateTime(a.appointmentStart)} (Dubai)
                  </p>
                  {a.meetUrl && (
                    <a
                      href={a.meetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-turquoise"
                    >
                      <Video className="h-3.5 w-3.5" /> Join Google Meet
                    </a>
                  )}
                </div>
              ))}
              {appointments.length === 0 && (
                <p className="text-sm text-muted-foreground">No appointments in this range.</p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

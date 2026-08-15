import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  CalendarCheck,
  CaretRight,
  ClipboardText,
  Clock,
  CircleNotch,
  ForkKnife,
  MagnifyingGlass,
  PersonSimpleWalk,
  Scales,
  Stethoscope,
  UsersThree,
  WarningCircle,
} from "@phosphor-icons/react";

import { AppScreen } from "@/app-native/components/AppScreen";
import { EmptyState } from "@/app-native/components/EmptyState";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useAppBoot } from "@/context/AppBootContext";
import { business } from "@/data/business";
import {
  getMyPatients,
  getMyPatientOverviews,
  getPatientsNeedingReview,
  getRecentPatientActivity,
  getActiveProgramsSummary,
  respondDoctorConnection,
  type PatientNeedsReview,
  type PatientOverview,
  type PatientActivityEvent,
  type DoctorActivityKind,
} from "@/services/doctorService";
import { getMyConsultationRequests, type ConsultationRequest } from "@/services/membershipService";
import { cn } from "@/lib/utils";

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

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

type PatientFilter = "all" | "needs_review" | "active_program" | "no_program";

const STATUS_LABEL: Record<PatientOverview["status"], string> = {
  active: "Active",
  needs_review: "Needs Review",
  no_recent_logs: "No Recent Logs",
  program_pending: "Program Pending",
};

const STATUS_TONE: Record<PatientOverview["status"], string> = {
  active: "bg-app-success/10 text-app-success",
  needs_review: "bg-app-warning/10 text-app-warning",
  no_recent_logs: "bg-muted text-muted-foreground",
  program_pending: "bg-secondary text-primary",
};

const ACTIVITY_ICON: Record<DoctorActivityKind, typeof ForkKnife> = {
  meal: ForkKnife,
  weight: Scales,
  movement: PersonSimpleWalk,
  checkin: ClipboardText,
  program: ClipboardText,
};

export default function NativeDoctorDashboard() {
  const { user } = useAuth();
  const { profile } = useAppBoot();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<Awaited<ReturnType<typeof getMyPatients>>>([]);
  const [overviews, setOverviews] = useState<PatientOverview[]>([]);
  const [consultations, setConsultations] = useState<ConsultationRequest[]>([]);
  const [needsReview, setNeedsReview] = useState<PatientNeedsReview[]>([]);
  const [recentActivity, setRecentActivity] = useState<PatientActivityEvent[]>([]);
  const [programsSummary, setProgramsSummary] = useState({ active: 0, draft: 0 });
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<PatientFilter>("all");

  function refresh() {
    setLoading(true);
    Promise.all([
      getMyPatients(),
      getMyPatientOverviews(),
      getMyConsultationRequests(),
      getPatientsNeedingReview(),
      getRecentPatientActivity(8),
      getActiveProgramsSummary(),
    ]).then(([p, ov, c, review, activity, programs]) => {
      setPatients(p);
      setOverviews(ov);
      setConsultations(c);
      setNeedsReview(review);
      setRecentActivity(activity);
      setProgramsSummary(programs);
      setLoading(false);
    });
  }

  useEffect(refresh, []);

  const pendingPatients = patients.filter((p) => p.status === "pending");
  const todaysConsultations = consultations.filter(
    (c) => (c.status === "confirmed" || c.status === "pending") && isToday(c.appointment_start),
  );

  const filteredOverviews = useMemo(() => {
    const q = query.trim().toLowerCase();
    return overviews.filter((o) => {
      if (q) {
        const matches =
          (o.full_name ?? "").toLowerCase().includes(q) ||
          (o.username ?? "").toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (filter === "needs_review") return o.status === "needs_review";
      if (filter === "active_program") return o.programDay != null;
      if (filter === "no_program") return o.programDay == null;
      return true;
    });
  }, [overviews, query, filter]);

  if (loading) {
    return (
      <AppScreen
        title="Doctor Dashboard"
        tabBar
        className="flex min-h-[50vh] items-center justify-center"
      >
        <CircleNotch className="h-7 w-7 animate-spin text-primary" />
      </AppScreen>
    );
  }

  const doctorFirstName = (profile?.full_name ?? business.doctorName)
    .split(" ")
    .slice(0, 2)
    .join(" ");

  return (
    <AppScreen tabBar hideHeader className="mx-auto w-full px-4 pb-6 pt-3">
      <div className="native-safe-top flex items-center justify-between gap-3 pb-4 pt-2">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
            <Stethoscope className="h-5 w-5" weight="duotone" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-extrabold tracking-tight text-navy">
              {greeting()}, {doctorFirstName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              Patient Overview · {formatToday()}
            </p>
          </div>
        </div>
        <Link
          to="/notifications"
          aria-label="Notifications"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-navy transition-colors hover:bg-secondary"
        >
          <Bell className="h-[1.35rem] w-[1.35rem]" />
        </Link>
      </div>

      {/* Four command-center metrics (§36) — never identical-looking to the user's quick-action tiles. */}
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <MetricTile
          icon={UsersThree}
          value={patients.filter((p) => p.status === "active").length}
          label="Patients"
        />
        <MetricTile
          icon={WarningCircle}
          value={needsReview.length}
          label="Needs Review"
          tone={needsReview.length > 0 ? "warning" : "default"}
        />
        <MetricTile
          icon={CalendarCheck}
          value={todaysConsultations.length}
          label="Today's Consults"
        />
        <MetricTile
          icon={ClipboardText}
          value={programsSummary.active}
          label="Active Programs"
          status={programsSummary.draft > 0 ? `${programsSummary.draft} draft` : undefined}
        />
      </div>

      {pendingPatients.length > 0 && (
        <div className="order-1 mt-5">
          <p className="mb-1.5 px-1 text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground/80">
            Pending Connection Requests
          </p>
          <div className="divide-y divide-border/50 rounded-2xl bg-app-surface px-3">
            {pendingPatients.map((p) => (
              <div key={p.relationshipId} className="flex items-center gap-3 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-primary">
                  {(p.full_name ?? "?").charAt(0).toUpperCase()}
                </span>
                <p className="min-w-0 flex-1 truncate text-sm font-semibold text-navy">
                  {p.full_name ?? "Patient"}
                </p>
                <button
                  type="button"
                  onClick={() => respondDoctorConnection(p.relationshipId, true).then(refresh)}
                  className="shrink-0 cursor-pointer rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                >
                  Accept
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/*
        Command-center grid (§38): Needs Review + Patient List form the LEFT
        (primary, ~65-70%) column; Recent Activity + Consultations +
        Programs form the RIGHT (~30-35%) utility column. Explicit `order`
        per breakpoint reconciles that desktop split with the required
        mobile stacking order (§69: Metrics → Needs Review → Recent Activity
        → Patients) — CSS Grid auto-placement fills row-major by `order`,
        so [NeedsReview(span2), RecentActivity(span1)] share row 1 and
        [PatientList(span2), Consultations+Programs(span1)] share row 2 on
        desktop, while mobile (single implicit column) just stacks by `order`.
      */}
      <div className="mt-5 grid gap-4 lg:grid-cols-3 lg:gap-6">
        <div className="order-1 lg:order-1 lg:col-span-2">
          {needsReview.length > 0 ? (
            <>
              <p className="mb-1.5 px-1 text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground/80">
                Needs Review
              </p>
              <div className="divide-y divide-border/50 rounded-2xl border border-app-warning/20 bg-app-surface px-3">
                {needsReview.map((r) => (
                  <div key={r.patientId} className="flex items-center gap-3 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-app-warning/10 text-app-warning">
                      <WarningCircle className="h-4.5 w-4.5" weight="fill" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-navy">
                        {r.full_name ?? "Patient"}
                      </p>
                      <p className="text-xs text-muted-foreground">No meals logged in 3+ days</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Link
                        to={`/doctor/patients/${r.patientId}`}
                        className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-navy"
                      >
                        Review
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyState icon={ClipboardText} title="Everyone is up to date." />
          )}
        </div>

        <div className="order-2 lg:order-3 lg:col-span-1 lg:row-start-1">
          <p className="mb-1.5 px-1 text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground/80">
            Recent Patient Activity
          </p>
          {recentActivity.length === 0 ? (
            <div className="rounded-2xl bg-app-surface-secondary px-4 py-6 text-center text-xs text-muted-foreground">
              No recent activity yet.
            </div>
          ) : (
            <div className="divide-y divide-border/50 rounded-2xl bg-app-surface px-3">
              {recentActivity.map((event) => {
                const EventIcon = ACTIVITY_ICON[event.kind];
                return (
                  <div key={event.id} className="flex items-center gap-2.5 py-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                      <EventIcon className="h-3.5 w-3.5" />
                    </span>
                    <p className="min-w-0 flex-1 truncate text-xs text-navy">
                      <span className="font-semibold">{event.patientName}</span>{" "}
                      <span className="text-muted-foreground">{event.summary}</span>
                    </p>
                    <span className="shrink-0 text-[0.6rem] text-muted-foreground">
                      {timeAgo(event.at)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="order-4 lg:order-2 lg:col-span-2">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-0.5">
            <p className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground/80">
              Patients
            </p>
            <div className="flex gap-1.5">
              {(["all", "needs_review", "active_program", "no_program"] as PatientFilter[]).map(
                (f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={cn(
                      "cursor-pointer rounded-full px-2.5 py-1 text-[0.65rem] font-semibold transition-colors",
                      filter === f
                        ? "bg-secondary text-primary"
                        : "text-muted-foreground hover:bg-app-surface-secondary",
                    )}
                  >
                    {f === "all"
                      ? "All"
                      : f === "needs_review"
                        ? "Needs Review"
                        : f === "active_program"
                          ? "Active Program"
                          : "No Program"}
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="relative mb-2.5">
            <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search patients by name or username"
              className="pl-9"
            />
          </div>

          {overviews.length === 0 ? (
            <EmptyState
              icon={UsersThree}
              title="No connected patients yet"
              body="Accepted patient connections will appear here."
            />
          ) : filteredOverviews.length === 0 ? (
            <p className="px-1 py-6 text-center text-sm text-muted-foreground">
              No patients match this search or filter.
            </p>
          ) : (
            <div className="divide-y divide-border/50 rounded-2xl bg-app-surface px-3">
              {filteredOverviews.map((o) => (
                <PatientRow key={o.patientId} overview={o} />
              ))}
            </div>
          )}
        </div>

        <div className="order-3 lg:order-4 lg:col-span-1 space-y-4">
          <div>
            <p className="mb-1.5 px-1 text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground/80">
              Today&apos;s Consultations
            </p>
            {todaysConsultations.length === 0 ? (
              <div className="rounded-2xl bg-app-surface-secondary px-4 py-6 text-center text-xs text-muted-foreground">
                No consultations scheduled today.
              </div>
            ) : (
              <div className="space-y-2">
                {todaysConsultations.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 rounded-2xl border border-border/60 bg-app-surface p-3"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                      <Clock className="h-4.5 w-4.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-navy">
                        {new Date(c.appointment_start).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="truncate text-[0.65rem] text-muted-foreground">
                        {c.consultation_type ?? "Consultation"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-app-surface p-3.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
              <ClipboardText className="h-4.5 w-4.5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-bold text-navy">
                {programsSummary.active} Active
                {programsSummary.draft > 0 ? ` · ${programsSummary.draft} Draft` : ""}
              </span>
              <span className="block text-[0.65rem] text-muted-foreground">
                Programs across your active patients
              </span>
            </span>
          </div>
        </div>
      </div>
    </AppScreen>
  );
}

function MetricTile({
  icon: IconComponent,
  value,
  label,
  tone = "default",
  status,
}: {
  icon: typeof UsersThree;
  value: number;
  label: string;
  tone?: "default" | "warning";
  status?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl p-3.5 text-center",
        tone === "warning" && value > 0
          ? "border border-app-warning/25 bg-app-warning/10"
          : "bg-app-surface",
      )}
    >
      <IconComponent
        className={cn(
          "mx-auto h-4 w-4",
          tone === "warning" && value > 0 ? "text-app-warning" : "text-primary",
        )}
        weight={tone === "warning" && value > 0 ? "fill" : "regular"}
      />
      <p className="mt-1 font-display text-xl font-extrabold text-navy">{value}</p>
      <p className="text-[0.65rem] text-muted-foreground">{label}</p>
      {status && <p className="mt-0.5 text-[0.6rem] text-muted-foreground/80">{status}</p>}
    </div>
  );
}

function PatientRow({ overview }: { overview: PatientOverview }) {
  return (
    <Link to={`/doctor/patients/${overview.patientId}`} className="flex items-center gap-3 py-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-primary">
        {(overview.full_name ?? "?").charAt(0).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-navy">
          {overview.full_name ?? "Patient"}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          @{overview.username}
          {overview.programDay && ` · Day ${overview.programDay}/${overview.programTotalDays}`}
        </p>
      </div>
      <div className="hidden shrink-0 items-center gap-4 text-right sm:flex">
        {overview.caloriesToday != null && overview.caloriesTarget != null && (
          <div>
            <p className="text-xs font-bold text-navy">
              {Math.round(overview.caloriesToday)}/{Math.round(overview.caloriesTarget)}
            </p>
            <p className="text-[0.6rem] text-muted-foreground">kcal today</p>
          </div>
        )}
        {overview.lastMealAgo && (
          <div>
            <p className="text-xs font-bold text-navy">{overview.lastMealAgo}</p>
            <p className="text-[0.6rem] text-muted-foreground">last meal</p>
          </div>
        )}
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full px-2 py-1 text-[0.6rem] font-bold",
          STATUS_TONE[overview.status],
        )}
      >
        {STATUS_LABEL[overview.status]}
      </span>
      <CaretRight className="hidden h-4 w-4 shrink-0 text-muted-foreground md:block" />
    </Link>
  );
}

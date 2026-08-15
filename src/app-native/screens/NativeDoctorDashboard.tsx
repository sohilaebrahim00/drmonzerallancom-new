import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Loader2, Users } from "lucide-react";

import { AppScreen } from "@/app-native/components/AppScreen";
import { EmptyState } from "@/app-native/components/EmptyState";
import { useAuth } from "@/context/AuthContext";
import {
  getMyPatients,
  getPatientsNeedingReview,
  respondDoctorConnection,
  type PatientNeedsReview,
  type PatientSummary,
} from "@/services/doctorService";
import { getMyConsultationRequests, type ConsultationRequest } from "@/services/membershipService";

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

export default function NativeDoctorDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [consultations, setConsultations] = useState<ConsultationRequest[]>([]);
  const [needsReview, setNeedsReview] = useState<PatientNeedsReview[]>([]);

  function refresh() {
    setLoading(true);
    Promise.all([getMyPatients(), getMyConsultationRequests(), getPatientsNeedingReview()]).then(
      ([p, c, review]) => {
        setPatients(p);
        setConsultations(c);
        setNeedsReview(review);
        setLoading(false);
      },
    );
  }

  useEffect(refresh, []);

  const activePatients = patients.filter((p) => p.status === "active");
  const pendingPatients = patients.filter((p) => p.status === "pending");
  const todaysConsultations = consultations.filter(
    (c) => (c.status === "confirmed" || c.status === "pending") && isToday(c.appointment_start),
  );

  if (loading) {
    return (
      <AppScreen
        title="Doctor Dashboard"
        tabBar
        className="flex min-h-[50vh] items-center justify-center"
      >
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </AppScreen>
    );
  }

  return (
    <AppScreen tabBar hideHeader className="mx-auto w-full px-4 pb-6 pt-3">
      <div className="native-safe-top pb-4 pt-2">
        <p className="font-display text-lg font-extrabold tracking-tight text-navy">
          {greeting()},{" "}
          {user?.email
            ? user.email
                .split("@")[0]
                .split(".")[0]
                .replace(/^\w/, (c) => c.toUpperCase())
            : "Doctor"}
        </p>
        <p className="text-xs text-muted-foreground">Patient overview</p>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <div className="rounded-2xl bg-app-surface p-3.5 text-center">
          <p className="font-display text-xl font-extrabold text-navy">{activePatients.length}</p>
          <p className="text-[0.65rem] text-muted-foreground">Patients</p>
        </div>
        <div className="rounded-2xl bg-app-surface p-3.5 text-center">
          <p className="font-display text-xl font-extrabold text-navy">{needsReview.length}</p>
          <p className="text-[0.65rem] text-muted-foreground">Needs Review</p>
        </div>
        <div className="rounded-2xl bg-app-surface p-3.5 text-center">
          <p className="font-display text-xl font-extrabold text-navy">
            {todaysConsultations.length}
          </p>
          <p className="text-[0.65rem] text-muted-foreground">Today&apos;s Consults</p>
        </div>
      </div>

      {pendingPatients.length > 0 && (
        <div className="mt-5">
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

      {needsReview.length > 0 && (
        <div className="mt-5">
          <p className="mb-1.5 px-1 text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground/80">
            Needs Review
          </p>
          <div className="divide-y divide-border/50 rounded-2xl bg-app-surface px-3">
            {needsReview.map((r) => (
              <Link
                key={r.patientId}
                to={`/doctor/patients/${r.patientId}`}
                className="flex items-center gap-3 py-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                  <AlertCircle className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-navy">
                    {r.full_name ?? "Patient"}
                  </p>
                  <p className="text-xs text-muted-foreground">No meals logged in 3+ days</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <p className="mb-1.5 mt-5 px-1 text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground/80">
        Patients
      </p>
      {activePatients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No connected patients yet"
          body="Accepted patient connections will appear here."
        />
      ) : (
        <div className="divide-y divide-border/50 rounded-2xl bg-app-surface px-3">
          {activePatients.map((p) => (
            <Link
              key={p.relationshipId}
              to={`/doctor/patients/${p.id}`}
              className="flex items-center gap-3 py-3"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-primary">
                {(p.full_name ?? "?").charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-navy">
                  {p.full_name ?? "Patient"}
                </p>
                <p className="truncate text-xs text-muted-foreground">@{p.username}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppScreen>
  );
}

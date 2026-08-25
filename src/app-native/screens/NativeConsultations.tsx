import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, CalendarPlus, Sparkle, VideoCamera } from "@phosphor-icons/react";

import { AppScreen } from "@/app-native/components/AppScreen";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { packages } from "@/data/packages";
import {
  getMyConsultationRequests,
  getMySubscription,
  type ConsultationRequest,
  type Subscription,
} from "@/services/membershipService";
import { cn } from "@/lib/utils";

const statusLabel: Record<ConsultationRequest["status"], string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  rescheduled: "Rescheduled",
};

const statusStyle: Record<ConsultationRequest["status"], string> = {
  pending: "bg-secondary text-primary",
  confirmed: "bg-turquoise/15 text-turquoise",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
  rescheduled: "bg-primary/15 text-primary",
};

function formatAppointment(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

function ConsultationRow({ request }: { request: ConsultationRequest }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-border/60 p-3.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-navy">
          {request.consultation_type ?? "Consultation"}
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          {formatAppointment(request.appointment_start)}
        </p>
        {request.google_meet_url && (
          <a
            href={request.google_meet_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary"
          >
            <VideoCamera className="h-3 w-3" /> Join Google Meet
          </a>
        )}
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full px-2.5 py-1 text-xs font-bold",
          statusStyle[request.status],
        )}
      >
        {statusLabel[request.status]}
      </span>
    </div>
  );
}

export default function NativeConsultations() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [requests, setRequests] = useState<ConsultationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    Promise.all([getMySubscription(), getMyConsultationRequests(user.id)]).then(([sub, reqs]) => {
      if (cancelled) return;
      setSubscription(sub);
      setRequests(reqs);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const packageInfo = subscription
    ? packages.find((p) => p.slug === subscription.package_id)
    : undefined;
  const creditsRemaining = subscription
    ? Math.max(subscription.consultation_credit_limit - subscription.consultation_credits_used, 0)
    : 0;

  const now = Date.now();
  const upcomingList = requests.filter(
    (r) =>
      (r.status === "pending" || r.status === "confirmed") &&
      new Date(r.appointment_start).getTime() > now,
  );
  const pendingList = requests.filter(
    (r) => r.status === "pending" && new Date(r.appointment_start).getTime() <= now,
  );
  const historyList = requests.filter(
    (r) => r.status === "completed" || r.status === "cancelled" || r.status === "rescheduled",
  );
  const nextUpcoming = [...upcomingList].sort(
    (a, b) => new Date(a.appointment_start).getTime() - new Date(b.appointment_start).getTime(),
  )[0];

  if (!user) {
    return (
      <AppScreen
        title="Consultations"
        tabBar
        className="mx-auto w-full max-w-xl px-4 py-6 text-center"
      >
        <p className="mt-10 font-display text-lg font-bold text-navy">
          Sign in to book a consultation
        </p>
        <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
          Online consultations are available to active members.
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <Button asChild className="cursor-pointer">
            <Link to="/login">Sign In</Link>
          </Button>
          <Button asChild variant="outline" className="cursor-pointer">
            <Link to="/join">Create Account</Link>
          </Button>
        </div>
      </AppScreen>
    );
  }

  return (
    <AppScreen title="Consultations" tabBar className="mx-auto w-full max-w-xl px-4 pb-6 pt-3">
      {loading ? (
        <Skeleton className="h-32 w-full rounded-2xl" />
      ) : !packageInfo || !subscription ? (
        <div className="rounded-2xl border border-border/70 bg-card p-5 text-center shadow-sm">
          <p className="font-display text-base font-bold text-navy">No active membership</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a plan to unlock consultation credits.
          </p>
          <Button asChild className="mt-4 cursor-pointer">
            <Link to="/join">
              <Sparkle className="h-4 w-4" /> View Memberships
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-navy">Consultation Credits</span>
              <span className="font-bold text-primary">
                {creditsRemaining} of {subscription.consultation_credit_limit} remaining
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{
                  width: `${(creditsRemaining / Math.max(subscription.consultation_credit_limit, 1)) * 100}%`,
                }}
              />
            </div>
          </div>

          <p className="mt-4 px-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Upcoming
          </p>
          {nextUpcoming ? (
            <div className="mt-2">
              <ConsultationRow request={nextUpcoming} />
            </div>
          ) : (
            <p className="mt-2 rounded-xl border border-dashed border-border/70 bg-secondary/30 p-4 text-center text-sm text-muted-foreground">
              No upcoming consultation scheduled.
            </p>
          )}

          <Button asChild className="mt-4 w-full cursor-pointer" disabled={creditsRemaining === 0}>
            <Link to="/consultations/book">
              <CalendarPlus className="h-4 w-4" /> Book Consultation
            </Link>
          </Button>
          {creditsRemaining === 0 && (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              No credits remaining —{" "}
              <Link to="/join" className="font-semibold text-primary">
                upgrade membership
              </Link>
            </p>
          )}
        </>
      )}

      <Tabs defaultValue="upcoming" className="mt-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="space-y-2">
          {upcomingList.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nothing upcoming.</p>
          ) : (
            upcomingList.map((r) => <ConsultationRow key={r.id} request={r} />)
          )}
        </TabsContent>
        <TabsContent value="pending" className="space-y-2">
          {pendingList.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nothing pending.</p>
          ) : (
            pendingList.map((r) => <ConsultationRow key={r.id} request={r} />)
          )}
        </TabsContent>
        <TabsContent value="history" className="space-y-2">
          {historyList.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No consultation history yet.
            </p>
          ) : (
            historyList.map((r) => <ConsultationRow key={r.id} request={r} />)
          )}
        </TabsContent>
      </Tabs>
    </AppScreen>
  );
}

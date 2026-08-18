import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarClock,
  CalendarPlus,
  Loader2,
  LogOut,
  Package as PackageIcon,
  Sparkles,
  User as UserIcon,
  Video,
} from "lucide-react";

import { Seo } from "@/components/seo/Seo";
import { Reveal } from "@/components/common/Reveal";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/context/AuthContext";
import { getProgramPackageBySlug } from "@/data/programPackages";
import { business } from "@/data/business";
import {
  getMyConsultationRequests,
  getMySubscription,
  getProfile,
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

export default function AccountPage() {
  const { user, signOut, configured } = useAuth();
  const [fullName, setFullName] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [requests, setRequests] = useState<ConsultationRequest[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setDataLoading(true);
    Promise.all([getProfile(user.id), getMySubscription(), getMyConsultationRequests()]).then(
      ([profile, sub, reqs]) => {
        if (cancelled) return;
        setFullName(profile?.full_name ?? null);
        setSubscription(sub);
        setRequests(reqs);
        setDataLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [user]);

  const packageInfo = subscription ? getProgramPackageBySlug(subscription.package_id) : undefined;
  const creditsRemaining = subscription
    ? Math.max(subscription.consultation_credit_limit - subscription.consultation_credits_used, 0)
    : 0;
  const hasActiveMembership = Boolean(subscription);
  const firstName = (fullName ?? user?.email ?? "there").split(" ")[0].split("@")[0];

  const now = Date.now();
  const upcoming = requests
    .filter(
      (r) =>
        (r.status === "pending" || r.status === "confirmed") &&
        new Date(r.appointment_start).getTime() > now,
    )
    .sort(
      (a, b) => new Date(a.appointment_start).getTime() - new Date(b.appointment_start).getTime(),
    )[0];
  const history = requests.filter((r) => r.id !== upcoming?.id);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-16 sm:px-10 sm:py-20">
      <Seo
        title="My Account"
        description="Your Monzer Allan member account."
        path="/account"
        noindex
      />

      <Reveal direction="up" className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
            Member Account
          </p>
          <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
            Welcome, {firstName}
          </h1>
        </div>
        <Button
          type="button"
          variant="outline"
          className="cursor-pointer"
          onClick={() => signOut()}
        >
          <LogOut className="h-4 w-4" /> Sign Out
        </Button>
      </Reveal>

      {!configured && (
        <Alert className="mt-6 border-amber-300 bg-amber-50 text-amber-900">
          <AlertDescription>
            Program data isn&apos;t connected yet — set up Supabase to see real program and
            consultation data here.
          </AlertDescription>
        </Alert>
      )}

      {dataLoading ? (
        <div className="mt-10 flex flex-col items-center justify-center gap-3 py-16" role="status">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your program…</p>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Reveal direction="up" className="lg:col-span-2">
            <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
              {hasActiveMembership && packageInfo ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                        <PackageIcon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="font-display text-lg font-bold text-navy">
                          {packageInfo.name}
                        </p>
                        <p className="text-sm text-muted-foreground">{packageInfo.priceLabel}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-turquoise/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-turquoise">
                      Active
                    </span>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-navy">Consultation Credits</span>
                      <span className="font-semibold text-primary">
                        {creditsRemaining} of {subscription?.consultation_credit_limit} remaining
                      </span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{
                          width: `${subscription ? (creditsRemaining / Math.max(subscription.consultation_credit_limit, 1)) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <p className="font-display text-lg font-bold text-navy">
                    You don&apos;t have an active program yet
                  </p>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                    Choose a program to unlock consultation credits and get started.
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-3">
                    <Link
                      to="/packages"
                      className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-turquoise"
                    >
                      <Sparkles className="h-4 w-4" /> View Programs
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 rounded-2xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-lg font-bold text-navy">Consultations</h2>
                <Button asChild className="cursor-pointer">
                  <Link to="/account/consultations">
                    <CalendarPlus className="h-4 w-4" /> Request Consultation
                  </Link>
                </Button>
              </div>

              {!hasActiveMembership && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Requesting a consultation requires an active program.
                </p>
              )}
              {hasActiveMembership && creditsRemaining === 0 && (
                <p className="mt-3 text-xs text-muted-foreground">
                  You have no consultation credits remaining.{" "}
                  <Link to="/packages" className="font-semibold text-primary hover:text-turquoise">
                    Purchase another program
                  </Link>{" "}
                  to get more credits.
                </p>
              )}

              {upcoming && (
                <div className="mt-5 rounded-xl border border-turquoise/40 bg-turquoise/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-turquoise">
                    Upcoming Consultation
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-navy">
                    <CalendarClock className="h-4 w-4" />{" "}
                    {formatAppointment(upcoming.appointment_start)}
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-bold",
                        statusStyle[upcoming.status],
                      )}
                    >
                      {statusLabel[upcoming.status]}
                    </span>
                    {upcoming.google_meet_url && (
                      <a
                        href={upcoming.google_meet_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-turquoise"
                      >
                        <Video className="h-3.5 w-3.5" /> Join Google Meet
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Consultation History
                </p>
                {history.length === 0 ? (
                  <p className="mt-2 rounded-xl border border-dashed border-border/70 bg-secondary/30 p-5 text-center text-sm text-muted-foreground">
                    No consultations scheduled yet.
                  </p>
                ) : (
                  <ul className="mt-2 space-y-3">
                    {history.map((req) => (
                      <li
                        key={req.id}
                        className="flex items-start justify-between gap-3 rounded-xl border border-border/60 p-4"
                      >
                        <div>
                          <p className="text-sm font-semibold text-navy">
                            {req.consultation_type ?? "Consultation"}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CalendarClock className="h-3.5 w-3.5" />
                            {formatAppointment(req.appointment_start)}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2.5 py-1 text-xs font-bold",
                            statusStyle[req.status],
                          )}
                        >
                          {statusLabel[req.status]}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </Reveal>

          <Reveal direction="up" delay={0.1} className="flex flex-col gap-6">
            <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
              <h2 className="font-display text-sm font-bold uppercase tracking-wide text-navy">
                Member Details
              </h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center gap-2.5">
                  <UserIcon className="h-4 w-4 text-primary" />
                  <dd className="text-navy">{fullName ?? "—"}</dd>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="h-4 w-4 shrink-0" />
                  <dd className="break-all text-navy">{user?.email}</dd>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="h-4 w-4 shrink-0" />
                  <dd className="text-navy">
                    {packageInfo ? packageInfo.name : "No active program"}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
              <h2 className="font-display text-sm font-bold uppercase tracking-wide text-navy">
                Quick Actions
              </h2>
              <div className="mt-4 flex flex-col gap-2">
                <Link
                  to="/packages"
                  className="text-sm font-semibold text-primary hover:text-turquoise"
                >
                  View Programs
                </Link>
                <Link
                  to="/products"
                  className="text-sm font-semibold text-primary hover:text-turquoise"
                >
                  Browse Products
                </Link>
                <Link
                  to="/blog"
                  className="text-sm font-semibold text-primary hover:text-turquoise"
                >
                  Read Educational Content
                </Link>
                <Link
                  to="/contact"
                  className="text-sm font-semibold text-primary hover:text-turquoise"
                >
                  Contact Support
                </Link>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-muted-foreground">
              Your account is used for identity, your program, booking, and saved products only.
              Please don&apos;t share diagnoses, lab reports, or medication details here — that
              information stays with your consultation with {business.doctorName}.
            </p>
          </Reveal>
        </div>
      )}
    </div>
  );
}

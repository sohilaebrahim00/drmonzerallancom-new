import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useLocale, intlTagOf, type Locale } from "@/i18n";
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
import type { UserRole } from "@/services/profileService";
import { IntakeReview } from "@/components/account/IntakeReview";
import { IntakePrompt } from "@/components/account/IntakePrompt";
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

/**
 * Total by construction — it cannot throw for any input.
 *
 * Intl.DateTimeFormat.format raises `RangeError: Invalid time value` on an
 * invalid Date, and this runs during render for the upcoming appointment AND
 * for every row of the history list. One malformed or null appointment_start
 * took the entire page white, because React 19 unmounts the tree on a render
 * throw and there was no boundary to catch it.
 *
 * Returns an em dash rather than the raw string: a raw ISO timestamp in the
 * middle of a formatted list reads as a different kind of bug, and the value
 * is unusable to the reader either way.
 */
function formatAppointment(iso: string | null | undefined, locale: Locale) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  // intlTagOf, not the locale code: Arabic resolves to `ar-u-nu-latn`, which
  // is Arabic month and weekday names with Latin digits — decided once in
  // src/i18n/config.ts, because Arabic-Indic digits beside a USD price read
  // as a mistake.
  return new Intl.DateTimeFormat(intlTagOf(locale), {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

/** Titles skipped when picking a greeting name, so "Dr. Monzer Allan" greets "Monzer", not "Dr.". */
const HONORIFICS = new Set(["dr", "mr", "mrs", "ms", "miss", "prof", "professor", "sir", "dame"]);

/**
 * First name for the greeting.
 *
 * Skips a leading honorific — either one of the list above, or any short
 * leading token ending in "." — and falls through to the next token. Any
 * patient who types a title into their name hit this too; the doctor's
 * account just made it obvious ("Welcome, Dr.").
 *
 * Falls back to the whole input when every token looks like a title, so this
 * can never return an empty greeting. Email input still yields the local
 * part, as before.
 */
function firstNameFrom(source: string): string {
  const tokens = source.trim().split(/\s+/).filter(Boolean);
  const name =
    tokens.find((token) => {
      const bare = token.replace(/\.$/, "").toLowerCase();
      if (HONORIFICS.has(bare)) return false;
      // A short token ending in "." is a title or an initial, not a name.
      if (token.endsWith(".") && bare.length <= 4) return false;
      return true;
    }) ??
    tokens[0] ??
    source;
  return name.split("@")[0];
}

export default function AccountPage() {
  const { locale } = useLocale();
  const { user, signOut, configured } = useAuth();
  const [fullName, setFullName] = useState<string | null>(null);
  const [viewerRole, setViewerRole] = useState<UserRole | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [requests, setRequests] = useState<ConsultationRequest[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setDataLoading(true);
    setLoadError(null);
    Promise.all([getProfile(user.id), getMySubscription(), getMyConsultationRequests(user.id)])
      .then(([profile, sub, reqs]) => {
        if (cancelled) return;
        setFullName(profile?.full_name ?? null);
        setViewerRole(profile?.role ?? null);
        setSubscription(sub);
        setRequests(reqs);
        setDataLoading(false);
      })
      // The outer net. Each service already fails soft on its own, but a
      // rejection here previously left dataLoading true forever — the page
      // span an infinite spinner with an unhandled rejection in the console
      // and no way for the customer to tell anything had gone wrong.
      .catch((err) => {
        if (cancelled) return;
        console.error("[AccountPage] Failed to load account data:", err);
        setLoadError("We couldn't load your program right now.");
        setDataLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, reloadNonce]);

  const packageInfo = subscription ? getProgramPackageBySlug(subscription.package_id) : undefined;
  const creditsRemaining = subscription
    ? Math.max(subscription.consultation_credit_limit - subscription.consultation_credits_used, 0)
    : 0;
  const hasActiveMembership = Boolean(subscription);
  const isPractitioner = viewerRole === "doctor" || viewerRole === "admin";
  const firstName = firstNameFrom(fullName ?? user?.email ?? "there");

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
          <p dir="auto" className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
            Member Account
          </p>
          <h1
            dir="auto"
            className="mt-2 font-display text-2xl font-extrabold tracking-tight text-navy sm:text-3xl"
          >
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
          <p dir="auto" className="text-sm text-muted-foreground">
            Loading your program…
          </p>
        </div>
      ) : loadError ? (
        /* Honest and actionable, rather than an endless spinner. */
        <div className="mt-10 rounded-2xl border border-border/70 bg-card p-8 text-center shadow-sm">
          <p dir="auto" className="font-display text-lg font-bold text-navy">
            {loadError}
          </p>
          <p
            dir="auto"
            className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground"
          >
            This is a problem on our side, not with your account or your payment.
          </p>
          <button
            type="button"
            onClick={() => setReloadNonce((n) => n + 1)}
            className="mt-5 inline-flex cursor-pointer items-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-turquoise"
          >
            Try again
          </button>
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
                        <p dir="auto" className="font-display text-lg font-bold text-navy">
                          {packageInfo.name}
                        </p>
                        <p dir="auto" className="text-sm text-muted-foreground">
                          {packageInfo.priceLabel}
                        </p>
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
              ) : isPractitioner ? (
                /* A practitioner has no program and never will — selling one
                   to the doctor is nonsense. This is a neutral placeholder,
                   not a dashboard: the patient list, patient profiles and the
                   program builder are Phase 6B. */
                <div className="text-center">
                  <p dir="auto" className="font-display text-lg font-bold text-navy">
                    Practitioner account
                  </p>
                  <p
                    dir="auto"
                    className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground"
                  >
                    This is your personal account page. Consultation programs are for patients, so
                    there is nothing to buy here.
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-3">
                    <Link
                      to="/doctor/availability"
                      className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-turquoise"
                    >
                      <CalendarClock className="h-4 w-4" /> Manage Availability
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p dir="auto" className="font-display text-lg font-bold text-navy">
                    You don&apos;t have an active program yet
                  </p>
                  <p
                    dir="auto"
                    className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground"
                  >
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
                <h2 dir="auto" className="font-display text-lg font-bold text-navy">
                  Consultations
                </h2>
                <Button asChild className="cursor-pointer">
                  <Link to="/account/consultations">
                    <CalendarPlus className="h-4 w-4" /> Request Consultation
                  </Link>
                </Button>
              </div>

              {!hasActiveMembership && (
                <p dir="auto" className="mt-3 text-xs text-muted-foreground">
                  Requesting a consultation requires an active program.
                </p>
              )}
              {hasActiveMembership && creditsRemaining === 0 && (
                <p dir="auto" className="mt-3 text-xs text-muted-foreground">
                  You have no consultation credits remaining.{" "}
                  <Link to="/packages" className="font-semibold text-primary hover:text-turquoise">
                    Purchase another program
                  </Link>{" "}
                  to get more credits.
                </p>
              )}

              {upcoming && (
                <div className="mt-5 rounded-xl border border-turquoise/40 bg-turquoise/10 p-4">
                  <p
                    dir="auto"
                    className="text-xs font-semibold uppercase tracking-wide text-turquoise"
                  >
                    Upcoming Consultation
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-navy">
                    <CalendarClock className="h-4 w-4" />{" "}
                    {formatAppointment(upcoming.appointment_start, locale)}
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
                  <IntakePrompt consultationRequestId={upcoming.id} />
                  <IntakeReview consultationRequestId={upcoming.id} />
                </div>
              )}

              <div className="mt-5">
                <p
                  dir="auto"
                  className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Consultation History
                </p>
                {history.length === 0 ? (
                  <p
                    dir="auto"
                    className="mt-2 rounded-xl border border-dashed border-border/70 bg-secondary/30 p-5 text-center text-sm text-muted-foreground"
                  >
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
                          <p dir="auto" className="text-sm font-semibold text-navy">
                            {req.consultation_type ?? "Consultation"}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CalendarClock className="h-3.5 w-3.5" />
                            {formatAppointment(req.appointment_start, locale)}
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
              <h2
                dir="auto"
                className="font-display text-sm font-bold uppercase tracking-wide text-navy"
              >
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
              <h2
                dir="auto"
                className="font-display text-sm font-bold uppercase tracking-wide text-navy"
              >
                Quick Actions
              </h2>
              <div className="mt-4 flex flex-col gap-2">
                {/* The availability screen had no link anywhere in the app —
                    the doctor had to type the URL. Practitioners only. */}
                {isPractitioner && (
                  <Link
                    to="/doctor/availability"
                    className="text-sm font-semibold text-primary hover:text-turquoise"
                  >
                    Manage Consultation Availability
                  </Link>
                )}
                {isPractitioner && (
                  <Link
                    to="/doctor/subscribers"
                    className="text-sm font-semibold text-primary hover:text-turquoise"
                  >
                    View Subscribers
                  </Link>
                )}
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

            {/* Narrowed in Phase 3.1: the pre-consultation intake asks for
                exactly this information, so a blanket "never share it" is now
                wrong. It was right about THIS page, though — a general profile
                area is not a clinical record — so the instruction is scoped to
                the free-text fields it was written for rather than deleted. */}
            <p dir="auto" className="text-xs leading-relaxed text-muted-foreground">
              Your account is used for identity, your program, booking, and saved products only.
              Please don&apos;t put diagnoses, lab reports, or medication details into your profile
              or product notes — those free-text fields are not a medical record. The right place
              for them is your pre-consultation intake or the call itself, where they go only to{" "}
              {business.doctorName}.
            </p>
          </Reveal>
        </div>
      )}
    </div>
  );
}

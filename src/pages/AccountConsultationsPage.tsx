import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronLeft,
  Loader2,
  MessageCircle,
  Sparkles,
  Video,
} from "lucide-react";

import { Seo } from "@/components/seo/Seo";
import { Reveal } from "@/components/common/Reveal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useAuth } from "@/context/AuthContext";
import { getMySubscription, type Subscription } from "@/services/membershipService";
import { getAvailableSlots, type SlotInfo } from "@/services/availabilityService";
import {
  bookConsultation,
  type BookConsultationResult,
} from "@/services/consultationBookingService";
import { getProgramPackageBySlug } from "@/data/programPackages";
import { DOCTOR_TIMEZONE, MINIMUM_BOOKING_NOTICE_HOURS } from "@/config/consultations";
import { hapticSuccess } from "@/lib/haptics";
import { cn } from "@/lib/utils";

const CONSULTATION_TYPES = [
  "Monthly Check-In",
  "New Plan Consultation",
  "Follow-Up",
  "General Question",
];

type Step = "date" | "time" | "review" | "confirm";

function clientTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

export default function AccountConsultationsPage() {
  const { user } = useAuth();
  const tz = useMemo(clientTimeZone, []);

  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [slots, setSlots] = useState<SlotInfo[] | null>(null);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  const [step, setStep] = useState<Step>("date");
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null);
  const [consultationType, setConsultationType] = useState(CONSULTATION_TYPES[0]);
  const [reason, setReason] = useState("");
  const [booking, setBooking] = useState(false);
  const [result, setResult] = useState<BookConsultationResult | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([getMySubscription(), getAvailableSlots()]).then(([sub, avail]) => {
      if (cancelled) return;
      setSubscription(sub);
      if (avail.ok) setSlots(avail.slots);
      else setSlotsError(avail.error);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const creditsLimit = subscription?.consultation_credit_limit ?? 0;
  const creditsRemaining = subscription
    ? Math.max(subscription.consultation_credit_limit - subscription.consultation_credits_used, 0)
    : 0;
  const packageInfo = subscription ? getProgramPackageBySlug(subscription.package_id) : undefined;
  const membershipLabel = packageInfo?.name ?? "Program";
  const hasActiveMembership = Boolean(subscription);
  const canBook = hasActiveMembership && creditsRemaining > 0;

  const dateGroups = useMemo(() => {
    if (!slots) return [];
    const map = new Map<string, SlotInfo[]>();
    for (const slot of slots) {
      const date = new Date(slot.startUtc);
      const key = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(date); // YYYY-MM-DD
      const list = map.get(key) ?? [];
      list.push(slot);
      map.set(key, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [slots, tz]);

  const timesForSelectedDate = useMemo(() => {
    return dateGroups.find(([key]) => key === selectedDateKey)?.[1] ?? [];
  }, [dateGroups, selectedDateKey]);

  function formatDateLabel(dateKey: string) {
    const [y, m, d] = dateKey.split("-").map(Number);
    const approx = new Date(Date.UTC(y, m - 1, d, 12));
    return new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      weekday: "long",
      month: "long",
      day: "numeric",
    }).format(approx);
  }

  /**
   * How the doctor's own timezone is described to the patient. Derived from
   * the slots themselves, never hardcoded: the timezone is editable per day
   * (see /doctor/availability), so the practice is not necessarily on Dubai
   * time and different days may differ. DOCTOR_TIMEZONE is only the fallback
   * for "no slots loaded yet".
   */
  const scheduleTimezoneLabel = (() => {
    const zones = Array.from(new Set((slots ?? []).map((s) => s.timezone))).filter(Boolean);
    if (zones.length === 0) return `${DOCTOR_TIMEZONE.replace("_", " ")} time`;
    if (zones.length === 1) return `${zones[0].replace("_", " ")} time`;
    return "the doctor's local time, shown on each slot";
  })();

  function formatTime(iso: string, timeZone: string) {
    return new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(iso));
  }

  async function handleConfirm() {
    if (!selectedSlot) return;
    setBooking(true);
    const res = await bookConsultation({
      startUtc: selectedSlot.startUtc,
      clientTimeZone: tz,
      consultationType,
      reason,
    });
    setBooking(false);
    setResult(res);
    setStep("confirm");
    if (res.ok) {
      hapticSuccess();
      setSubscription((prev) =>
        prev
          ? {
              ...prev,
              consultation_credits_used: prev.consultation_credit_limit - res.creditsRemaining,
            }
          : prev,
      );
    }
  }

  function resetWizard() {
    setStep("date");
    setSelectedDateKey(null);
    setSelectedSlot(null);
    setReason("");
    setResult(null);
  }

  const jsonLd = undefined;

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16 sm:px-10 sm:py-20">
      <Seo
        title="Request a Consultation"
        description="Book your online nutrition consultation."
        path="/account/consultations"
        noindex
        jsonLd={jsonLd}
      />

      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/account">My Account</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Consultations</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Reveal direction="up" className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
          Consultations
        </p>
        <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
          Request a Consultation
        </h1>
      </Reveal>

      {loading ? (
        <div className="mt-10 flex flex-col items-center justify-center gap-3 py-16" role="status">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your program…</p>
        </div>
      ) : !hasActiveMembership ? (
        <Reveal
          direction="up"
          className="mt-10 rounded-2xl border border-border/70 bg-card p-8 text-center shadow-sm"
        >
          <p className="font-display text-lg font-bold text-navy">
            Online consultations are available once you&apos;ve purchased a program.
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Choose a program to unlock consultation credits and book your first session.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/packages"
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-turquoise"
            >
              <Sparkles className="h-4 w-4" /> View Programs
            </Link>
          </div>
        </Reveal>
      ) : (
        <>
          <Reveal
            direction="up"
            delay={0.05}
            className="mt-8 rounded-2xl border border-border/70 bg-card p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {membershipLabel}
                </p>
                <p className="font-display text-lg font-bold text-primary">
                  {creditsRemaining} of {creditsLimit} Credits Remaining
                </p>
              </div>
              <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${creditsLimit ? (creditsRemaining / creditsLimit) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </Reveal>

          {!canBook && step !== "confirm" && (
            <Alert className="mt-6 border-amber-300 bg-amber-50 text-amber-900">
              <AlertDescription>
                You have no consultation credits remaining.{" "}
                <Link to="/packages" className="font-semibold underline">
                  Purchase another program
                </Link>{" "}
                to get more credits.
              </AlertDescription>
            </Alert>
          )}

          {canBook && (
            <Reveal
              direction="up"
              delay={0.1}
              className="mt-8 rounded-2xl border border-border/70 bg-card p-6 shadow-sm sm:p-8"
            >
              {slotsError ? (
                <p className="py-10 text-center text-sm text-muted-foreground">{slotsError}</p>
              ) : dateGroups.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  No consultation times are currently open — please check back soon or{" "}
                  <Link to="/contact" className="font-semibold text-primary hover:text-turquoise">
                    contact us
                  </Link>
                  .
                </p>
              ) : step === "date" ? (
                <div>
                  <h2 className="font-display text-base font-bold text-navy">
                    Step 1 — Select a Date
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Standard hours: {scheduleTimezoneLabel}. Appointments must be booked at least{" "}
                    {MINIMUM_BOOKING_NOTICE_HOURS} hours in advance.
                  </p>
                  <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                    {dateGroups.map(([dateKey]) => (
                      <button
                        key={dateKey}
                        type="button"
                        onClick={() => {
                          setSelectedDateKey(dateKey);
                          setStep("time");
                        }}
                        className="cursor-pointer rounded-xl border border-border/70 p-3 text-center text-sm font-semibold text-navy transition-colors hover:border-turquoise hover:bg-secondary"
                      >
                        {formatDateLabel(dateKey)}
                      </button>
                    ))}
                  </div>
                </div>
              ) : step === "time" ? (
                <div>
                  <button
                    type="button"
                    onClick={() => setStep("date")}
                    className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-navy"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Back
                  </button>
                  <h2 className="mt-3 font-display text-base font-bold text-navy">
                    Step 2 — Select a Time · {selectedDateKey && formatDateLabel(selectedDateKey)}
                  </h2>
                  <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                    {timesForSelectedDate.map((slot) => (
                      <button
                        key={slot.startUtc}
                        type="button"
                        onClick={() => {
                          setSelectedSlot(slot);
                          setStep("review");
                        }}
                        className="cursor-pointer rounded-xl border border-border/70 p-3 text-center transition-colors hover:border-turquoise hover:bg-secondary"
                      >
                        <span className="block text-sm font-semibold text-navy">
                          {formatTime(slot.startUtc, tz)}
                        </span>
                        <span className="block text-[0.65rem] text-muted-foreground">
                          {formatTime(slot.startUtc, slot.timezone)}{" "}
                          {slot.timezone.split("/").pop()?.replace("_", " ")}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : step === "review" && selectedSlot ? (
                <div>
                  <button
                    type="button"
                    onClick={() => setStep("time")}
                    className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-navy"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Back
                  </button>
                  <h2 className="mt-3 font-display text-base font-bold text-navy">
                    Step 3 — Review Appointment
                  </h2>
                  <dl className="mt-5 space-y-3 rounded-xl border border-border/60 bg-secondary/30 p-4 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Your Time</dt>
                      <dd className="text-right font-semibold text-navy">
                        {selectedDateKey && formatDateLabel(selectedDateKey)},{" "}
                        {formatTime(selectedSlot.startUtc, tz)} ({tz})
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">
                        Doctor&apos;s Time —{" "}
                        {selectedSlot.timezone.split("/").pop()?.replace("_", " ")}
                      </dt>
                      <dd className="text-right font-semibold text-navy">
                        {formatTime(selectedSlot.startUtc, selectedSlot.timezone)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Program</dt>
                      <dd className="text-right font-semibold text-navy">{membershipLabel}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Credits After Booking</dt>
                      <dd className="text-right font-semibold text-navy">
                        {creditsRemaining - 1} of {creditsLimit}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Format</dt>
                      <dd className="flex items-center gap-1.5 text-right font-semibold text-navy">
                        <Video className="h-3.5 w-3.5" /> Online via Google Meet
                      </dd>
                    </div>
                  </dl>

                  <label className="mt-5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Consultation type
                  </label>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {CONSULTATION_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setConsultationType(type)}
                        className={cn(
                          "cursor-pointer rounded-lg border px-2 py-2 text-xs font-semibold transition-colors",
                          consultationType === type
                            ? "border-primary bg-secondary/60 text-primary"
                            : "border-border text-navy/70 hover:border-turquoise",
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    General reason (optional)
                  </label>
                  <Textarea
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value.slice(0, 300))}
                    placeholder="e.g., monthly check-in, plan adjustment…"
                    className="mt-2"
                  />
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Please keep this general — no detailed medical history here.
                  </p>

                  <Button
                    type="button"
                    onClick={handleConfirm}
                    disabled={booking}
                    className="mt-6 w-full cursor-pointer justify-center"
                  >
                    {booking ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Confirming…
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" /> Step 4 — Confirm Appointment
                      </>
                    )}
                  </Button>
                </div>
              ) : step === "confirm" && result ? (
                <div className="py-4 text-center">
                  {result.ok ? (
                    <>
                      <CheckCircle2 className="mx-auto h-10 w-10 text-turquoise" />
                      <p className="mt-4 font-display text-lg font-bold text-navy">
                        Consultation Confirmed
                      </p>
                      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                        {result.appointment.clientLocalTime} ({tz}) ·{" "}
                        {result.appointment.doctorLocalTime} (
                        {result.appointment.doctorTimeZone.split("/").pop()?.replace("_", " ")})
                      </p>
                      <a
                        href={result.appointment.meetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-turquoise"
                      >
                        <Video className="h-4 w-4" /> Join Google Meet
                      </a>
                      <p className="mt-4 text-xs text-muted-foreground">
                        {result.creditsRemaining} of {result.creditsLimit} credits remaining
                      </p>
                    </>
                  ) : (
                    <>
                      <CalendarClock className="mx-auto h-10 w-10 text-primary/60" />
                      <p className="mt-4 font-display text-lg font-bold text-navy">
                        {result.reason === "scheduling-not-connected"
                          ? "Almost There"
                          : "Couldn't Complete Booking"}
                      </p>
                      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                        {result.error}
                      </p>
                      {result.reason === "scheduling-not-connected" && (
                        <p className="mx-auto mt-2 max-w-sm text-xs text-muted-foreground">
                          No consultation credit has been used.
                        </p>
                      )}
                      <div className="mt-5 flex flex-wrap justify-center gap-3">
                        {result.actions?.map((action) => (
                          <Link
                            key={action.route}
                            to={action.route}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold text-navy hover:border-turquoise"
                          >
                            {action.label}
                          </Link>
                        ))}
                        <Link
                          to="/contact"
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold text-navy hover:border-turquoise"
                        >
                          <MessageCircle className="h-3.5 w-3.5" /> Contact Team
                        </Link>
                      </div>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={resetWizard}
                    className="mt-6 cursor-pointer text-xs font-semibold text-primary hover:text-turquoise"
                  >
                    Book another consultation
                  </button>
                </div>
              ) : null}
            </Reveal>
          )}
        </>
      )}
    </div>
  );
}

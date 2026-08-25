import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  CheckCircle,
  CircleNotch,
  ChatCircleDots,
  Sparkle,
  VideoCamera,
} from "@phosphor-icons/react";

import { AppScreen } from "@/app-native/components/AppScreen";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { getMySubscription, type Subscription } from "@/services/membershipService";
import { getAvailableSlots, type SlotInfo } from "@/services/availabilityService";
import {
  bookConsultation,
  type BookConsultationResult,
} from "@/services/consultationBookingService";
import { packages } from "@/data/packages";
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
const STEP_TITLES: Record<Step, string> = {
  date: "Select Date",
  time: "Select Time",
  review: "Review",
  confirm: "Confirmed",
};

function clientTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

/** The server returns website routes for error actions — map the ones that differ in the native tree. */
function mapServerRoute(route: string): string {
  if (route === "/packages") return "/join";
  return route;
}

export default function NativeBookConsultation() {
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
  const packageInfo = subscription
    ? packages.find((p) => p.slug === subscription.package_id)
    : undefined;
  const hasActiveMembership = Boolean(subscription);
  const canBook = hasActiveMembership && creditsRemaining > 0;

  const dateGroups = useMemo(() => {
    if (!slots) return [];
    const map = new Map<string, SlotInfo[]>();
    for (const slot of slots) {
      const date = new Date(slot.startUtc);
      const key = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(date);
      const list = map.get(key) ?? [];
      list.push(slot);
      map.set(key, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [slots, tz]);

  const timesForSelectedDate = useMemo(
    () => dateGroups.find(([key]) => key === selectedDateKey)?.[1] ?? [],
    [dateGroups, selectedDateKey],
  );

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
   * Derived from the slots, never hardcoded — the doctor's timezone is
   * editable per day at /doctor/availability, so the practice is not
   * necessarily on Dubai time. DOCTOR_TIMEZONE is only the "nothing loaded
   * yet" fallback.
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

  function goBack(): void {
    if (step === "time") setStep("date");
    else if (step === "review") setStep("time");
    else window.history.back();
  }

  if (!user) {
    return (
      <AppScreen
        title="Book Consultation"
        back
        className="mx-auto w-full max-w-lg px-4 py-10 text-center"
      >
        <p className="mt-10 font-display text-lg font-bold text-navy">Sign in to book</p>
        <Button asChild className="mt-4 cursor-pointer">
          <Link to="/login">Sign In</Link>
        </Button>
      </AppScreen>
    );
  }

  if (loading) {
    return (
      <AppScreen title="Book Consultation" back className="mx-auto w-full max-w-lg px-4 py-6">
        <Skeleton className="h-48 w-full rounded-2xl" />
      </AppScreen>
    );
  }

  if (!hasActiveMembership) {
    return (
      <AppScreen
        title="Book Consultation"
        back
        className="mx-auto w-full max-w-lg px-4 py-10 text-center"
      >
        <p className="font-display text-lg font-bold text-navy">
          Online consultations are available to active members.
        </p>
        <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
          Choose a membership to unlock consultation credits.
        </p>
        <Button asChild className="mt-5 cursor-pointer">
          <Link to="/join">
            <Sparkle className="h-4 w-4" /> View Memberships
          </Link>
        </Button>
      </AppScreen>
    );
  }

  if (!canBook) {
    return (
      <AppScreen
        title="Book Consultation"
        back
        className="mx-auto w-full max-w-lg px-4 py-10 text-center"
      >
        <p className="font-display text-lg font-bold text-navy">No credits remaining</p>
        <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
          Upgrade or renew your membership to book another consultation.
        </p>
        <Button asChild className="mt-5 cursor-pointer">
          <Link to="/join">Upgrade Membership</Link>
        </Button>
      </AppScreen>
    );
  }

  return (
    <AppScreen
      title={STEP_TITLES[step]}
      subtitle={step !== "confirm" ? `${creditsRemaining} of ${creditsLimit} credits` : undefined}
      back={step === "confirm" ? true : goBack}
      className="mx-auto w-full max-w-lg px-4 py-4"
    >
      {slotsError ? (
        <p className="py-10 text-center text-sm text-muted-foreground">{slotsError}</p>
      ) : dateGroups.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No consultation times are currently open — please check back soon or{" "}
          <Link to="/account/help" className="font-semibold text-primary">
            contact us
          </Link>
          .
        </p>
      ) : step === "date" ? (
        <div>
          <p className="text-xs text-muted-foreground">
            Standard hours: {scheduleTimezoneLabel}. Booked at least {MINIMUM_BOOKING_NOTICE_HOURS}{" "}
            hours in advance.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {dateGroups.map(([dateKey]) => (
              <button
                key={dateKey}
                type="button"
                onClick={() => {
                  setSelectedDateKey(dateKey);
                  setStep("time");
                }}
                className="cursor-pointer rounded-xl border border-border/70 p-3 text-center text-sm font-semibold text-navy transition-colors active:scale-[0.97] hover:border-turquoise hover:bg-secondary"
              >
                {formatDateLabel(dateKey)}
              </button>
            ))}
          </div>
        </div>
      ) : step === "time" ? (
        <div>
          <p className="text-xs font-semibold text-muted-foreground">
            {selectedDateKey && formatDateLabel(selectedDateKey)}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {timesForSelectedDate.map((slot) => (
              <button
                key={slot.startUtc}
                type="button"
                onClick={() => {
                  setSelectedSlot(slot);
                  setStep("review");
                }}
                className="cursor-pointer rounded-xl border border-border/70 p-3 text-center transition-colors active:scale-[0.97] hover:border-turquoise hover:bg-secondary"
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
          <dl className="space-y-3 rounded-xl border border-border/60 bg-secondary/30 p-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Your Time</dt>
              <dd className="text-right font-semibold text-navy">
                {selectedDateKey && formatDateLabel(selectedDateKey)},{" "}
                {formatTime(selectedSlot.startUtc, tz)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">
                Doctor&apos;s Time — {selectedSlot.timezone.split("/").pop()?.replace("_", " ")}
              </dt>
              <dd className="text-right font-semibold text-navy">
                {formatTime(selectedSlot.startUtc, selectedSlot.timezone)}
              </dd>
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
                <VideoCamera className="h-3.5 w-3.5" /> Google Meet
              </dd>
            </div>
          </dl>

          <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Consultation type
          </label>
          <div className="mt-2 grid grid-cols-2 gap-2">
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
            Reason (optional)
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
            className="mt-5 w-full cursor-pointer"
          >
            {booking ? (
              <>
                <CircleNotch className="h-4 w-4 animate-spin" /> Confirming…
              </>
            ) : (
              <>
                <Check className="h-4 w-4" /> Confirm Appointment
              </>
            )}
          </Button>
        </div>
      ) : step === "confirm" && result ? (
        <div className="py-4 text-center">
          {result.ok ? (
            <>
              <CheckCircle className="mx-auto h-10 w-10 text-turquoise" />
              <p className="mt-4 font-display text-lg font-bold text-navy">
                Consultation Confirmed
              </p>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                {result.appointment.clientLocalTime} ({tz}) · {result.appointment.doctorLocalTime} (
                {result.appointment.doctorTimeZone.split("/").pop()?.replace("_", " ")})
              </p>
              <a
                href={result.appointment.meetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
              >
                <VideoCamera className="h-4 w-4" /> Join Google Meet
              </a>
              <p className="mt-4 text-xs text-muted-foreground">
                {result.creditsRemaining} of {result.creditsLimit} credits remaining
              </p>
              <Link to="/consultations" className="mt-6 block text-xs font-semibold text-primary">
                Back to Consultations
              </Link>
            </>
          ) : (
            <>
              <p className="mt-2 font-display text-lg font-bold text-navy">
                {result.reason === "scheduling-not-connected"
                  ? "Almost There"
                  : "Couldn't Complete Booking"}
              </p>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                {result.error}
              </p>
              {result.reason === "scheduling-not-connected" && (
                <p className="mx-auto mt-2 max-w-xs text-xs text-muted-foreground">
                  No consultation credit has been used.
                </p>
              )}
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {result.actions?.map((action) => (
                  <Link
                    key={action.route}
                    to={mapServerRoute(action.route)}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold text-navy hover:border-turquoise"
                  >
                    {action.label}
                  </Link>
                ))}
                <Link
                  to="/account/help"
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold text-navy hover:border-turquoise"
                >
                  <ChatCircleDots className="h-3.5 w-3.5" /> Help &amp; Support
                </Link>
              </div>
            </>
          )}
        </div>
      ) : null}
    </AppScreen>
  );
}

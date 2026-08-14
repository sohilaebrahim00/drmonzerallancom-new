import { Link } from "react-router-dom";
import { CalendarClock, CalendarPlus, Sparkles, Video } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { PackageTier } from "@/data/packages";
import type { ConsultationRequest, Subscription } from "@/services/membershipService";

interface MemberSummaryCardProps {
  authenticated: boolean;
  packageInfo?: PackageTier;
  subscription?: Subscription | null;
  creditsRemaining: number;
  upcoming?: ConsultationRequest;
}

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

/**
 * The single primary card on Home. Real Supabase data only — never
 * illustrative/sample values in the authenticated state.
 */
export function MemberSummaryCard({
  authenticated,
  packageInfo,
  subscription,
  creditsRemaining,
  upcoming,
}: MemberSummaryCardProps) {
  if (!authenticated) {
    return (
      <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-navy to-primary p-5 text-white shadow-[0_20px_44px_-20px_rgba(23,35,59,0.5)]">
        <p className="font-display text-lg font-bold">Start Your Nutrition Journey</p>
        <p className="mt-1 text-sm text-white/80">
          Real consultations, AI guidance, and tools built around your health.
        </p>
        <div className="mt-4 flex gap-2.5">
          <Button
            asChild
            size="sm"
            className="cursor-pointer bg-turquoise text-navy hover:bg-turquoise/90"
          >
            <Link to="/join">
              <Sparkles className="h-3.5 w-3.5" /> View Memberships
            </Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="cursor-pointer border-white/40 bg-white/10 text-white hover:bg-white/20"
          >
            <Link to="/login">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!packageInfo || !subscription) {
    return (
      <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
        <p className="font-display text-base font-bold text-navy">No active membership</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a plan to unlock consultation credits.
        </p>
        <Button asChild size="sm" className="mt-4 cursor-pointer">
          <Link to="/join">
            <Sparkles className="h-3.5 w-3.5" /> View Memberships
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-navy to-primary p-5 text-white shadow-[0_20px_44px_-20px_rgba(23,35,59,0.5)]">
      <div className="flex items-center justify-between">
        <p className="font-display text-lg font-bold">{packageInfo.name} Membership</p>
        <span className="rounded-full bg-turquoise/20 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-turquoise">
          Active
        </span>
      </div>

      <div className="mt-4 flex items-end gap-2">
        <span className="font-display text-3xl font-extrabold leading-none">
          {creditsRemaining} of {subscription.consultation_credit_limit}
        </span>
      </div>
      <p className="text-xs text-white/70">Consultation Credits Remaining</p>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
        <div
          className="h-full rounded-full bg-turquoise transition-all"
          style={{
            width: `${(creditsRemaining / Math.max(subscription.consultation_credit_limit, 1)) * 100}%`,
          }}
        />
      </div>

      <div className="mt-4 rounded-xl bg-white/10 p-3">
        <p className="text-[0.65rem] font-bold uppercase tracking-wide text-white/60">
          Next Consultation
        </p>
        {upcoming ? (
          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-sm font-semibold">
              <CalendarClock className="h-3.5 w-3.5" />{" "}
              {formatAppointment(upcoming.appointment_start)}
            </span>
            {upcoming.google_meet_url && (
              <a
                href={upcoming.google_meet_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-semibold text-turquoise"
              >
                <Video className="h-3 w-3" /> Join
              </a>
            )}
          </div>
        ) : (
          <p className="mt-1 text-sm text-white/80">No upcoming consultation scheduled.</p>
        )}
      </div>

      <div className="mt-4 flex gap-2.5">
        <Button
          asChild
          size="sm"
          className="flex-1 cursor-pointer bg-turquoise text-navy hover:bg-turquoise/90"
        >
          <Link to="/consultations/book">
            <CalendarPlus className="h-3.5 w-3.5" /> Book Consultation
          </Link>
        </Button>
        <Button
          asChild
          size="sm"
          variant="outline"
          className="flex-1 cursor-pointer border-white/40 bg-white/10 text-white hover:bg-white/20"
        >
          <Link to="/consultations">View Membership</Link>
        </Button>
      </div>
    </div>
  );
}

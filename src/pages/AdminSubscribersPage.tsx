import { useEffect, useState } from "react";
import { Loader2, MailCheck, Send } from "lucide-react";

import { Seo } from "@/components/seo/Seo";
import { Reveal } from "@/components/common/Reveal";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/context/AuthContext";
import { packages } from "@/data/packages";
import { getProgramPackageBySlug } from "@/data/programPackages";
import {
  listSubscribers,
  type AdminSubscriber,
  type AdminSubscriberTotals,
} from "@/services/adminSubscribersService";
import { cn } from "@/lib/utils";

/**
 * Display name for a subscriptions.package_id. Composed from the two existing
 * data files rather than a seventh hardcoded slug→name map — there are
 * already several of those across the Edge Functions and they have drifted
 * before. Falls back to the raw slug, which is honest if unlovely.
 */
function planLabel(packageId: string): string {
  return (
    getProgramPackageBySlug(packageId)?.name ??
    packages.find((p) => p.slug === packageId)?.name ??
    packageId
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

/**
 * "How many patients have subscribed?" — the question the doctor asked on his
 * first day of real customers, which the product could not answer.
 *
 * The column that matters most is the one Stripe cannot show: whether a
 * person who paid has ever actually signed in. On 26 Aug a patient paid,
 * could not get in, and it surfaced only because he said so on WhatsApp.
 * A never-signed-in row here is a quiet marker, not an alarm — it means "this
 * person may need a hand", and the row carries the fix.
 */
export default function AdminSubscribersPage() {
  const { resetPasswordForEmail } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscribers, setSubscribers] = useState<AdminSubscriber[]>([]);
  const [totals, setTotals] = useState<AdminSubscriberTotals | null>(null);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    listSubscribers().then((res) => {
      if (cancelled) return;
      if (res.ok) {
        setSubscribers(res.subscribers);
        setTotals(res.totals);
      } else {
        setError(res.error);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * One at a time, deliberately. There is no bulk send: mailing fifty
   * patients should never be one mis-click away.
   */
  async function sendReset(subscriber: AdminSubscriber) {
    if (!subscriber.email) return;
    setSendingTo(subscriber.userId);
    await resetPasswordForEmail(subscriber.email);
    setSendingTo(null);
    setSentTo((prev) => ({ ...prev, [subscriber.userId]: true }));
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-16 sm:px-10 sm:py-20">
      <Seo
        title="Subscribers — Doctor"
        description="Active subscribers and their account status."
        path="/doctor/subscribers"
        noindex
      />

      <Reveal direction="up">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Doctor</p>
        <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
          Subscribers
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
        <div className="mt-8">
          {/* The two numbers he actually asked for. */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Total subscribers
              </p>
              <p className="mt-1 font-display text-3xl font-extrabold text-navy">
                {totals?.totalSubscribers ?? 0}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Never signed in
              </p>
              <p className="mt-1 font-display text-3xl font-extrabold text-navy">
                {totals?.neverSignedIn ?? 0}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Paid, but has never opened their account.
              </p>
            </div>
          </div>

          {subscribers.length === 0 ? (
            <p className="mt-8 rounded-2xl border border-dashed border-border/70 bg-secondary/30 p-6 text-center text-sm text-muted-foreground">
              No active subscribers yet.
            </p>
          ) : (
            <div className="mt-8 space-y-3">
              {subscribers.map((s) => {
                const neverSignedIn = s.lastSignInAt === null;
                return (
                  <div
                    key={s.userId}
                    className={cn(
                      "rounded-2xl border p-4 shadow-sm",
                      // Quiet marker, not an alarm: a soft amber edge and a
                      // tinted ground so a hundred rows stay scannable, with
                      // nothing that reads as "broken".
                      neverSignedIn
                        ? "border-amber-300/70 bg-amber-50/50"
                        : "border-border/70 bg-card",
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-navy">
                          {s.fullName ?? s.email ?? "Member"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{s.email ?? "—"}</p>
                      </div>
                      {neverSignedIn ? (
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
                          Never signed in
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Last signed in {formatDate(s.lastSignInAt)}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        <span className="font-semibold text-navy">{planLabel(s.packageId)}</span>
                      </span>
                      <span>
                        Credits {s.creditsUsed} of {s.creditLimit}
                      </span>
                      <span>Subscribed {formatDate(s.subscribedAt)}</span>
                      <span>
                        {s.hasUpcomingConsultation
                          ? "Consultation booked"
                          : "No consultation booked"}
                      </span>
                    </div>

                    {neverSignedIn && s.email && (
                      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-amber-200/70 pt-3">
                        {sentTo[s.userId] ? (
                          <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-turquoise">
                            <MailCheck className="h-3.5 w-3.5" /> Password link sent to {s.email}
                          </p>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="cursor-pointer"
                              disabled={sendingTo === s.userId}
                              onClick={() => sendReset(s)}
                            >
                              {sendingTo === s.userId ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Send className="h-3.5 w-3.5" />
                              )}
                              Send password link
                            </Button>
                            <p className="text-xs text-muted-foreground">
                              Emails them a link to set a password and get in.
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  CalendarClock,
  CalendarPlus,
  Loader2,
  LogOut,
  Package as PackageIcon,
  PhoneCall,
  Sparkles,
  User as UserIcon,
} from "lucide-react";

import { Seo } from "@/components/seo/Seo";
import { Reveal } from "@/components/common/Reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/context/AuthContext";
import { packages } from "@/data/packages";
import { business } from "@/data/business";
import {
  getMyConsultationRequests,
  getMySubscription,
  getProfile,
  requestConsultation,
  type ConsultationRequest,
  type Subscription,
} from "@/services/membershipService";
import { cn } from "@/lib/utils";

const consultationSchema = z.object({
  consultationType: z.string().min(1, "Please choose a consultation type."),
  preferredDate: z.string().min(1, "Please choose a preferred date."),
  preferredTime: z.string().min(1, "Please choose a preferred time."),
  reason: z
    .string()
    .max(300, "Keep this brief — you can share more during your session.")
    .optional(),
});
type ConsultationValues = z.infer<typeof consultationSchema>;

const statusLabel: Record<ConsultationRequest["status"], string> = {
  pending: "Pending",
  approved: "Approved",
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
};

const statusStyle: Record<ConsultationRequest["status"], string> = {
  pending: "bg-secondary text-primary",
  approved: "bg-turquoise/15 text-turquoise",
  scheduled: "bg-primary/15 text-primary",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

export default function AccountPage() {
  const { user, signOut, configured } = useAuth();
  const [fullName, setFullName] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [requests, setRequests] = useState<ConsultationRequest[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState(false);

  const timeZone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return "Unknown";
    }
  }, []);

  const form = useForm<ConsultationValues>({
    resolver: zodResolver(consultationSchema),
    defaultValues: { consultationType: "", preferredDate: "", preferredTime: "", reason: "" },
  });

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

  const packageInfo = subscription
    ? packages.find((p) => p.slug === subscription.package_id)
    : undefined;
  const creditsRemaining = subscription
    ? Math.max(subscription.consultation_credit_limit - subscription.consultation_credits_used, 0)
    : 0;
  const hasActiveMembership = Boolean(subscription);
  const canRequestConsultation = hasActiveMembership && creditsRemaining > 0;
  const firstName = (fullName ?? user?.email ?? "there").split(" ")[0].split("@")[0];

  async function onSubmitConsultation(values: ConsultationValues) {
    setSubmitting(true);
    setRequestError(null);
    const result = await requestConsultation({
      consultationType: values.consultationType,
      preferredDate: values.preferredDate,
      preferredTime: values.preferredTime,
      timeZone,
      reason: values.reason ?? "",
    });
    setSubmitting(false);
    if (!result.ok) {
      setRequestError(result.error);
      return;
    }
    setRequests((prev) => [result.request, ...prev]);
    setRequestSuccess(true);
    form.reset();
    window.setTimeout(() => {
      setDialogOpen(false);
      setRequestSuccess(false);
    }, 1500);
  }

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
            Membership data isn&apos;t connected yet — set up Supabase to see real membership and
            consultation data here.
          </AlertDescription>
        </Alert>
      )}

      {dataLoading ? (
        <div
          className="mt-10 flex items-center justify-center py-16"
          role="status"
          aria-label="Loading account"
        >
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
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
                          {packageInfo.name} Membership
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

                  {packageInfo.hotline && (
                    <div className="mt-6 rounded-xl border border-turquoise/40 bg-turquoise/10 p-4">
                      <p className="flex items-center gap-2 text-sm font-semibold text-navy">
                        <PhoneCall className="h-4 w-4 text-turquoise" /> VIP Priority Hotline
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Hotline access will appear here once activated.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center">
                  <p className="font-display text-lg font-bold text-navy">
                    Your membership is not currently active
                  </p>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                    Choose a package to unlock consultation credits, priority booking, and member
                    benefits.
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-3">
                    <Link
                      to="/packages"
                      className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-turquoise"
                    >
                      <Sparkles className="h-4 w-4" /> View Memberships
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 rounded-2xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-lg font-bold text-navy">Consultations</h2>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      disabled={!canRequestConsultation}
                      className="cursor-pointer disabled:cursor-not-allowed"
                    >
                      <CalendarPlus className="h-4 w-4" /> Request Consultation
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader>
                      <DialogTitle>Request a Consultation</DialogTitle>
                      <DialogDescription>
                        Uses 1 consultation credit once approved. We&apos;ll confirm your exact time
                        by email or WhatsApp.
                      </DialogDescription>
                    </DialogHeader>
                    {requestSuccess ? (
                      <p className="py-6 text-center text-sm font-medium text-turquoise">
                        Request sent — you&apos;ll see it below as Pending.
                      </p>
                    ) : (
                      <Form {...form}>
                        <form
                          onSubmit={form.handleSubmit(onSubmitConsultation)}
                          className="space-y-4"
                          noValidate
                        >
                          <FormField
                            control={form.control}
                            name="consultationType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Consultation type</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Monthly follow-up" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <FormField
                              control={form.control}
                              name="preferredDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Preferred date</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="date"
                                      min={new Date().toISOString().slice(0, 10)}
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="preferredTime"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Preferred time</FormLabel>
                                  <FormControl>
                                    <Input type="time" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">Time zone: {timeZone}</p>
                          <FormField
                            control={form.control}
                            name="reason"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>General reason (optional)</FormLabel>
                                <FormControl>
                                  <Textarea
                                    rows={3}
                                    placeholder="e.g., monthly check-in, plan adjustment…"
                                    {...field}
                                  />
                                </FormControl>
                                <p className="text-xs text-muted-foreground">
                                  Please keep this general — no detailed medical history here.
                                </p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          {requestError && (
                            <Alert variant="destructive" role="alert">
                              <AlertDescription>{requestError}</AlertDescription>
                            </Alert>
                          )}
                          <Button
                            type="submit"
                            disabled={submitting}
                            className="w-full cursor-pointer justify-center"
                          >
                            {submitting ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                              </>
                            ) : (
                              "Send Request"
                            )}
                          </Button>
                        </form>
                      </Form>
                    )}
                  </DialogContent>
                </Dialog>
              </div>

              {!hasActiveMembership && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Requesting a consultation requires an active membership.
                </p>
              )}
              {hasActiveMembership && creditsRemaining === 0 && (
                <p className="mt-3 text-xs text-muted-foreground">
                  You have no consultation credits remaining in your current membership.{" "}
                  <Link to="/packages" className="font-semibold text-primary hover:text-turquoise">
                    Upgrade Membership
                  </Link>
                </p>
              )}

              <div className="mt-5">
                {requests.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border/70 bg-secondary/30 p-5 text-center text-sm text-muted-foreground">
                    No appointments yet.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {requests.map((req) => (
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
                            {req.preferred_date ?? "—"}{" "}
                            {req.preferred_time ? `· ${req.preferred_time}` : ""}
                            {req.time_zone ? ` (${req.time_zone})` : ""}
                          </p>
                          {req.google_meet_link && (
                            <a
                              href={req.google_meet_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 inline-block text-xs font-semibold text-primary hover:text-turquoise"
                            >
                              Join Google Meet
                            </a>
                          )}
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
                    {packageInfo ? `${packageInfo.name} Membership` : "No active membership"}
                  </dd>
                </div>
                {subscription?.current_period_end && (
                  <div className="flex items-center gap-2.5">
                    <span className="h-4 w-4 shrink-0" />
                    <dd className="text-navy">
                      Renews {new Date(subscription.current_period_end).toLocaleDateString()}
                    </dd>
                  </div>
                )}
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
                  Upgrade / Manage Membership
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
              Your account is used for identity, membership, booking, and saved products only.
              Please don&apos;t share diagnoses, lab reports, or medication details here — that
              information stays with your consultation with {business.doctorName}.
            </p>
          </Reveal>
        </div>
      )}
    </div>
  );
}

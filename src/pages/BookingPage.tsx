import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Globe2,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";

import { Seo } from "@/components/seo/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { SchedulerEmbed } from "@/components/booking/SchedulerEmbed";
import { packages, type PackageTier } from "@/data/packages";
import { schedulingRules, type PackageSlug } from "@/config/booking";
import { whatsappLink } from "@/config/contact";
import { cn } from "@/lib/utils";

const STEPS = ["Package", "Your Details", "Review", "Schedule"] as const;

const detailsSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name."),
  email: z.string().trim().email("Please enter a valid email address."),
  phone: z
    .string()
    .trim()
    .min(7, "Please enter a valid phone number.")
    .regex(/^[+()\-\s\d]+$/, "Please enter a valid phone number."),
  goal: z
    .string()
    .trim()
    .max(300, "Keep this brief — you can share more detail during your session.")
    .optional(),
});

type DetailsValues = z.infer<typeof detailsSchema>;

function isPackageSlug(value: string | null): value is PackageSlug {
  return value === "basic" || value === "premium" || value === "vip-elite";
}

export default function BookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialPackage = searchParams.get("package");
  const initialService = searchParams.get("service");

  const [step, setStep] = useState(0);
  const [selectedSlug, setSelectedSlug] = useState<PackageSlug | undefined>(
    isPackageSlug(initialPackage) ? initialPackage : undefined,
  );
  const [details, setDetails] = useState<DetailsValues | null>(null);

  const timeZone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return "Unknown";
    }
  }, []);

  const form = useForm<DetailsValues>({
    resolver: zodResolver(detailsSchema),
    defaultValues: { name: "", email: "", phone: "", goal: "" },
  });

  const selectedPackage: PackageTier | undefined = packages.find(
    (pkg) => pkg.slug === selectedSlug,
  );
  const rule = selectedSlug ? schedulingRules[selectedSlug] : undefined;

  function goTo(nextStep: number) {
    setStep(Math.min(Math.max(nextStep, 0), STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function onSubmitDetails(values: DetailsValues) {
    setDetails(values);
    goTo(2);
  }

  const shareMessage = useMemo(() => {
    if (!details || !selectedPackage) return "";
    return [
      "Hello, I'd like to schedule an online consultation.",
      `Package: ${selectedPackage.name} (${selectedPackage.priceLabel})`,
      `Name: ${details.name}`,
      `Email: ${details.email}`,
      `Phone: ${details.phone}`,
      `Time zone: ${timeZone}`,
      details.goal ? `Goal: ${details.goal}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }, [details, selectedPackage, timeZone]);

  const shareHref = whatsappLink(shareMessage);

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16 sm:px-10 sm:py-20">
      <Seo
        title="Book an Online Consultation"
        description="Schedule your online nutrition consultation with Monzer Allan via Google Meet."
        path="/booking"
        noindex
      />

      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Booking</p>
        <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
          Schedule Your Online Consultation
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {initialService
            ? "Confirm a plan below, then pick a time that works for you."
            : "Confirm your plan, share a few details, then pick a time that works for you."}
        </p>
      </div>

      <div className="mx-auto mt-10 flex max-w-md items-center gap-2" aria-hidden="true">
        {STEPS.map((label, index) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                index <= step
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {index < step ? <Check className="h-3.5 w-3.5" /> : index + 1}
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 rounded-full transition-colors",
                  index < step ? "bg-primary" : "bg-muted",
                )}
              />
            )}
          </div>
        ))}
      </div>
      <p className="mt-2 text-center text-xs font-medium text-muted-foreground">{STEPS[step]}</p>

      <div className="mt-10">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step-package"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {packages.map((pkg) => (
                  <button
                    key={pkg.slug}
                    type="button"
                    onClick={() => setSelectedSlug(pkg.slug)}
                    className={cn(
                      "flex cursor-pointer flex-col items-start gap-2 rounded-2xl border p-5 text-left transition-all hover:-translate-y-1 hover:border-turquoise/60",
                      selectedSlug === pkg.slug
                        ? "border-primary bg-secondary/50 shadow-md"
                        : "border-border/70 bg-card",
                    )}
                  >
                    {pkg.badge && (
                      <span className="rounded-full bg-turquoise/20 px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-primary">
                        {pkg.badge}
                      </span>
                    )}
                    <span className="font-display text-lg font-bold text-navy">{pkg.name}</span>
                    <span className="font-display text-xl font-extrabold text-primary">
                      {pkg.priceLabel}
                    </span>
                    <span className="text-xs leading-relaxed text-muted-foreground">
                      {pkg.tagline}
                    </span>
                    <span className="mt-1 flex items-center gap-1.5 text-xs font-medium text-navy/70">
                      <Clock className="h-3.5 w-3.5" /> {schedulingRules[pkg.slug].minNoticeLabel}
                    </span>
                  </button>
                ))}
              </div>
              <div className="mt-6 flex justify-end">
                <Button
                  type="button"
                  className="cursor-pointer"
                  disabled={!selectedSlug}
                  onClick={() => goTo(1)}
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step-details"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm sm:p-8"
            >
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmitDetails)}
                  className="space-y-5"
                  noValidate
                >
                  <div className="grid gap-5 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full name</FormLabel>
                          <FormControl>
                            <Input placeholder="Jane Doe" autoComplete="name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="+1 555 123 4567" autoComplete="tel" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="jane@email.com"
                            autoComplete="email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-navy">
                      <Globe2 className="h-4 w-4 text-primary" /> Your time zone
                    </p>
                    <p className="rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm text-navy/80">
                      {timeZone}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Detected automatically from your browser — the scheduler will use this too.
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="goal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>General consultation goal (optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={3}
                            placeholder="e.g., weight management, more energy, better lab numbers…"
                            {...field}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          Please keep this general — save specific medical history, medications, or
                          lab results for your consultation itself.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <p className="text-xs text-muted-foreground">
                    See our{" "}
                    <Link
                      to="/privacy-policy"
                      className="font-semibold text-primary hover:text-turquoise"
                    >
                      Privacy Policy
                    </Link>{" "}
                    and{" "}
                    <Link
                      to="/medical-disclaimer"
                      className="font-semibold text-primary hover:text-turquoise"
                    >
                      Medical Disclaimer
                    </Link>
                    .
                  </p>

                  <div className="flex items-center justify-between gap-3 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      className="cursor-pointer"
                      onClick={() => goTo(0)}
                    >
                      <ChevronLeft className="h-4 w-4" /> Back
                    </Button>
                    <Button type="submit" className="cursor-pointer" disabled={!selectedSlug}>
                      Next <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  {!selectedSlug && (
                    <p className="text-right text-xs font-medium text-destructive">
                      Please choose a package first.
                    </p>
                  )}
                </form>
              </Form>
            </motion.div>
          )}

          {step === 2 && details && selectedPackage && rule && (
            <motion.div
              key="step-review"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm sm:p-8"
            >
              <h2 className="font-display text-lg font-bold text-navy">Review Your Booking</h2>
              <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Package
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-navy">
                    {selectedPackage.name} — {selectedPackage.priceLabel}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Booking rule
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-navy">{rule.minNoticeLabel}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Name
                  </dt>
                  <dd className="mt-1 text-sm text-navy">{details.name}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Email
                  </dt>
                  <dd className="mt-1 text-sm text-navy">{details.email}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Phone
                  </dt>
                  <dd className="mt-1 text-sm text-navy">{details.phone}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Time zone
                  </dt>
                  <dd className="mt-1 text-sm text-navy">{timeZone}</dd>
                </div>
                {details.goal && (
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Goal
                    </dt>
                    <dd className="mt-1 text-sm text-navy">{details.goal}</dd>
                  </div>
                )}
              </dl>

              <div className="mt-6 flex items-start gap-2 rounded-xl border border-border/60 bg-secondary/40 p-4">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  These details are kept only in this session and are not stored or sent anywhere
                  unless you choose to share them via WhatsApp below. Your exact date and time are
                  selected in the next step's live scheduler.
                </p>
              </div>

              {shareHref && (
                <a
                  href={shareHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-navy transition-colors hover:border-turquoise hover:text-turquoise"
                >
                  <MessageCircle className="h-4 w-4" /> Share these details via WhatsApp (optional)
                </a>
              )}

              <div className="mt-6 flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  className="cursor-pointer"
                  onClick={() => goTo(1)}
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </Button>
                <Button type="button" className="cursor-pointer" onClick={() => goTo(3)}>
                  Continue to Scheduler <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && selectedSlug && (
            <motion.div
              key="step-schedule"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              <div className="rounded-xl border border-border/60 bg-secondary/40 p-4 text-xs leading-relaxed text-muted-foreground">
                Pick a time in the scheduler below — availability shown is live from Google Calendar
                and subject to change until your booking is complete. Your session will take place
                over Google Meet; details are sent to your email by Google once you finish booking
                there.
              </div>

              <SchedulerEmbed packageSlug={selectedSlug} />

              <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
                <p className="text-sm font-semibold text-navy">
                  Finished booking in the scheduler above?
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Once you've selected a time and completed Google's booking form, tap below — we
                  can't detect Google's confirmation automatically, so this simply takes you to your
                  next steps.
                </p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    className="cursor-pointer"
                    onClick={() => goTo(2)}
                  >
                    <ChevronLeft className="h-4 w-4" /> Back
                  </Button>
                  <Button
                    type="button"
                    className="cursor-pointer"
                    onClick={() =>
                      navigate("/booking/success", {
                        state: { packageSlug: selectedSlug, timeZone },
                      })
                    }
                  >
                    I've Completed My Booking <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, Loader2, Lock, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";

import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  programPackageDisclaimer,
  purchasableProgramPackages,
  type ProgramPackage,
} from "@/data/programPackages";
import { isSupabaseConfigured } from "@/lib/supabase";
import { startProgramPackageCheckout } from "@/services/checkoutService";
import { openExternal } from "@/lib/externalLink";
import { whatsappLink } from "@/config/contact";
import { cn } from "@/lib/utils";

const purchaseSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name."),
  email: z.string().trim().email("Please enter a valid email address."),
  // Required, and validated for shape rather than just presence. Deliberately
  // permissive about FORMAT — international numbers vary far too much to
  // pattern-match safely, and rejecting a real number is worse than accepting
  // an odd one. What it does enforce: only characters a phone number can
  // contain, and enough digits to be dialable.
  phone: z
    .string()
    .trim()
    .min(7, "Please enter a phone number we can reach you on.")
    .max(32, "That phone number looks too long.")
    .regex(/^[0-9+\-\s()]+$/, "Use digits, spaces, and + ( ) - only.")
    .refine((v) => (v.match(/\d/g) ?? []).length >= 7, {
      message: "Please include the full number, with country code if you're outside the UAE.",
    }),
});

type PurchaseValues = z.infer<typeof purchaseSchema>;

export function ProgramPackages({ hideHeading = false }: { hideHeading?: boolean }) {
  const [activePackage, setActivePackage] = useState<ProgramPackage | null>(null);

  return (
    <section
      id="program-packages"
      className="relative py-20 sm:py-28"
      aria-labelledby="program-packages-heading"
    >
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-10">
        {!hideHeading && (
          <SectionHeading
            eyebrow="Programs"
            title="Choose Your Path Forward"
            description="A treatment program with close medical follow-up — pick the level of consultation support you need, with no recurring billing."
          />
        )}

        {/* Phase 7 withdrew the Diet programs from sale, leaving one category.
            A tab strip with a single tab is visibly broken, so the tabs are
            gone and the purchasable packages render directly. If a second
            category is ever sold again, restore a strip here — the data layer
            still models types, and purchasableProgramTypes() reports them. */}
        <div className={hideHeading ? "" : "mt-14"}>
          <div>
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {purchasableProgramPackages.map((pkg, index) => (
                <Reveal key={pkg.slug} direction="up" delay={index * 0.08} className="h-full">
                  <div
                    className={cn(
                      "relative flex h-full flex-col rounded-2xl border p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5",
                      pkg.popular
                        ? "border-primary bg-navy text-white shadow-[0_30px_60px_-24px_rgba(37,63,164,0.55)]"
                        : "border-border/70 bg-card hover:border-turquoise/50 hover:shadow-[0_24px_50px_-24px_rgba(23,35,59,0.3)]",
                    )}
                  >
                    {pkg.popular && (
                      <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-turquoise px-3 py-1 text-xs font-bold uppercase tracking-wide text-navy shadow-md">
                        <Sparkles className="h-3 w-3" />
                        Most Popular
                      </span>
                    )}

                    <h3
                      className={cn(
                        "font-display text-xl font-bold",
                        pkg.popular ? "text-white" : "text-navy",
                      )}
                    >
                      {pkg.name}
                    </h3>
                    <p
                      className={cn(
                        "mt-1 text-sm",
                        pkg.popular ? "text-white/70" : "text-muted-foreground",
                      )}
                    >
                      {pkg.tagline}
                    </p>

                    <div className="mt-5 flex items-baseline gap-2">
                      <span
                        className={cn(
                          "font-display text-3xl font-extrabold",
                          pkg.popular ? "text-white" : "text-navy",
                        )}
                      >
                        {pkg.priceLabel}
                      </span>
                      <span
                        className={cn(
                          "text-sm",
                          pkg.popular ? "text-white/60" : "text-muted-foreground",
                        )}
                      >
                        one-time
                      </span>
                    </div>

                    <span
                      className={cn(
                        "mt-3 inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
                        pkg.popular ? "bg-white/15 text-white" : "bg-secondary text-primary",
                      )}
                    >
                      {pkg.consultationCount} Consultations
                    </span>

                    <ul className="mt-6 flex-1 space-y-2.5">
                      {pkg.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-turquoise" />
                          <span className={pkg.popular ? "text-white/85" : "text-navy/80"}>
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      type="button"
                      onClick={() => setActivePackage(pkg)}
                      className={cn(
                        "mt-7 w-full cursor-pointer justify-center",
                        pkg.popular && "bg-turquoise text-navy hover:bg-turquoise/90",
                      )}
                    >
                      {pkg.cta}
                    </Button>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>

        <Reveal direction="up" delay={0.2} className="mt-10">
          <p className="mx-auto max-w-3xl rounded-xl border border-border/70 bg-secondary/40 p-4 text-center text-xs leading-relaxed text-muted-foreground">
            {programPackageDisclaimer}
          </p>
        </Reveal>
      </div>

      <PurchaseDialog
        pkg={activePackage}
        onOpenChange={(open) => !open && setActivePackage(null)}
      />
    </section>
  );
}

function PurchaseDialog({
  pkg,
  onOpenChange,
}: {
  pkg: ProgramPackage | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutUnavailable, setCheckoutUnavailable] = useState(false);

  const form = useForm<PurchaseValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: { fullName: "", email: "", phone: "" },
  });

  async function onSubmit(values: PurchaseValues) {
    if (!pkg) return;
    setSubmitting(true);
    setError(null);
    setCheckoutUnavailable(false);

    const result = await startProgramPackageCheckout({
      fullName: values.fullName,
      email: values.email,
      phone: values.phone,
      packageId: pkg.slug,
    });

    if (!result.ok) {
      setSubmitting(false);
      setCheckoutUnavailable(true);
      setError(result.error);
      return;
    }

    await openExternal(result.url);
  }

  const waHref = pkg
    ? whatsappLink(
        `Hello, I'd like to start the ${pkg.name} program (${pkg.priceLabel}). Could you help me complete payment?`,
      )
    : undefined;

  return (
    <Dialog
      open={Boolean(pkg)}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) {
          form.reset();
          setError(null);
          setCheckoutUnavailable(false);
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{pkg?.name}</DialogTitle>
          <DialogDescription>
            {pkg?.priceLabel} one-time · {pkg?.consultationCount} consultations
          </DialogDescription>
        </DialogHeader>

        {!isSupabaseConfigured && (
          <Alert className="border-amber-300 bg-amber-50 text-amber-900">
            <AlertDescription>
              Checkout isn&apos;t connected yet. Please check back soon, or contact us directly.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full name</FormLabel>
                  <FormControl>
                    <Input autoComplete="name" placeholder="Jane Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder="jane@email.com"
                      {...field}
                    />
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
                  <FormLabel>Phone number</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      autoComplete="tel"
                      placeholder="+971 50 123 4567"
                      {...field}
                    />
                  </FormControl>
                  {/* Say why we want it. A required field with no reason given
                      reads as data harvesting; this one has a use the buyer
                      actually benefits from. */}
                  <p className="text-xs text-muted-foreground">
                    So Dr. Monzer Allan can reach you about your program.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <Alert variant="destructive" role="alert">
                <AlertDescription>
                  {error}
                  {checkoutUnavailable && waHref && (
                    <div className="mt-3">
                      <a
                        href={waHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-turquoise"
                      >
                        <MessageCircle className="h-3.5 w-3.5" /> Continue via WhatsApp
                      </a>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={submitting || !isSupabaseConfigured}
              className="w-full cursor-pointer justify-center"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Redirecting to secure payment…
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" /> Continue to Secure Payment
                </>
              )}
            </Button>

            <p className="flex items-start gap-1.5 text-[0.7rem] leading-relaxed text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              Payment is handled securely by Stripe. We never see or store your card details.
            </p>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

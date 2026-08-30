import { useState, useMemo } from "react";
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
import { useTranslate, PACKAGE_LABELS, packageFeatures, type TranslateFn } from "@/i18n";

/**
 * Built from `t` rather than declared at module scope, because these messages
 * are shown to the buyer. A module-level schema is evaluated once, before any
 * locale exists, which is why every validation error on this form used to
 * appear in English on an Arabic page — including on the phone field, which is
 * the one most likely to be rejected.
 *
 * The RULES are unchanged: permissive about international formats, because
 * rejecting a real number is worse than accepting an odd one.
 */
function buildPurchaseSchema(t: TranslateFn) {
  return z.object({
    fullName: z.string().trim().min(2, t("purchase.errName")),
    email: z.string().trim().email(t("purchase.errEmail")),
    phone: z
      .string()
      .trim()
      .min(7, t("purchase.errPhoneChars"))
      .max(32, t("purchase.errPhoneLong"))
      .regex(/^[0-9+\-\s()]+$/, t("purchase.errPhoneChars2"))
      .refine((v) => (v.match(/\d/g) ?? []).length >= 7, {
        message: t("purchase.errPhoneDigits"),
      }),
  });
}

type PurchaseValues = z.infer<ReturnType<typeof buildPurchaseSchema>>;

export function ProgramPackages({ hideHeading = false }: { hideHeading?: boolean }) {
  const t = useTranslate();
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
            eyebrow={t("programs.eyebrow")}
            title={t("programs.title")}
            description={t("programs.description")}
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
                      <span className="absolute -top-3 start-6 inline-flex items-center gap-1 rounded-full bg-turquoise px-3 py-1 text-xs font-bold uppercase tracking-wide text-navy shadow-md">
                        <Sparkles className="h-3 w-3" />
                        {t("packages.mostPopular")}
                      </span>
                    )}

                    <h3
                      className={cn(
                        "font-display text-xl font-bold",
                        pkg.popular ? "text-white" : "text-navy",
                      )}
                    >
                      {t(PACKAGE_LABELS[pkg.slug].name)}
                    </h3>
                    <p
                      className={cn(
                        "mt-1 text-sm",
                        pkg.popular ? "text-white/70" : "text-muted-foreground",
                      )}
                    >
                      {t(PACKAGE_LABELS[pkg.slug].tagline)}
                    </p>

                    <div className="mt-5 flex items-baseline gap-2">
                      {/* <s> means "no longer accurate", which is exactly what
                          a superseded price is. NOT <del> (that means removed
                          from a document) and not a CSS line-through on a
                          plain span, which most screen readers announce as an
                          ordinary number — i.e. as the amount being charged.

                          <s> alone is announced inconsistently across screen
                          readers, so the visually-hidden labels carry the
                          meaning rather than relying on the element. */}
                      {pkg.previousPrice !== undefined && (
                        <span className="flex items-baseline gap-2">
                          <span className="sr-only">{t("packages.previousPrice")}</span>
                          <s
                            className={cn(
                              "font-display text-xl font-semibold",
                              pkg.popular ? "text-white/50" : "text-muted-foreground",
                            )}
                          >
                            ${pkg.previousPrice}
                          </s>
                          <span className="sr-only">{t("packages.currentPrice")}</span>
                        </span>
                      )}
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
                        {t("packages.oneTime")}
                      </span>
                    </div>

                    <span
                      className={cn(
                        "mt-3 inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
                        pkg.popular ? "bg-white/15 text-white" : "bg-secondary text-primary",
                      )}
                    >
                      {t("packages.consultationCount", { count: pkg.consultationCount })}
                    </span>

                    <ul className="mt-6 flex-1 space-y-2.5">
                      {packageFeatures(pkg, t).map((feature) => (
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
                      {t("pkg.cta.startProgram")}
                    </Button>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10">
          <p className="mx-auto max-w-3xl rounded-xl border border-border/70 bg-secondary/40 p-4 text-center text-xs leading-relaxed text-muted-foreground">
            {t("packages.legalNote")}
          </p>
        </div>
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
  const t = useTranslate();
  // Rebuilt when the language changes so a message already on screen is not
  // left in the previous language.
  const purchaseSchema = useMemo(() => buildPurchaseSchema(t), [t]);
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
          <DialogTitle>{pkg ? t(PACKAGE_LABELS[pkg.slug].name) : ""}</DialogTitle>
          <DialogDescription>
            {t("packages.dialogSummary", {
              price: pkg?.priceLabel ?? "",
              consultations: t("packages.consultationCount", {
                count: pkg?.consultationCount ?? 0,
              }),
            })}
          </DialogDescription>
        </DialogHeader>

        {!isSupabaseConfigured && (
          <Alert className="border-amber-300 bg-amber-50 text-amber-900">
            <AlertDescription>{t("purchase.unavailable")}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("purchase.fullName")}</FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="name"
                      placeholder={t("purchase.namePlaceholder")}
                      {...field}
                    />
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
                  <FormLabel>{t("purchase.email")}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder={t("purchase.emailPlaceholder")}
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
                  <FormLabel>{t("purchase.phone")}</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      autoComplete="tel"
                      placeholder={t("purchase.phonePlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  {/* Say why we want it. A required field with no reason given
                      reads as data harvesting; this one has a use the buyer
                      actually benefits from. */}
                  <p className="text-xs text-muted-foreground">{t("purchase.phoneReason")}</p>
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
                        <MessageCircle className="h-3.5 w-3.5" /> {t("purchase.viaWhatsapp")}
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
                  <Loader2 className="h-4 w-4 animate-spin" /> {t("purchase.submitting")}
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" /> {t("purchase.submit")}
                </>
              )}
            </Button>

            <p className="flex items-start gap-1.5 text-[0.7rem] leading-relaxed text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              {t("purchase.stripeNote")}
            </p>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Lock, MessageCircle, ShieldCheck } from "lucide-react";

import { Seo } from "@/components/seo/Seo";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/context/AuthContext";
import { packages, type PackageTier } from "@/data/packages";
import { isSupabaseConfigured } from "@/lib/supabase";
import { startMembershipCheckout } from "@/services/checkoutService";
import { whatsappLink } from "@/config/contact";
import { cn } from "@/lib/utils";

const CONTACT_METHODS = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
  { value: "either", label: "Either" },
] as const;

const joinSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name."),
  email: z.string().trim().email("Please enter a valid email address."),
  phone: z
    .string()
    .trim()
    .min(7, "Please enter a valid phone number.")
    .regex(/^[+()\-\s\d]+$/, "Please enter a valid phone number."),
  preferredContactMethod: z.enum(["whatsapp", "email", "either"]),
  agree: z.literal(true, {
    errorMap: () => ({ message: "Please agree to the Terms and Privacy Policy." }),
  }),
});

type JoinValues = z.infer<typeof joinSchema>;

export default function JoinPage() {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const [selectedSlug, setSelectedSlug] = useState(searchParams.get("package") ?? "premium");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutUnavailable, setCheckoutUnavailable] = useState(false);

  const form = useForm<JoinValues>({
    resolver: zodResolver(joinSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      preferredContactMethod: "either",
      agree: undefined,
    },
  });

  if (!loading && user) {
    return <Navigate to="/account" replace />;
  }

  const selectedPackage = packages.find((pkg) => pkg.slug === selectedSlug) ?? packages[1];
  const waHref = whatsappLink(
    `Hello, I'd like to join the ${selectedPackage.name} membership at ${selectedPackage.priceLabel}. Could you help me complete payment and set up my account?`,
  );

  async function onSubmit(values: JoinValues) {
    setSubmitting(true);
    setError(null);
    setCheckoutUnavailable(false);

    const result = await startMembershipCheckout({
      fullName: values.fullName,
      email: values.email,
      phone: values.phone,
      preferredContactMethod: values.preferredContactMethod,
      packageId: selectedPackage.slug,
    });

    if (!result.ok) {
      setSubmitting(false);
      setCheckoutUnavailable(true);
      setError(result.error);
      return;
    }

    // Hand off to Stripe's hosted Checkout page — the account is only
    // created/activated after a verified webhook confirms payment.
    window.location.href = result.url;
  }

  return (
    <AuthLayout
      title="Join as a Member"
      subtitle="Membership starts with choosing a package. You'll complete secure payment next, and your account activates once payment is confirmed."
      footer={
        <>
          Already a member?{" "}
          <Link to="/login" className="font-semibold text-primary hover:text-turquoise">
            Sign In
          </Link>
        </>
      }
    >
      <Seo
        title="Join a Membership"
        description="Choose a Monzer Allan nutrition membership package and start secure checkout."
        path="/join"
        noindex
      />

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Selected package
        </p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {packages.map((pkg) => (
            <button
              key={pkg.slug}
              type="button"
              onClick={() => setSelectedSlug(pkg.slug)}
              className={cn(
                "cursor-pointer rounded-xl border px-2 py-3 text-center text-xs font-semibold transition-colors",
                selectedSlug === pkg.slug
                  ? "border-primary bg-secondary/60 text-primary"
                  : "border-border text-navy/70 hover:border-turquoise",
              )}
            >
              {pkg.name}
              <span className="mt-1 block text-[0.65rem] font-normal text-muted-foreground">
                {pkg.priceLabel}
              </span>
            </button>
          ))}
        </div>
        <PackageSummary pkg={selectedPackage} />
      </div>

      {!isSupabaseConfigured && (
        <Alert className="mt-5 border-amber-300 bg-amber-50 text-amber-900">
          <AlertDescription>
            Member account creation isn&apos;t connected yet. Please check back soon, or contact us
            directly.
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-5" noValidate>
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
          <div className="grid gap-5 sm:grid-cols-2">
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
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input type="tel" autoComplete="tel" placeholder="+1 555 123 4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="preferredContactMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred contact method</FormLabel>
                <div className="grid grid-cols-3 gap-2">
                  {CONTACT_METHODS.map((method) => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => field.onChange(method.value)}
                      className={cn(
                        "cursor-pointer rounded-lg border px-2 py-2 text-xs font-semibold transition-colors",
                        field.value === method.value
                          ? "border-primary bg-secondary/60 text-primary"
                          : "border-border text-navy/70 hover:border-turquoise",
                      )}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  How should we follow up if we need to reach you about your membership?
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="agree"
            render={({ field }) => (
              <FormItem>
                <label className="flex cursor-pointer items-start gap-2.5 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={field.value === true}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <span>
                    I agree to the{" "}
                    <Link to="/terms" className="font-semibold text-primary hover:text-turquoise">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      to="/privacy-policy"
                      className="font-semibold text-primary hover:text-turquoise"
                    >
                      Privacy Policy
                    </Link>
                    , and consent to being contacted about my membership.
                  </span>
                </label>
                <FormMessage />
              </FormItem>
            )}
          />

          {error && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>
                {error}
                {checkoutUnavailable && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {waHref && (
                      <a
                        href={waHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-turquoise"
                      >
                        <MessageCircle className="h-3.5 w-3.5" /> Continue via WhatsApp
                      </a>
                    )}
                    <Link
                      to="/contact"
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold text-navy hover:border-turquoise"
                    >
                      Contact Page
                    </Link>
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
            Payment is handled securely by Stripe. We never see or store your card details. Your
            account activates automatically once payment is confirmed, and you&apos;ll receive an
            email to set your password.
          </p>
        </form>
      </Form>
    </AuthLayout>
  );
}

function PackageSummary({ pkg }: { pkg: PackageTier }) {
  return (
    <div className="mt-3 rounded-xl border border-border/70 bg-secondary/40 p-3 text-xs text-navy/80">
      <div className="flex items-baseline gap-2">
        <span className="text-muted-foreground line-through">${pkg.originalPrice}</span>
        <span className="font-display text-base font-extrabold text-primary">{pkg.priceLabel}</span>
      </div>
      <p className="mt-1">
        {pkg.consultationCredits} consultation{" "}
        {pkg.consultationCredits === 1 ? "credit" : "credits"} per month
        {pkg.hotline ? " · Priority Hotline included" : ""}
      </p>
    </div>
  );
}

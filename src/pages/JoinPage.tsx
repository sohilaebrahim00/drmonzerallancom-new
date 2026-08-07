import { useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, CreditCard, Loader2, MessageCircle, UserPlus } from "lucide-react";

import { Seo } from "@/components/seo/Seo";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { PasswordField } from "@/components/auth/PasswordField";
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
import { getCheckoutHref, isExternalCheckout } from "@/config/commerce";
import { whatsappLink } from "@/config/contact";
import { cn } from "@/lib/utils";

const joinSchema = z
  .object({
    fullName: z.string().trim().min(2, "Please enter your full name."),
    email: z.string().trim().email("Please enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string(),
    agree: z.literal(true, {
      errorMap: () => ({ message: "Please agree to the Terms and Privacy Policy." }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type JoinValues = z.infer<typeof joinSchema>;

export default function JoinPage() {
  const { user, loading, configured, signUp } = useAuth();
  const [searchParams] = useSearchParams();
  const [selectedSlug, setSelectedSlug] = useState(searchParams.get("package") ?? "premium");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountCreated, setAccountCreated] = useState(false);

  const form = useForm<JoinValues>({
    resolver: zodResolver(joinSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "", agree: undefined },
  });

  if (!loading && user) {
    return <Navigate to="/account" replace />;
  }

  const selectedPackage = packages.find((pkg) => pkg.slug === selectedSlug) ?? packages[1];
  const checkoutHref = getCheckoutHref(selectedPackage.stripePaymentLink, "");
  const hasCheckout = isExternalCheckout(selectedPackage.stripePaymentLink);
  const waHref = whatsappLink(
    `Hello, I'd like to join the ${selectedPackage.name} membership at ${selectedPackage.priceLabel}. Could you help me complete payment and set up my account?`,
  );

  async function onSubmit(values: JoinValues) {
    setSubmitting(true);
    setError(null);
    const { error: signUpError } = await signUp(values.email, values.password, values.fullName);
    setSubmitting(false);
    if (signUpError) {
      setError(signUpError);
      return;
    }
    setAccountCreated(true);
  }

  return (
    <AuthLayout
      title="Join as a Member"
      subtitle="Membership starts with choosing a package — your account activates once payment is confirmed."
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
        title="Create a Member Account"
        description="Join a Monzer Allan nutrition membership package."
        path="/join"
        noindex
      />

      {accountCreated ? (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-turquoise/15 text-turquoise">
            <Check className="h-7 w-7" />
          </div>
          <h2 className="font-display text-lg font-bold text-navy">Login created</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {form.getValues("email").includes("@")
              ? "Check your inbox to confirm your email if prompted. "
              : ""}
            Your login is ready — now complete payment for the {selectedPackage.name} package below
            to activate your membership. Your account will show as active as soon as payment is
            confirmed.
          </p>
          {hasCheckout ? (
            <a
              href={checkoutHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-turquoise"
            >
              <CreditCard className="h-4 w-4" /> Complete Payment
            </a>
          ) : waHref ? (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-turquoise"
            >
              <MessageCircle className="h-4 w-4" /> Complete Payment via WhatsApp
            </a>
          ) : (
            <p className="text-xs text-muted-foreground">
              Payment isn&apos;t connected yet — please reach out via the{" "}
              <Link to="/contact" className="font-semibold text-primary hover:text-turquoise">
                Contact page
              </Link>{" "}
              to complete your membership.
            </p>
          )}
          <Link to="/account" className="text-xs font-medium text-muted-foreground hover:text-navy">
            Go to my account
          </Link>
        </div>
      ) : (
        <>
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

          {!configured && (
            <Alert className="mt-5 border-amber-300 bg-amber-50 text-amber-900">
              <AlertDescription>
                Member account creation isn&apos;t connected yet. Please check back soon, or contact
                us directly.
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
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <PasswordField autoComplete="new-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm password</FormLabel>
                      <FormControl>
                        <PasswordField autoComplete="new-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                        <Link
                          to="/terms"
                          className="font-semibold text-primary hover:text-turquoise"
                        >
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link
                          to="/privacy-policy"
                          className="font-semibold text-primary hover:text-turquoise"
                        >
                          Privacy Policy
                        </Link>
                        .
                      </span>
                    </label>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <Alert variant="destructive" role="alert">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={submitting || !configured}
                className="w-full cursor-pointer justify-center"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Creating account…
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" /> Create Account &amp; Continue to Payment
                  </>
                )}
              </Button>
            </form>
          </Form>
        </>
      )}
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

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Loader2, Mail, UserRound } from "lucide-react";

import { Seo } from "@/components/seo/Seo";
import { Reveal } from "@/components/common/Reveal";
import { useAuth } from "@/context/AuthContext";
import { getMySubscription, type Subscription } from "@/services/membershipService";

export default function MembershipSuccessPage() {
  const { user } = useAuth();
  const [checking, setChecking] = useState(Boolean(user));
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getMySubscription().then((sub) => {
      if (!cancelled) {
        setSubscription(sub);
        setChecking(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-xl flex-col items-center justify-center px-6 py-24 text-center sm:px-10">
      <Seo
        title="Membership Payment"
        description="Confirming your Monzer Allan membership payment."
        path="/membership/success"
        noindex
      />
      <Reveal direction="up">
        {checking ? (
          <>
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
            <h1 className="mt-5 font-display text-2xl font-bold text-navy">
              We&apos;re confirming your membership…
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              Checking your current membership status.
            </p>
          </>
        ) : subscription?.status === "active" ? (
          <>
            <CheckCircle2 className="mx-auto h-12 w-12 text-turquoise" />
            <h1 className="mt-5 font-display text-2xl font-bold text-navy">
              Your Membership Is Active
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              Thank you for joining. Head to your account to see your consultation credits and
              request your first session.
            </p>
            <Link
              to="/account"
              className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-turquoise"
            >
              <UserRound className="h-4 w-4" /> Go to My Account
            </Link>
          </>
        ) : (
          <>
            <Mail className="mx-auto h-12 w-12 text-primary" />
            <h1 className="mt-5 font-display text-2xl font-bold text-navy">
              Payment Received — Activating Your Membership
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              Your payment was submitted to Stripe. We&apos;re now confirming it and setting up your
              account — this usually takes just a few minutes. Check your email for a message
              inviting you to set your password and sign in.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-turquoise"
            >
              <UserRound className="h-4 w-4" /> Go to Sign In
            </Link>
            <p className="mt-4 text-xs text-muted-foreground">
              Didn&apos;t receive anything after a few minutes?{" "}
              <Link to="/contact" className="font-semibold text-primary hover:text-turquoise">
                Contact us
              </Link>{" "}
              and we&apos;ll help directly.
            </p>
          </>
        )}
      </Reveal>
    </div>
  );
}

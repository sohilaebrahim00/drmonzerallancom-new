import { Link } from "react-router-dom";
import { CreditCard, MessageCircle } from "lucide-react";

import { AppScreen } from "@/app-native/components/AppScreen";
import { Button } from "@/components/ui/button";

/** Honest placeholder — no Stripe customer/billing-portal integration exists yet. */
export default function NativeBilling() {
  return (
    <AppScreen
      title="Manage Billing"
      back
      className="mx-auto w-full max-w-lg px-4 py-10 text-center"
    >
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-primary">
        <CreditCard className="h-6 w-6" />
      </span>
      <p className="mt-4 font-display text-lg font-bold text-navy">
        Billing management isn't available yet
      </p>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
        Self-service billing management is coming soon. For payment or membership questions, our
        team can help directly.
      </p>
      <Button asChild className="mt-5 cursor-pointer">
        <Link to="/account/help">
          <MessageCircle className="h-4 w-4" /> Contact Support
        </Link>
      </Button>
    </AppScreen>
  );
}

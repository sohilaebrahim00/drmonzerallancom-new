import { useNavigate } from "react-router-dom";

import { AppScreen } from "@/app-native/components/AppScreen";
import { FreeSignUpForm } from "@/app-native/components/FreeSignUpForm";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";

/**
 * The app experience's real, free account-creation screen — no Stripe, no
 * membership selection. Distinct from the marketing website's /join
 * (JoinPage), which stays exactly as-is for the paid-membership Stripe
 * Checkout flow. Signing up here lands on "/", and AppExperience's own
 * onboarding gate (see NativeOnboarding.tsx) takes it from there —
 * navigating a freshly-created, not-yet-onboarded account into the
 * profile-setup steps automatically.
 */
export default function NativeFreeSignUp() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  return (
    <AppScreen title="Create Account" back className="mx-auto w-full max-w-lg px-4 py-4">
      <p className="text-sm text-muted-foreground">
        Free to join. You can add a paid membership later for consultations.
      </p>
      <div className="mt-5">
        <FreeSignUpForm onSuccess={() => navigate("/", { replace: true })} />
      </div>
    </AppScreen>
  );
}

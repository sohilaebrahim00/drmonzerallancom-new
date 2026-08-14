import { useNavigate, Navigate } from "react-router-dom";

import { useAuth } from "@/context/AuthContext";
import { useAppBoot } from "@/context/AppBootContext";
import { WelcomeStep } from "@/app-native/onboarding/WelcomeStep";
import { AccountStep } from "@/app-native/onboarding/AccountStep";
import { BasicsStep } from "@/app-native/onboarding/BasicsStep";
import { BodyHealthStep } from "@/app-native/onboarding/BodyHealthStep";
import { PrivacyStep } from "@/app-native/onboarding/PrivacyStep";
import { ConnectDoctorStep } from "@/app-native/onboarding/ConnectDoctorStep";
import { ReadyStep } from "@/app-native/onboarding/ReadyStep";
import { ONBOARDING_STEPS, type OnboardingStep } from "@/app-native/onboarding/OnboardingStepShell";

/**
 * The onboarding ORCHESTRATOR — the current step is entirely derived from
 * AppBootContext (server-persisted onboarding_current_step + the
 * device-local welcome flag), never from local component state. This is
 * the actual fix for the "tap Next, nothing happens, only a refresh
 * works" bug: there is exactly one place "what step is the visitor on"
 * lives, and every step's completion handler updates THAT place (via
 * advanceOnboardingStep/finishOnboarding) before this component re-renders
 * with the next step already resolved — never a separate, disconnected
 * "seen" flag that can go stale relative to it.
 */
export default function NativeOnboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    welcomeSeen,
    onboardingStep,
    onboardingComplete,
    profile,
    markWelcomeSeen,
    advanceOnboardingStep,
    finishOnboarding,
    refreshProfile,
  } = useAppBoot();

  if (!welcomeSeen) {
    return (
      <WelcomeStep
        onContinue={async () => {
          // Deliberately does NOT navigate — stays on /onboarding so the
          // next render (welcomeSeen now true) falls through to AccountStep
          // below in the exact same commit cycle, no route change needed.
          await markWelcomeSeen();
        }}
        onSkipToApp={async () => {
          await markWelcomeSeen();
          navigate("/", { replace: true });
        }}
      />
    );
  }

  if (!user) {
    // Reachable only via "Get Started" above — "Continue as guest" already
    // navigated straight to "/" and never lands here.
    return (
      <AccountStep
        onSuccess={async () => {
          await refreshProfile();
          await advanceOnboardingStep("basics");
        }}
      />
    );
  }

  if (onboardingComplete) {
    return <Navigate to="/" replace />;
  }

  const persistedStep = onboardingStep as OnboardingStep | null;
  const step: OnboardingStep =
    persistedStep && ONBOARDING_STEPS.includes(persistedStep) && persistedStep !== "welcome"
      ? persistedStep
      : "basics";

  async function goToStep(next: OnboardingStep) {
    await advanceOnboardingStep(next);
  }

  switch (step) {
    case "account":
    case "basics":
      return <BasicsStep profile={profile} onNext={() => goToStep("body_health")} />;
    case "body_health":
      return (
        <BodyHealthStep onNext={() => goToStep("privacy")} onSkip={() => goToStep("privacy")} />
      );
    case "privacy":
      return <PrivacyStep onNext={() => goToStep("connect_doctor")} />;
    case "connect_doctor":
      return <ConnectDoctorStep onNext={() => goToStep("ready")} />;
    case "ready":
    default:
      return (
        <ReadyStep
          onFinish={async () => {
            await finishOnboarding();
            navigate("/", { replace: true });
          }}
        />
      );
  }
}

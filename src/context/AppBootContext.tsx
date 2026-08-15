import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

import { useAuth } from "@/context/AuthContext";
import {
  getFullProfile,
  setOnboardingStep as persistOnboardingStep,
  completeOnboarding as persistOnboardingComplete,
  type FullProfile,
  type UserRole,
} from "@/services/profileService";
import { getSetting, setSetting } from "@/services/appSettingsService";
import { ONBOARDING_SEEN_KEY } from "@/app-native/onboardingState";
import { getDemoMode } from "@/dev/demoMode";
import { DEMO_PROFILE, DEMO_DOCTOR_PROFILE } from "@/dev/demoFixtures";

/**
 * Root cause of the "tap Next, screen doesn't advance, only a refresh
 * fixes it" bug (documented in full in
 * PHASE_G_SOCIAL_NUTRITION_IMPLEMENTATION_REPORT.md): the previous
 * onboarding gate in AppExperience.tsx computed `needsOnboarding` ONCE in
 * a `useEffect` with an empty dependency array, then never updated it
 * again. Completing onboarding persisted the "seen" flag to storage and
 * navigated to "/", but the gate's own React state never learned about
 * that — so on the very next render it saw `needsOnboarding === true` and
 * `pathname === "/"` and bounced straight back to "/onboarding". A hard
 * refresh "fixed" it only because remounting the component re-ran the
 * effect and this time read the now-persisted value.
 *
 * The fix: ONE reactive state tree (this context), read by every gate and
 * written by every action that changes what a gate depends on. There is no
 * second, disconnected copy of "am I onboarded" anywhere for the two to
 * drift apart.
 */

export type BootStatus = "initializing" | "ready";

interface AppBootValue {
  status: BootStatus;
  profile: FullProfile | null;
  role: UserRole;
  /** Device-local "has this device seen the intro slides" — independent of any account. */
  welcomeSeen: boolean;
  /** Authenticated-user server-side onboarding progress. Null once onboarding_completed_at is set. */
  onboardingStep: string | null;
  onboardingComplete: boolean;
  markWelcomeSeen: () => Promise<void>;
  advanceOnboardingStep: (step: string) => Promise<void>;
  finishOnboarding: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AppBootContext = createContext<AppBootValue | null>(null);

export function AppBootProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<BootStatus>("initializing");
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [welcomeSeen, setWelcomeSeen] = useState(false);

  const resolve = useCallback(async () => {
    // DEV-ONLY demo preview (see src/dev/demoMode.ts) — skips onboarding
    // and Preferences/localStorage entirely, resolving straight to a
    // ready, fully-onboarded fixture profile. Never runs in production.
    const demoMode = getDemoMode();
    if (demoMode) {
      setWelcomeSeen(true);
      setProfile(demoMode === "doctor" ? DEMO_DOCTOR_PROFILE : DEMO_PROFILE);
      setStatus("ready");
      return;
    }

    const [seen, fullProfile] = await Promise.all([
      getSetting(ONBOARDING_SEEN_KEY, false),
      user ? getFullProfile(user.id) : Promise.resolve(null),
    ]);
    setWelcomeSeen(seen);
    setProfile(fullProfile);
    setStatus("ready");
  }, [user]);

  useEffect(() => {
    if (authLoading) return; // Wait for Supabase session hydration before resolving anything downstream of it.
    setStatus("initializing");
    resolve();
  }, [authLoading, resolve]);

  const markWelcomeSeen = useCallback(async () => {
    await setSetting(ONBOARDING_SEEN_KEY, true);
    setWelcomeSeen(true); // Same state the gate reads — updates instantly, no stale read possible.
  }, []);

  const advanceOnboardingStep = useCallback(async (step: string) => {
    await persistOnboardingStep(step);
    setProfile((prev) => (prev ? { ...prev, onboarding_current_step: step } : prev));
  }, []);

  const finishOnboarding = useCallback(async () => {
    await persistOnboardingComplete();
    await setSetting(ONBOARDING_SEEN_KEY, true);
    setWelcomeSeen(true);
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            onboarding_current_step: "ready",
            onboarding_completed_at: new Date().toISOString(),
          }
        : prev,
    );
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const fullProfile = await getFullProfile(user.id);
    setProfile(fullProfile);
  }, [user]);

  const value: AppBootValue = {
    status,
    profile,
    role: profile?.role ?? "user",
    welcomeSeen,
    onboardingStep: profile?.onboarding_current_step ?? null,
    onboardingComplete: Boolean(profile?.onboarding_completed_at),
    markWelcomeSeen,
    advanceOnboardingStep,
    finishOnboarding,
    refreshProfile,
  };

  return <AppBootContext.Provider value={value}>{children}</AppBootContext.Provider>;
}

export function useAppBoot() {
  const ctx = useContext(AppBootContext);
  if (!ctx) throw new Error("useAppBoot must be used within an AppBootProvider");
  return ctx;
}

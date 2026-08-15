import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getAppMode } from "@/hooks/use-native-platform";
import { business } from "@/data/business";
import { getDemoMode } from "@/dev/demoMode";
import { DEMO_USER, DEMO_SESSION, DEMO_DOCTOR_USER, DEMO_DOCTOR_SESSION } from "@/dev/demoFixtures";

interface AuthResult {
  error: string | null;
}

interface SignUpResult extends AuthResult {
  /**
   * True when the account was created but Supabase Auth did NOT return an
   * active session — i.e. this project has "Confirm email" enabled (the
   * Supabase default), so the visitor must click the link in their inbox
   * before they can sign in. Found via live testing against a real
   * project: signUp() succeeding does not always mean "now signed in" —
   * callers that assumed it did (silently trying to write a profile with
   * no session) failed with a confusing "Not signed in" error instead of
   * telling the visitor what was actually happening.
   */
  needsEmailConfirmation: boolean;
}

/**
 * The one place that decides where Supabase should send a visitor back to
 * after a reset-password email or OAuth redirect, for each of the three
 * environments (see getAppMode()):
 *  - CAPACITOR_NATIVE: `window.location.origin` is meaningless there — it
 *    resolves to Capacitor's internal WebView origin (e.g.
 *    capacitor://localhost), not a real address an email client or OAuth
 *    provider can send the visitor back to. Always redirect through the
 *    real marketing-website origin instead.
 *  - PWA_WEB_APP / MARKETING_WEB: both have a real, reachable origin —
 *    `window.location.origin` is correct for either (app.monzerallan.com or
 *    monzerallan.com respectively; also supports localhost dev for both).
 */
function getAuthRedirectOrigin(): string {
  return getAppMode() === "CAPACITOR_NATIVE" ? business.domain : window.location.origin;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  configured: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<SignUpResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<AuthResult>;
  updatePassword: (newPassword: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
}

const NOT_CONFIGURED_ERROR =
  "Sign-in isn't connected yet. Please check back soon or contact us directly.";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // DEV-ONLY demo preview (see src/dev/demoMode.ts): substitutes a fake
    // signed-in identity instead of touching real Supabase auth at all —
    // never runs in production (getDemoMode() is always null there).
    const demoMode = getDemoMode();
    if (demoMode) {
      setSession(demoMode === "doctor" ? DEMO_DOCTOR_SESSION : DEMO_SESSION);
      setUser(demoMode === "doctor" ? DEMO_DOCTOR_USER : DEMO_USER);
      setLoading(false);
      return;
    }

    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function signUp(email: string, password: string, fullName: string): Promise<SignUpResult> {
    if (!supabase) return { error: NOT_CONFIGURED_ERROR, needsEmailConfirmation: false };
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${getAuthRedirectOrigin()}/login`,
      },
    });
    if (error) return { error: error.message, needsEmailConfirmation: false };
    return { error: null, needsEmailConfirmation: !data.session };
  }

  async function signIn(email: string, password: string): Promise<AuthResult> {
    if (!supabase) return { error: NOT_CONFIGURED_ERROR };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? error.message : null };
  }

  async function signOut(): Promise<void> {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  async function resetPasswordForEmail(email: string): Promise<AuthResult> {
    if (!supabase) return { error: NOT_CONFIGURED_ERROR };
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getAuthRedirectOrigin()}/reset-password`,
    });
    return { error: error ? error.message : null };
  }

  async function updatePassword(newPassword: string): Promise<AuthResult> {
    if (!supabase) return { error: NOT_CONFIGURED_ERROR };
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error ? error.message : null };
  }

  async function signInWithGoogle(): Promise<AuthResult> {
    if (!supabase) return { error: NOT_CONFIGURED_ERROR };
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${getAuthRedirectOrigin()}/account` },
    });
    return { error: error ? error.message : null };
  }

  const value: AuthContextValue = {
    user,
    session,
    loading,
    configured: isSupabaseConfigured,
    signUp,
    signIn,
    signOut,
    resetPasswordForEmail,
    updatePassword,
    signInWithGoogle,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

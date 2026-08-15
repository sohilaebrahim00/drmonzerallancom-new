import { lazy, Suspense, type ComponentType } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { AppScreen } from "@/app-native/components/AppScreen";
import { NativeBackHandler } from "@/app-native/NativeBackHandler";
import { DeepLinkHandler } from "@/app-native/DeepLinkHandler";
import { OfflineBanner } from "@/app-native/components/OfflineBanner";
import { UpdateAvailableBanner } from "@/app-native/components/UpdateAvailableBanner";
import { AppBootProvider, useAppBoot } from "@/context/AppBootContext";
import { useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DoctorRoute } from "@/components/auth/DoctorRoute";

const NativeOnboarding = lazy(() => import("@/app-native/screens/NativeOnboarding"));
const NativeHome = lazy(() => import("@/app-native/screens/NativeHome"));
const NativeHealth = lazy(() => import("@/app-native/screens/NativeHealth"));
const NativeAI = lazy(() => import("@/app-native/screens/NativeAI"));
const NativeConsultations = lazy(() => import("@/app-native/screens/NativeConsultations"));
const NativeBookConsultation = lazy(() => import("@/app-native/screens/NativeBookConsultation"));
const NativeAccount = lazy(() => import("@/app-native/screens/NativeAccount"));
const NativeNotificationSettings = lazy(
  () => import("@/app-native/screens/NativeNotificationSettings"),
);
const NativePrayerSettings = lazy(() => import("@/app-native/screens/NativePrayerSettings"));
const NativeBilling = lazy(() => import("@/app-native/screens/NativeBilling"));
const NativeHelpSupport = lazy(() => import("@/app-native/screens/NativeHelpSupport"));
const NativeProducts = lazy(() => import("@/app-native/screens/NativeProducts"));
const NativeProductDetails = lazy(() => import("@/app-native/screens/NativeProductDetails"));
const NativeFoodScanner = lazy(() => import("@/app-native/screens/NativeFoodScanner"));
const NativeFoodResult = lazy(() => import("@/app-native/screens/NativeFoodResult"));
const NativePrayerTimes = lazy(() => import("@/app-native/screens/NativePrayerTimes"));
const NativeQibla = lazy(() => import("@/app-native/screens/NativeQibla"));
const NativeBlog = lazy(() => import("@/app-native/screens/NativeBlog"));
const NativeArticle = lazy(() => import("@/app-native/screens/NativeArticle"));
const NativeVideos = lazy(() => import("@/app-native/screens/NativeVideos"));
const NativeFreeSignUp = lazy(() => import("@/app-native/screens/NativeFreeSignUp"));
const NativeMyHealth = lazy(() => import("@/app-native/screens/NativeMyHealth"));
const NativeMyProgram = lazy(() => import("@/app-native/screens/NativeMyProgram"));
const NativeActivityTask = lazy(() => import("@/app-native/screens/NativeActivityTask"));
const NativeProgress = lazy(() => import("@/app-native/screens/NativeProgress"));
const NativeSocial = lazy(() => import("@/app-native/screens/NativeSocial"));
const NativeFriendProfile = lazy(() => import("@/app-native/screens/NativeFriendProfile"));
const NativeMessageThread = lazy(() => import("@/app-native/screens/NativeMessageThread"));
const NativeDoctorPatientProfile = lazy(
  () => import("@/app-native/screens/NativeDoctorPatientProfile"),
);
const NativeDoctorProgramBuilder = lazy(
  () => import("@/app-native/screens/NativeDoctorProgramBuilder"),
);
const NativeFoodSearch = lazy(() => import("@/app-native/screens/NativeFoodSearch"));
const NativeNotificationCenter = lazy(
  () => import("@/app-native/screens/NativeNotificationCenter"),
);
const NativeActivityHistory = lazy(() => import("@/app-native/screens/NativeActivityHistory"));
const NativeHydration = lazy(() => import("@/app-native/screens/NativeHydration"));
const NativeDailyCheckIn = lazy(() => import("@/app-native/screens/NativeDailyCheckIn"));
const NativeFavorites = lazy(() => import("@/app-native/screens/NativeFavorites"));
const NativeCustomMeal = lazy(() => import("@/app-native/screens/NativeCustomMeal"));
const NativeProgressPhotos = lazy(() => import("@/app-native/screens/NativeProgressPhotos"));
const NativePrivacyCenter = lazy(() => import("@/app-native/screens/NativePrivacyCenter"));
const NativeDailyLog = lazy(() => import("@/app-native/screens/NativeDailyLog"));

const LoginPage = lazy(() => import("@/pages/LoginPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));
const AboutPage = lazy(() => import("@/pages/AboutPage"));
const PrivacyPolicyPage = lazy(() => import("@/pages/PrivacyPolicyPage"));
const TermsPage = lazy(() => import("@/pages/TermsPage"));
const MedicalDisclaimerPage = lazy(() => import("@/pages/MedicalDisclaimerPage"));

function PageFallback() {
  return (
    <div
      className="flex h-dvh w-full items-center justify-center"
      role="status"
      aria-label="Loading"
    >
      <Loader2 className="h-7 w-7 animate-spin text-primary" />
    </div>
  );
}

/** Gives a reused, self-contained web page (informational content only) a native back header. */
function withNativeChrome(title: string, Component: ComponentType) {
  return function Wrapped() {
    return (
      <AppScreen title={title} back>
        <Component />
      </AppScreen>
    );
  };
}

const NativeLogin = withNativeChrome("Sign In", LoginPage);
const NativeForgotPassword = withNativeChrome("Reset Password", ForgotPasswordPage);
const NativeResetPassword = withNativeChrome("Reset Password", ResetPasswordPage);
const NativeAbout = withNativeChrome("About", AboutPage);
const NativePrivacyPolicy = withNativeChrome("Privacy Policy", PrivacyPolicyPage);
const NativeTerms = withNativeChrome("Terms of Service", TermsPage);
const NativeMedicalDisclaimer = withNativeChrome("Medical Disclaimer", MedicalDisclaimerPage);

function NotFoundRedirect() {
  return <Navigate to="/" replace />;
}

function AppExperienceRoutes() {
  const location = useLocation();
  const { user } = useAuth();
  const { status, welcomeSeen, onboardingComplete } = useAppBoot();

  if (status === "initializing") return <PageFallback />;

  // Anyone (guest or not) who hasn't seen the welcome intro yet.
  if (!welcomeSeen && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  // Signed-in but hasn't finished the profile-setup steps yet. Reactive on
  // AppBootContext (see its doc comment) — this is what actually fixes the
  // "tap Next, nothing happens, needs a refresh" bug: onboardingComplete
  // flips the instant finishOnboarding() resolves, in the same state tree
  // this condition reads, so there's no stale render to bounce back from.
  if (user && !onboardingComplete && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <>
      <NativeBackHandler />
      <DeepLinkHandler />
      <UpdateAvailableBanner />
      <OfflineBanner />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/onboarding" element={<NativeOnboarding />} />

          <Route path="/" element={<NativeHome />} />
          <Route path="/health" element={<NativeHealth />} />
          <Route path="/ai" element={<NativeAI />} />

          <Route
            path="/consultations"
            element={
              <ProtectedRoute>
                <NativeConsultations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/consultations/book"
            element={
              <ProtectedRoute>
                <NativeBookConsultation />
              </ProtectedRoute>
            }
          />

          <Route path="/account" element={<NativeAccount />} />
          <Route
            path="/account/notifications"
            element={
              <ProtectedRoute>
                <NativeNotificationSettings />
              </ProtectedRoute>
            }
          />
          <Route path="/account/prayer-settings" element={<NativePrayerSettings />} />
          <Route
            path="/account/billing"
            element={
              <ProtectedRoute>
                <NativeBilling />
              </ProtectedRoute>
            }
          />
          <Route path="/account/help" element={<NativeHelpSupport />} />
          <Route
            path="/my-health"
            element={
              <ProtectedRoute>
                <NativeMyHealth />
              </ProtectedRoute>
            }
          />

          <Route path="/products" element={<NativeProducts />} />
          <Route path="/products/:slug" element={<NativeProductDetails />} />

          <Route path="/food-scanner" element={<NativeFoodScanner />} />
          <Route path="/food-scanner/result" element={<NativeFoodResult />} />
          <Route path="/food-scanner/search" element={<NativeFoodSearch />} />
          <Route
            path="/food-scanner/custom-meal"
            element={
              <ProtectedRoute>
                <NativeCustomMeal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/favorites"
            element={
              <ProtectedRoute>
                <NativeFavorites />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hydration"
            element={
              <ProtectedRoute>
                <NativeHydration />
              </ProtectedRoute>
            }
          />
          <Route
            path="/daily-checkin"
            element={
              <ProtectedRoute>
                <NativeDailyCheckIn />
              </ProtectedRoute>
            }
          />
          <Route
            path="/daily-log"
            element={
              <ProtectedRoute>
                <NativeDailyLog />
              </ProtectedRoute>
            }
          />
          <Route
            path="/progress-photos"
            element={
              <ProtectedRoute>
                <NativeProgressPhotos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account/privacy"
            element={
              <ProtectedRoute>
                <NativePrivacyCenter />
              </ProtectedRoute>
            }
          />

          <Route path="/prayer-times" element={<NativePrayerTimes />} />
          <Route path="/qibla" element={<NativeQibla />} />

          <Route path="/blog" element={<NativeBlog />} />
          <Route path="/blog/:slug" element={<NativeArticle />} />
          <Route path="/videos" element={<NativeVideos />} />

          <Route
            path="/my-program"
            element={
              <ProtectedRoute>
                <NativeMyProgram />
              </ProtectedRoute>
            }
          />
          <Route
            path="/activity-task"
            element={
              <ProtectedRoute>
                <NativeActivityTask />
              </ProtectedRoute>
            }
          />
          <Route
            path="/activity-history"
            element={
              <ProtectedRoute>
                <NativeActivityHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NativeNotificationCenter />
              </ProtectedRoute>
            }
          />
          <Route
            path="/progress"
            element={
              <ProtectedRoute>
                <NativeProgress />
              </ProtectedRoute>
            }
          />

          <Route
            path="/social"
            element={
              <ProtectedRoute>
                <NativeSocial />
              </ProtectedRoute>
            }
          />
          <Route
            path="/social/profile/:userId"
            element={
              <ProtectedRoute>
                <NativeFriendProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/social/messages/:conversationId"
            element={
              <ProtectedRoute>
                <NativeMessageThread />
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctor/patients/:patientId"
            element={
              <DoctorRoute>
                <NativeDoctorPatientProfile />
              </DoctorRoute>
            }
          />
          <Route
            path="/doctor/programs/:programId/build"
            element={
              <DoctorRoute>
                <NativeDoctorProgramBuilder />
              </DoctorRoute>
            }
          />

          <Route path="/login" element={<NativeLogin />} />
          <Route path="/join" element={<NativeFreeSignUp />} />
          <Route path="/forgot-password" element={<NativeForgotPassword />} />
          <Route path="/reset-password" element={<NativeResetPassword />} />
          <Route path="/about" element={<NativeAbout />} />
          <Route path="/privacy-policy" element={<NativePrivacyPolicy />} />
          <Route path="/terms" element={<NativeTerms />} />
          <Route path="/medical-disclaimer" element={<NativeMedicalDisclaimer />} />

          <Route path="*" element={<NotFoundRedirect />} />
        </Routes>
      </Suspense>
    </>
  );
}

/**
 * The dedicated app-style presentation layer — a completely separate screen
 * set from the marketing website (see WebApp in App.tsx). Rendered for BOTH
 * CAPACITOR_NATIVE and PWA_WEB_APP (see getAppMode() in
 * use-native-platform.ts) — one shared screen set, not a duplicated one, per
 * the explicit instruction not to fork 20 screens into a second directory.
 * Only reused where reuse is genuinely appropriate: business-logic services,
 * and a small set of already-compact, non-marketing forms (auth, legal
 * pages) wrapped with a native back header rather than rebuilt from scratch.
 */
export function AppExperience() {
  return (
    <AppBootProvider>
      <AppExperienceRoutes />
    </AppBootProvider>
  );
}

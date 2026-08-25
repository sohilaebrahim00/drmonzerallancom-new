import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, useParams, Navigate } from "react-router-dom";
import { MotionConfig, motion } from "framer-motion";

import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/common/Footer";
import { BackToTop } from "@/components/common/BackToTop";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { StickyCta } from "@/components/common/StickyCta";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DoctorRoute } from "@/components/auth/DoctorRoute";
import { AppExperience } from "@/app-native/AppExperience";
import { getAppMode } from "@/hooks/use-native-platform";
import { isClientDemoBuild } from "@/dev/demoMode";
import { ClientDemoApp } from "@/dev/ClientDemoApp";

const HomePage = lazy(() => import("@/pages/HomePage"));
const AboutPage = lazy(() => import("@/pages/AboutPage"));
const PackagesPage = lazy(() => import("@/pages/PackagesPage"));
const FaqPage = lazy(() => import("@/pages/FaqPage"));
const ContactPage = lazy(() => import("@/pages/ContactPage"));
const ProductsIndexPage = lazy(() => import("@/pages/ProductsIndexPage"));
const ProductDetailPage = lazy(() => import("@/pages/ProductDetailPage"));
const EducationIndexPage = lazy(() => import("@/pages/EducationIndexPage"));
const EducationArticlePage = lazy(() => import("@/pages/EducationArticlePage"));
const GalleryPage = lazy(() => import("@/pages/GalleryPage"));
const VideosPage = lazy(() => import("@/pages/VideosPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));
const AccountPage = lazy(() => import("@/pages/AccountPage"));
const AccountConsultationsPage = lazy(() => import("@/pages/AccountConsultationsPage"));
const AccountIntakePage = lazy(() => import("@/pages/AccountIntakePage"));
// Still AdminAvailabilityPage.tsx on disk — the file was rebuilt in place for
// Phase 6A rather than renamed, so git keeps its history.
const DoctorAvailabilityPage = lazy(() => import("@/pages/AdminAvailabilityPage"));
const MembershipSuccessPage = lazy(() => import("@/pages/MembershipSuccessPage"));
const MembershipCancelledPage = lazy(() => import("@/pages/MembershipCancelledPage"));
const PrivacyPolicyPage = lazy(() => import("@/pages/PrivacyPolicyPage"));
const TermsPage = lazy(() => import("@/pages/TermsPage"));
const MedicalDisclaimerPage = lazy(() => import("@/pages/MedicalDisclaimerPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

function BlogArticleRedirect() {
  const { slug } = useParams<{ slug: string }>();
  return <Navigate to={`/blog/${slug ?? ""}`} replace />;
}

function ScrollRestoration() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}

function PageFallback() {
  return (
    <div
      className="flex min-h-[50vh] w-full items-center justify-center"
      role="status"
      aria-label="Loading"
    >
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-secondary border-t-primary" />
    </div>
  );
}

/** Soft fade + small vertical reveal on route change; respects prefers-reduced-motion via MotionConfig. */
function PageTransition({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/**
 * The existing, approved marketing website — completely unmodified in
 * structure/behavior from before the native rebuild. Never rendered inside
 * Capacitor or the PWA/Web App; see AppExperience for that presentation layer.
 */
/**
 * The doctor's own shell. Deliberately NOT the marketing chrome: no Header,
 * Footer, StickyCta or ChatWidget. Those exist to sell to visitors, and the
 * doctor working through his week is not a visitor — a "Book a Session" CTA
 * and a sales chat bubble on top of his own schedule would be noise at best
 * and confusing at worst.
 *
 * Access is gated twice, and the two are independent: DoctorRoute here (a UI
 * gate resolved via the is_doctor() RPC), and the admin-availability Edge
 * Function, which re-checks the caller server-side under the service_role key
 * and will refuse regardless of what the browser believes.
 */
function DoctorShell() {
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-secondary/20">
      <ScrollRestoration />
      <main id="main-content" className="relative z-10 flex-1">
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/doctor/availability" element={<DoctorAvailabilityPage />} />
            {/* /doctor itself is the 6B dashboard, not built yet — send it to
                the one screen that does exist rather than a blank route. */}
            <Route path="*" element={<Navigate to="/doctor/availability" replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

function WebApp() {
  const { pathname } = useLocation();

  // The doctor's screens get their own shell. Rendering them inside the
  // marketing layout below would wrap the schedule in a sales header, footer
  // and chat widget.
  if (pathname.startsWith("/doctor")) {
    return (
      <DoctorRoute>
        <DoctorShell />
      </DoctorRoute>
    );
  }

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-primary focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background">
        <ScrollRestoration />
        <Header />
        <main id="main-content" className="relative z-10 flex-1">
          <Suspense fallback={<PageFallback />}>
            <PageTransition>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/packages" element={<PackagesPage />} />
                <Route path="/faq" element={<FaqPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/products" element={<ProductsIndexPage />} />
                <Route path="/products/:slug" element={<ProductDetailPage />} />
                {/* The anonymous package-tier scheduling flow (BookingPage.tsx)
                    doesn't map onto the one-time program-package model — booking
                    a real slot now happens after purchase, from the authenticated
                    Account -> Consultations page. Redirect old links here. */}
                <Route path="/booking" element={<Navigate to="/packages" replace />} />
                <Route path="/booking/success" element={<Navigate to="/packages" replace />} />
                <Route path="/blog" element={<EducationIndexPage />} />
                <Route path="/blog/:slug" element={<EducationArticlePage />} />
                <Route path="/education" element={<Navigate to="/blog" replace />} />
                <Route path="/education/:slug" element={<BlogArticleRedirect />} />
                <Route path="/gallery" element={<GalleryPage />} />
                <Route path="/videos" element={<VideosPage />} />
                <Route path="/login" element={<LoginPage />} />
                {/* The old membership-tier signup form (JoinPage.tsx) is
                    retired — buying any program package now creates the
                    account automatically (see stripe-webhook's
                    findOrInviteUser). Redirect old links to the packages page. */}
                <Route path="/join" element={<Navigate to="/packages" replace />} />
                <Route path="/membership/success" element={<MembershipSuccessPage />} />
                <Route path="/membership/cancelled" element={<MembershipCancelledPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route
                  path="/account"
                  element={
                    <ProtectedRoute>
                      <AccountPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/account/consultations"
                  element={
                    <ProtectedRoute>
                      <AccountConsultationsPage />
                    </ProtectedRoute>
                  }
                />
                {/* Optional pre-consultation intake. Accepts ?q=<n> so the
                    account card and the email can resume at a specific
                    question rather than sending the patient back to one. */}
                <Route
                  path="/account/consultations/intake"
                  element={
                    <ProtectedRoute>
                      <AccountIntakePage />
                    </ProtectedRoute>
                  }
                />
                {/* Moved to /doctor/availability, which renders in the doctor
                    shell below (no marketing chrome). Kept as a redirect so a
                    bookmark the doctor already has keeps working. */}
                <Route
                  path="/admin/availability"
                  element={<Navigate to="/doctor/availability" replace />}
                />
                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/medical-disclaimer" element={<MedicalDisclaimerPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </PageTransition>
          </Suspense>
        </main>
        <Footer />
        <BackToTop />
        <StickyCta />
        <ChatWidget />
      </div>
    </>
  );
}

export default function App() {
  // The dedicated client-demo build (`vite build --mode client-demo`, see
  // vite.config.ts / .env.client-demo) is a completely separate deployment
  // target (demo.monzerallan.com) — checked before touching getAppMode() at
  // all, so this branch can never affect MARKETING_WEB/PWA_WEB_APP/
  // CAPACITOR_NATIVE routing in the real builds. isClientDemoBuild() reads
  // import.meta.env.VITE_APP_MODE, which is never "client-demo" in
  // npm run build:web / build:app.
  if (isClientDemoBuild()) {
    return (
      <BrowserRouter>
        <MotionConfig reducedMotion="user">
          <AuthProvider>
            <ClientDemoApp />
          </AuthProvider>
        </MotionConfig>
      </BrowserRouter>
    );
  }

  const appMode = getAppMode();
  return (
    <BrowserRouter>
      <MotionConfig reducedMotion="user">
        <AuthProvider>{appMode === "MARKETING_WEB" ? <WebApp /> : <AppExperience />}</AuthProvider>
      </MotionConfig>
    </BrowserRouter>
  );
}

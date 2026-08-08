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

const HomePage = lazy(() => import("@/pages/HomePage"));
const AboutPage = lazy(() => import("@/pages/AboutPage"));
const PackagesPage = lazy(() => import("@/pages/PackagesPage"));
const FaqPage = lazy(() => import("@/pages/FaqPage"));
const ContactPage = lazy(() => import("@/pages/ContactPage"));
const ProductsIndexPage = lazy(() => import("@/pages/ProductsIndexPage"));
const ProductDetailPage = lazy(() => import("@/pages/ProductDetailPage"));
const BookingPage = lazy(() => import("@/pages/BookingPage"));
const BookingSuccessPage = lazy(() => import("@/pages/BookingSuccessPage"));
const EducationIndexPage = lazy(() => import("@/pages/EducationIndexPage"));
const EducationArticlePage = lazy(() => import("@/pages/EducationArticlePage"));
const GalleryPage = lazy(() => import("@/pages/GalleryPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const JoinPage = lazy(() => import("@/pages/JoinPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));
const AccountPage = lazy(() => import("@/pages/AccountPage"));
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

export default function App() {
  return (
    <BrowserRouter>
      <MotionConfig reducedMotion="user">
        <AuthProvider>
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
                    <Route path="/booking" element={<BookingPage />} />
                    <Route path="/booking/success" element={<BookingSuccessPage />} />
                    <Route path="/blog" element={<EducationIndexPage />} />
                    <Route path="/blog/:slug" element={<EducationArticlePage />} />
                    <Route path="/education" element={<Navigate to="/blog" replace />} />
                    <Route path="/education/:slug" element={<BlogArticleRedirect />} />
                    <Route path="/gallery" element={<GalleryPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/join" element={<JoinPage />} />
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
        </AuthProvider>
      </MotionConfig>
    </BrowserRouter>
  );
}

import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { MotionConfig } from "framer-motion";

import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/common/Footer";
import { BackToTop } from "@/components/common/BackToTop";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

const HomePage = lazy(() => import("@/pages/HomePage"));
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
const PrivacyPolicyPage = lazy(() => import("@/pages/PrivacyPolicyPage"));
const TermsPage = lazy(() => import("@/pages/TermsPage"));
const MedicalDisclaimerPage = lazy(() => import("@/pages/MedicalDisclaimerPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

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
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/products" element={<ProductsIndexPage />} />
                  <Route path="/products/:slug" element={<ProductDetailPage />} />
                  <Route path="/booking" element={<BookingPage />} />
                  <Route path="/booking/success" element={<BookingSuccessPage />} />
                  <Route path="/education" element={<EducationIndexPage />} />
                  <Route path="/education/:slug" element={<EducationArticlePage />} />
                  <Route path="/gallery" element={<GalleryPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/join" element={<JoinPage />} />
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
              </Suspense>
            </main>
            <Footer />
            <BackToTop />
            <ChatWidget />
          </div>
        </AuthProvider>
      </MotionConfig>
    </BrowserRouter>
  );
}

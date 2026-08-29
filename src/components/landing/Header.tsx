import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, UserPlus } from "lucide-react";

import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { LanguageSwitch } from "@/components/common/LanguageSwitch";
import { useTranslate, type SimpleTranslationKey } from "@/i18n";
import { BookingButton } from "@/components/booking/BookingButton";
import { UserMenu } from "@/components/auth/UserMenu";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

interface NavItem {
  /** Dictionary key, not display text — resolved per render by the active locale. */
  labelKey: SimpleTranslationKey;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { labelKey: "nav.about", href: "/about" },
  { labelKey: "nav.packages", href: "/packages" },
  { labelKey: "nav.shop", href: "/products" },
  { labelKey: "nav.blog", href: "/blog" },
  { labelKey: "nav.gallery", href: "/gallery" },
  { labelKey: "nav.faq", href: "/faq" },
  { labelKey: "nav.contact", href: "/contact" },
];

export function Header() {
  const t = useTranslate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-colors duration-300",
        scrolled
          ? "border-b border-border/60 bg-background/80 shadow-[0_1px_0_0_rgba(23,35,59,0.04)] backdrop-blur-lg"
          : "bg-transparent",
      )}
    >
      <div className="animate-fade-in mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-5 sm:px-10 sm:py-6">
        <Link to="/" className="flex items-center gap-2" aria-label={t("header.homeAriaLabel")}>
          <img
            src="/ma-logo.png"
            alt={t("header.logoAlt")}
            width={163}
            height={140}
            className="h-12 w-auto sm:h-14"
          />
          <span className="hidden font-display text-lg font-bold tracking-tight text-navy sm:inline">
            Monzer Allan
          </span>
        </Link>

        <nav
          className="hidden items-center gap-0.5 lg:flex"
          aria-label={t("header.primaryNavLabel")}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname.startsWith(item.href);

            return (
              <Link key={item.href} to={item.href} aria-current={isActive ? "page" : undefined}>
                <span
                  className={cn(
                    "relative inline-flex px-3 py-2 text-sm font-semibold transition-colors",
                    isActive ? "text-primary" : "text-navy/70 hover:text-navy",
                  )}
                >
                  {t(item.labelKey)}
                  {isActive && (
                    <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-turquoise" />
                  )}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {!loading &&
            (user ? (
              <UserMenu />
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-semibold text-navy/70 transition-colors hover:text-navy"
                >
                  {t("header.signIn")}
                </Link>
                <Link
                  to="/packages"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
                >
                  <UserPlus className="h-4 w-4" /> {t("header.createAccount")}
                </Link>
              </>
            ))}
          <LanguageSwitch />
          <BookingButton size="sm" />
        </div>

        {/* On mobile the switch sits OUTSIDE the drawer, next to the menu
            button — the brief asks for it to be reachable without opening
            anything. */}
        <div className="flex items-center gap-2 lg:hidden">
          <LanguageSwitch />
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label={t("header.openMenu")}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border bg-card/60 text-navy backdrop-blur-sm transition-colors hover:border-turquoise hover:text-turquoise"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="flex w-[85vw] max-w-sm flex-col gap-6">
              <SheetTitle className="font-display text-lg text-navy">
                {t("header.menuTitle")}
              </SheetTitle>
              <nav className="flex flex-col gap-1" aria-label={t("header.mobileNavLabel")}>
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className="rounded-lg px-3 py-3 text-base font-semibold text-navy transition-colors hover:bg-secondary"
                  >
                    {t(item.labelKey)}
                  </Link>
                ))}
              </nav>
              <div className="mt-auto flex flex-col gap-3">
                <BookingButton className="w-full" onClick={() => setDrawerOpen(false)} />
                {!loading &&
                  (user ? (
                    <Link
                      to="/account"
                      onClick={() => setDrawerOpen(false)}
                      className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-navy/80 transition-colors hover:border-turquoise hover:text-turquoise"
                    >
                      My Account
                    </Link>
                  ) : (
                    <>
                      <Link
                        to="/packages"
                        onClick={() => setDrawerOpen(false)}
                        className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-primary px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                      >
                        <UserPlus className="h-4 w-4" /> {t("header.createAccount")}
                      </Link>
                      <Link
                        to="/login"
                        onClick={() => setDrawerOpen(false)}
                        className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-navy/80 transition-colors hover:border-turquoise hover:text-turquoise"
                      >
                        {t("header.signIn")}
                      </Link>
                    </>
                  ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

import { Link, useLocation } from "react-router-dom";
import { SignIn, GearSix, Stethoscope } from "@phosphor-icons/react";

import { APP_NAV_TABS } from "@/app-native/navTabs";
import { useAuth } from "@/context/AuthContext";
import { useAppBoot } from "@/context/AppBootContext";
import { business } from "@/data/business";
import { cn } from "@/lib/utils";

export const DESKTOP_SIDEBAR_WIDTH_PX = 248;

/**
 * Desktop-only app shell chrome (`lg:` and up): a persistent left sidebar
 * with the same five destinations as BottomNavigation, replacing it rather
 * than duplicating it below. This is what keeps app.monzerallan.com from
 * rendering as a phone layout stretched across a monitor — see AppScreen,
 * which renders this alongside every screen's content.
 */
export function DesktopSidebar() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { profile, role } = useAppBoot();
  const isDoctor = role === "doctor" || role === "admin";

  return (
    <aside
      aria-label="Primary"
      className="native-safe-top hidden shrink-0 flex-col border-r border-border/60 bg-app-surface lg:flex lg:w-[248px]"
    >
      <div className="flex items-center gap-2.5 px-5 pb-5 pt-6">
        <img src="/ma-logo.png" alt="" className="h-8 w-8 rounded-full object-cover" />
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-bold text-navy">{business.doctorName}</p>
          <p className="truncate text-[0.7rem] font-medium text-muted-foreground">Health App</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 pt-2">
        {APP_NAV_TABS.map((tab) => {
          const active = tab.match(pathname);
          return (
            <Link
              key={tab.label}
              to={tab.to}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                active
                  ? "bg-secondary text-primary"
                  : "text-muted-foreground hover:bg-app-surface-secondary hover:text-navy",
              )}
            >
              <tab.icon
                className={cn("h-[1.15rem] w-[1.15rem] shrink-0", active && "text-primary")}
                weight={active ? "fill" : "regular"}
              />
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <div className="native-safe-bottom border-t border-border/60 p-3">
        {user ? (
          <Link
            to="/account"
            className="flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-app-surface-secondary"
          >
            {isDoctor ? (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                <Stethoscope className="h-4 w-4" />
              </span>
            ) : (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-primary">
                {(profile?.full_name ?? user.email ?? "U").charAt(0).toUpperCase()}
              </span>
            )}
            <span className="min-w-0 flex-1">
              {/* Never a raw email in the sidebar — a doctor/admin always
                  sees their real name + role, a regular user sees their
                  display name (falling back to email only as a last
                  resort, e.g. before onboarding sets a name). */}
              <span className="block truncate text-xs font-semibold text-navy">
                {isDoctor
                  ? (profile?.full_name ?? business.doctorName)
                  : (profile?.full_name ?? user.email)}
              </span>
              {isDoctor && (
                <span className="block truncate text-[0.65rem] text-muted-foreground">
                  Doctor Account
                </span>
              )}
            </span>
            <GearSix className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        ) : (
          <Link
            to="/login"
            className="flex items-center justify-center gap-1.5 rounded-xl bg-secondary px-3 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-secondary/70"
          >
            <SignIn className="h-4 w-4" /> Sign In
          </Link>
        )}
      </div>
    </aside>
  );
}

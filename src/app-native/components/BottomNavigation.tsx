import { Link, useLocation } from "react-router-dom";

import { APP_NAV_TABS } from "@/app-native/navTabs";
import { hapticTap } from "@/lib/haptics";
import { cn } from "@/lib/utils";

/**
 * Five primary destinations, Scan visually elevated as the central action
 * (a raised gradient button breaking the tab-bar line) — Phase G's
 * navigation decision replaces AI with Scan here (see navTabs.ts's doc
 * comment for the reasoning): food scanning is a multiple-times-a-day
 * action, AI is occasional and stays one tap away from Home instead.
 * Hidden at the desktop breakpoint, where DesktopSidebar (rendered by
 * AppScreen) provides the same navigation.
 */
export function BottomNavigation() {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Primary"
      className="native-safe-bottom native-safe-x fixed inset-x-0 bottom-0 z-50 border-t border-border/70 bg-card/95 backdrop-blur-xl lg:hidden"
    >
      <div className="mx-auto flex h-16 max-w-xl items-stretch justify-between px-1">
        {APP_NAV_TABS.map((tab) => {
          const active = tab.match(pathname);
          const isElevated = tab.label === "Scan";

          if (isElevated) {
            return (
              <Link
                key={tab.label}
                to={tab.to}
                onClick={hapticTap}
                aria-current={active ? "page" : undefined}
                className="relative flex flex-1 flex-col items-center justify-end pb-1.5"
              >
                <span
                  className={cn(
                    "-mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-navy to-primary text-white shadow-[0_10px_24px_-8px_rgba(37,63,164,0.65)] ring-4 ring-card transition-transform",
                    active && "scale-105",
                  )}
                >
                  <tab.icon className="h-5.5 w-5.5" weight="duotone" />
                </span>
                <span
                  className={cn(
                    "mt-1 text-[0.65rem] font-semibold",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {tab.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.label}
              to={tab.to}
              onClick={hapticTap}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[0.65rem] font-semibold transition-colors touch-manipulation",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <tab.icon className="h-5 w-5" weight={active ? "fill" : "regular"} />
              <span className="truncate">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export const BOTTOM_NAV_HEIGHT_PX = 64;

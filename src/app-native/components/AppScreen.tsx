import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { AppHeader } from "@/app-native/components/AppHeader";
import { BottomNavigation } from "@/app-native/components/BottomNavigation";
import { DesktopSidebar } from "@/app-native/components/DesktopSidebar";
import { cn } from "@/lib/utils";

interface AppScreenProps {
  title?: string;
  subtitle?: string;
  /** `true` → default back (navigate(-1)); a function → custom back handler; omitted → no back button (root tab screens). */
  back?: true | (() => void);
  headerRight?: ReactNode;
  /** Only the five root tab screens set this true. */
  tabBar?: boolean;
  /** false = full-bleed viewport-height layout (camera, compass, chat) with its own internal scroll. */
  scroll?: boolean;
  hideHeader?: boolean;
  transparentHeader?: boolean;
  /** Caller-positioned fixed bottom content (composer, primary CTA) — not auto-offset, position it yourself relative to tabBar. */
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
}

/**
 * The one screen shell every native-mode screen composes with — a compact
 * header, optional bottom tab bar, and either normal page scroll or a
 * fixed-viewport layout for screens that manage their own internal scroll
 * region (chat, camera, compass). This is the mechanism that keeps native
 * screens from turning into long stacked website sections.
 */
export function AppScreen({
  title,
  subtitle,
  back,
  headerRight,
  tabBar = false,
  scroll = true,
  hideHeader = false,
  transparentHeader = false,
  footer,
  className,
  children,
}: AppScreenProps) {
  const navigate = useNavigate();
  const onBack = back === true ? () => navigate(-1) : typeof back === "function" ? back : undefined;

  const header = !hideHeader && (
    <AppHeader
      title={title}
      subtitle={subtitle}
      onBack={onBack}
      right={headerRight}
      transparent={transparentHeader}
    />
  );

  const content = !scroll ? (
    <div className="flex h-dvh flex-col bg-app-shell lg:bg-app-shell">
      {header}
      <div className={cn("min-h-0 flex-1", className)}>{children}</div>
      {footer}
      {tabBar && <BottomNavigation />}
    </div>
  ) : (
    <div
      className={cn(
        "min-h-screen bg-app-shell",
        tabBar && "pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0",
      )}
    >
      {header}
      <div className={cn("lg:mx-auto lg:w-full lg:max-w-6xl lg:px-8 lg:py-8", className)}>
        {children}
      </div>
      {footer}
      {tabBar && <BottomNavigation />}
    </div>
  );

  // DesktopSidebar is a no-op below the `lg:` breakpoint (hidden lg:flex) —
  // this wrapper only reserves layout space for it on desktop, replacing
  // BottomNavigation there rather than duplicating it below.
  return (
    <div className="lg:flex lg:min-h-screen">
      <DesktopSidebar />
      <div className="lg:min-w-0 lg:flex-1">{content}</div>
    </div>
  );
}

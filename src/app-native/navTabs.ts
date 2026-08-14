import { Camera, CalendarCheck, Home, User, Users } from "lucide-react";

export interface AppNavTab {
  label: string;
  to: string;
  icon: typeof Home;
  match: (pathname: string) => boolean;
}

/**
 * Phase G navigation IA decision (documented in
 * PHASE_G_SOCIAL_NUTRITION_IMPLEMENTATION_REPORT.md's "Navigation"
 * section): the core loop is now Eat -> Scan -> Log -> Program -> Social,
 * not "browse the website in an app shell". Scan replaces AI as the
 * raised central action (explicit product requirement — food scanning
 * happens multiple times a day, a question to the AI Concierge is
 * occasional). AI stays reachable in 1-2 taps via a Home quick action
 * instead of a dedicated tab. Consultations/Prayer/Qibla/Products/Blog/
 * Videos move under Home (quick links) and Account (settings-style rows)
 * rather than each keeping a top-level tab — five tabs is the ceiling for
 * a usable bottom nav, and Program + Social are new, higher-priority
 * destinations than a generic "Health" content hub.
 */
export const APP_NAV_TABS: AppNavTab[] = [
  {
    label: "Home",
    to: "/",
    icon: Home,
    // Doctor accounts see the doctor dashboard AS their Home tab (see
    // NativeHome.tsx) rather than a separate top-level tab — one persona,
    // one Home destination, just different content.
    match: (p) => p === "/" || p.startsWith("/doctor") || p.startsWith("/ai"),
  },
  {
    label: "Program",
    to: "/my-program",
    icon: CalendarCheck,
    match: (p) =>
      p.startsWith("/my-program") ||
      p.startsWith("/health") ||
      p.startsWith("/products") ||
      p.startsWith("/blog") ||
      p.startsWith("/videos") ||
      p.startsWith("/prayer-times") ||
      p.startsWith("/qibla") ||
      p.startsWith("/progress"),
  },
  { label: "Scan", to: "/food-scanner", icon: Camera, match: (p) => p.startsWith("/food-scanner") },
  {
    label: "Social",
    to: "/social",
    icon: Users,
    match: (p) => p.startsWith("/social"),
  },
  {
    label: "Account",
    to: "/account",
    icon: User,
    match: (p) =>
      p.startsWith("/account") ||
      p.startsWith("/login") ||
      p.startsWith("/join") ||
      p.startsWith("/consultations") ||
      p.startsWith("/my-health"),
  },
];

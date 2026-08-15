import {
  Bell,
  CalendarCheck,
  Camera,
  ChartLineUp,
  ChatCircleDots,
  Compass,
  Drop,
  Fire,
  ForkKnife,
  Footprints,
  GearSix,
  HandsPraying,
  House,
  NotePencil,
  PersonSimpleWalk,
  Scales,
  ShieldCheck,
  Sparkle,
  Stethoscope,
  User,
  UserCircle,
  UsersThree,
} from "@phosphor-icons/react";
import type { Icon, IconWeight } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";

/**
 * The single central icon system for AppExperience (the User/Doctor app,
 * PWA, and native shell — never the marketing website, which keeps its own
 * existing icons unchanged). Phosphor is the ONE primary library; anything
 * not covered by this semantic map still imports Phosphor components
 * directly (see the per-screen files) — this map exists for the small set
 * of concepts reused across many screens (nav, metrics, common entities),
 * per the explicit icon-mapping requirement.
 */
export const AppIcons = {
  home: House,
  program: CalendarCheck,
  scan: Camera,
  social: UsersThree,
  account: UserCircle,
  ai: Sparkle,
  progress: ChartLineUp,
  weight: Scales,
  steps: Footprints,
  water: Drop,
  movement: PersonSimpleWalk,
  meals: ForkKnife,
  calories: Fire,
  messages: ChatCircleDots,
  notifications: Bell,
  doctor: Stethoscope,
  patient: User,
  notes: NotePencil,
  privacy: ShieldCheck,
  settings: GearSix,
  qibla: Compass,
  prayer: HandsPraying,
} as const;

export type AppIconName = keyof typeof AppIcons;

/**
 * Centralized icon size scale (§8) — always pick from this scale rather
 * than an arbitrary pixel value, so sizing stays consistent screen to
 * screen. Numbers are Phosphor's own `size` prop (px).
 */
export const ICON_SIZE = {
  tiny: 16,
  small: 18,
  standard: 20,
  nav: 22,
  feature: 26,
  hero: 32,
} as const;

export type IconSizeToken = keyof typeof ICON_SIZE;

export type IconTone =
  | "current" // inherits surrounding text color — the default for inline/metadata icons
  | "primary" // brand blue — default actions, nav, generic feature icons
  | "nutrition" // teal/cyan — food, calories, macros
  | "activity" // green — movement, steps, completed states
  | "warning" // amber — needs-review / operational flags, never "danger"
  | "danger" // destructive actions only (block, delete)
  | "muted"; // metadata / secondary information

const TONE_CLASS: Record<IconTone, string> = {
  current: "text-current",
  primary: "text-primary",
  nutrition: "text-turquoise",
  activity: "text-app-success",
  warning: "text-app-warning",
  danger: "text-destructive",
  muted: "text-muted-foreground",
};

interface AppIconProps {
  name: AppIconName;
  size?: IconSizeToken | number;
  weight?: IconWeight;
  tone?: IconTone;
  className?: string;
  /** Set only for icon-only interactive controls — see accessibility rule in the report. Decorative icons (the common case) stay unlabeled and aria-hidden. */
  ariaLabel?: string;
}

/**
 * The reusable icon primitive requested by the icon-system spec — used by
 * new/rebuilt UI (Doctor Command Center, metric tiles, nav) that reaches
 * for a semantic name rather than importing a Phosphor component directly.
 * Existing per-screen icon usage was migrated to direct Phosphor imports
 * (see FINAL_DOCTOR_USER_ICON_POLISH_REPORT.md for why: 58 files already
 * import icons as plain components with Tailwind className sizing, and
 * Phosphor components accept className/weight identically — forcing every
 * call site through this wrapper would have been a much larger, riskier
 * refactor than migrating the import source only. Both approaches use the
 * exact same Phosphor icon set and size/weight/tone conventions.
 */
export function AppIcon({
  name,
  size = "standard",
  weight = "regular",
  tone = "current",
  className,
  ariaLabel,
}: AppIconProps) {
  const IconComponent = AppIcons[name];
  const px = typeof size === "number" ? size : ICON_SIZE[size];
  return (
    <IconComponent
      size={px}
      weight={weight}
      className={cn(TONE_CLASS[tone], className)}
      aria-hidden={ariaLabel ? undefined : true}
      aria-label={ariaLabel}
      role={ariaLabel ? "img" : undefined}
    />
  );
}

export type { Icon as PhosphorIcon };

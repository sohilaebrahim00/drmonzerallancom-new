import { Link } from "react-router-dom";
import type { Icon } from "@phosphor-icons/react";

import { hapticTap } from "@/lib/haptics";

interface QuickActionProps {
  icon: Icon;
  label: string;
  to: string;
}

/** One tile in Home's 4-up quick-action row — an app action, not a website card. No paragraphs. */
export function QuickAction({ icon: IconComponent, label, to }: QuickActionProps) {
  return (
    <Link
      to={to}
      onClick={hapticTap}
      className="flex flex-1 flex-col items-center gap-2 rounded-2xl border border-border/70 bg-card py-4 text-center shadow-sm transition-colors hover:bg-secondary active:scale-[0.97]"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
        <IconComponent className="h-5 w-5" weight="regular" />
      </span>
      <span className="px-1 text-xs font-semibold leading-tight text-navy">{label}</span>
    </Link>
  );
}

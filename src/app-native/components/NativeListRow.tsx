import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, type LucideIcon } from "lucide-react";

import { hapticTap } from "@/lib/haptics";
import { cn } from "@/lib/utils";

interface NativeListRowProps {
  icon?: LucideIcon;
  label: string;
  value?: string;
  to?: string;
  onClick?: () => void;
  danger?: boolean;
  right?: ReactNode;
  chevron?: boolean;
}

/** One row in an Account/Settings-style list — the primitive every settings screen is built from. */
export function NativeListRow({
  icon: Icon,
  label,
  value,
  to,
  onClick,
  danger = false,
  right,
  chevron = true,
}: NativeListRowProps) {
  const content = (
    <>
      {Icon && (
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            danger ? "bg-destructive/10 text-destructive" : "bg-secondary text-primary",
          )}
        >
          <Icon className="h-4.5 w-4.5" />
        </span>
      )}
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-sm font-semibold",
          danger ? "text-destructive" : "text-navy",
        )}
      >
        {label}
      </span>
      {value && <span className="shrink-0 text-xs text-muted-foreground">{value}</span>}
      {right}
      {(to || onClick) && chevron && (
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
    </>
  );

  const className =
    "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-secondary touch-manipulation";

  if (to) {
    return (
      <Link to={to} onClick={hapticTap} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        hapticTap();
        onClick?.();
      }}
      className={className}
    >
      {content}
    </button>
  );
}

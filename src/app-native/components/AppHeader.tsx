import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";

import { cn } from "@/lib/utils";

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
  transparent?: boolean;
  className?: string;
}

/**
 * The one compact header used across every native screen — never the
 * website's tall marketing header. `onBack` presence is what decides
 * whether a back chevron renders (root tab screens omit it).
 */
export function AppHeader({
  title,
  subtitle,
  onBack,
  right,
  transparent,
  className,
}: AppHeaderProps) {
  return (
    <header
      className={cn(
        "native-safe-top sticky top-0 z-30 w-full",
        !transparent && "border-b border-border/60 bg-background/95 backdrop-blur-lg",
        className,
      )}
    >
      <div className="flex h-14 w-full items-center gap-2 px-2">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-navy transition-colors hover:bg-secondary"
          >
            <ChevronLeft className="h-5.5 w-5.5" />
          </button>
        ) : (
          <span className="w-2 shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          {title && (
            <h1 className="truncate font-display text-base font-bold text-navy">{title}</h1>
          )}
          {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {right && <div className="shrink-0 pr-1">{right}</div>}
      </div>
    </header>
  );
}

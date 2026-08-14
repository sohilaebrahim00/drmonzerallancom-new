import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  body?: string;
  action?: ReactNode;
}

/** A designed empty state — never a bare blank area. Used across Home/Program/Social/Messages. */
export function EmptyState({ icon: Icon, title, body, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-app-surface-secondary px-6 py-9 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-primary shadow-sm">
        <Icon className="h-5 w-5" />
      </span>
      <p className="font-display text-sm font-bold text-navy">{title}</p>
      {body && (
        <p className="max-w-[220px] text-xs leading-relaxed text-muted-foreground">{body}</p>
      )}
      {action && <div className="mt-1.5">{action}</div>}
    </div>
  );
}

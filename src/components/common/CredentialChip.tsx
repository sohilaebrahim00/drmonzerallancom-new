import type { Credential } from "@/data/about";
import { cn } from "@/lib/utils";

interface CredentialChipProps {
  credential: Credential;
  /**
   * `pill` is the compact form used where credentials are a supporting detail
   * (the home About preview); `card` adds the description and is used where
   * they are the subject (the About page's Professional Background block).
   */
  variant?: "pill" | "card";
  className?: string;
}

/**
 * One rendering of a credential, shared between the home preview and the
 * About page. Both drew their own pill/card from the same `credentials` array,
 * so the two drifted in radius, border and icon treatment.
 */
export function CredentialChip({ credential, variant = "pill", className }: CredentialChipProps) {
  if (variant === "pill") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-4 py-2 text-xs font-semibold text-navy/80",
          className,
        )}
      >
        <credential.icon className="h-3.5 w-3.5 text-primary" />
        {credential.title}
      </span>
    );
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3.5 rounded-xl border border-border/60 bg-card p-4 transition-colors hover:border-turquoise/60",
        className,
      )}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
        <credential.icon className="h-4.5 w-4.5" />
      </div>
      <div>
        <p className="text-sm font-semibold text-navy">{credential.title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          {credential.description}
        </p>
      </div>
    </div>
  );
}

import type { Credential } from "@/data/about";
import { cn } from "@/lib/utils";
import { useTranslate, CREDENTIAL_LABELS, type SimpleTranslationKey } from "@/i18n";

interface CredentialChipProps {
  credential: Credential;
  /** Optional translated display. Falls back to the English in `credential`. */
  titleKey?: SimpleTranslationKey;
  descriptionKey?: SimpleTranslationKey;
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
export function CredentialChip({
  credential,
  variant = "pill",
  className,
  titleKey,
  descriptionKey,
}: CredentialChipProps) {
  const t = useTranslate();
  // Fall back to the shared map, not to the English: a caller that forgets
  // to pass the keys should still render Arabic. Only a credential missing
  // from the map falls through to its stored English.
  const mapped = CREDENTIAL_LABELS[credential.title];
  const resolvedTitle = titleKey ?? mapped?.title;
  const resolvedDescription = descriptionKey ?? mapped?.description;
  const title = resolvedTitle ? t(resolvedTitle) : credential.title;
  const description = resolvedDescription ? t(resolvedDescription) : credential.description;
  if (variant === "pill") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-4 py-2 text-xs font-semibold text-navy/80",
          className,
        )}
      >
        <credential.icon className="h-3.5 w-3.5 text-primary" />
        {title}
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
        <p dir="auto" className="text-sm font-semibold text-navy">
          {title}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

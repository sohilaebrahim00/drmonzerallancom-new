import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  /** Optional: some page headings have no kicker above them. */
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
  /** Anchor for the section's aria-labelledby. */
  id?: string;
  /** A page's primary heading is an h1; a section within it is an h2. */
  level?: "h1" | "h2";
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
  id,
  level = "h2",
}: SectionHeadingProps) {
  const Title = level;

  return (
    /* No entrance animation. A heading appearing is not a sequence and not an
       affordance — and this component renders on nearly every section of the
       site, so a fade here WAS the blanket. */
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className,
      )}
    >
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">{eyebrow}</p>
      )}
      <Title
        id={id}
        className={cn(
          "max-w-2xl font-display font-extrabold leading-[1.15] tracking-tight text-navy",
          level === "h1" ? "text-3xl sm:text-4xl md:text-5xl" : "text-3xl sm:text-4xl",
          align === "center" && "mx-auto",
        )}
      >
        {title}
      </Title>
      {description && (
        <p
          className={cn(
            "max-w-2xl text-base leading-relaxed text-muted-foreground",
            align === "center" && "mx-auto",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}

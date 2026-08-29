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
        align === "center" ? "items-center text-center" : "items-start text-start",
        className,
      )}
    >
      {/* dir="auto" goes on these LEAVES, not on the wrapper above. `dir` sets
          direction for an element's children, so on the flex container it would
          reorder the block from whatever its first strong character happens to
          be — a layout bug in place of a punctuation one. The page-level dir
          remains the authority for layout.

          What it fixes: a Latin run inside an RTL page puts its trailing
          neutral characters on the paragraph's side, so "Knowledge." rendered
          as ".Knowledge". This is not only a transitional problem — the site
          will always contain Latin inside Arabic (prices, "Google Meet",
          email addresses, the doctor's name in Latin script). */}
      {eyebrow && (
        <p dir="auto" className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
          {eyebrow}
        </p>
      )}
      <Title
        id={id}
        dir="auto"
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
          dir="auto"
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

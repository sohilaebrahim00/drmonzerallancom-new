import portrait from "@/assets/monzer-portrait.jpg.asset.json";

/**
 * Editorial portrait composition — organic shape, soft shadow, thin curved
 * accent ring and negative space. Not a basic rectangular card.
 */
export function Portrait() {
  return (
    <div className="animate-portrait relative mx-auto w-full max-w-md lg:max-w-none">
      {/* Soft organic background shape */}
      <div
        className="animate-float-slower absolute inset-0 -z-10 bg-gradient-to-br from-secondary to-accent"
        style={{ borderRadius: "62% 38% 46% 54% / 56% 44% 56% 44%" }}
      />
      <div
        className="absolute -inset-3 -z-10 bg-primary/5 blur-2xl"
        style={{ borderRadius: "62% 38% 46% 54% / 56% 44% 56% 44%" }}
      />

      {/* Thin curved accent ring */}
      <svg
        className="absolute -inset-4 h-[calc(100%+2rem)] w-[calc(100%+2rem)]"
        viewBox="0 0 100 100"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M50 2 C 78 2 98 24 98 52 C 98 82 76 98 48 98 C 20 98 2 76 2 48"
          stroke="var(--color-gold)"
          strokeOpacity="0.55"
          strokeWidth="0.5"
          strokeLinecap="round"
        />
      </svg>

      {/* The portrait inside an organic mask */}
      <div
        className="relative overflow-hidden shadow-[0_30px_70px_-30px_rgba(60,60,40,0.45)]"
        style={{ borderRadius: "60% 40% 44% 56% / 54% 46% 54% 46%" }}
      >
        <img
          src={portrait.url}
          alt="Monzer Allan, Nutrition Specialist and Pharmacist, at his desk"
          width={960}
          height={1280}
          loading="eager"
          className="aspect-[3/3.6] w-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/15 via-transparent to-transparent" />
      </div>

      {/* Floating soft accent dot */}
      <div className="animate-float-slow absolute -right-2 top-8 h-16 w-16 rounded-full bg-gold/20 blur-md" />
    </div>
  );
}

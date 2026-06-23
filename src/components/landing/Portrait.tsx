import portrait from "@/assets/monzer-portrait.jpg.asset.json";

/**
 * Editorial portrait composition — organic arched frame with soft aqua /
 * turquoise accents, gentle gradient overlay to calm office background.
 */
export function Portrait() {
  return (
    <div className="animate-portrait relative mx-auto w-full max-w-md lg:max-w-lg">
      {/* Soft aqua + light-blue radial gradient behind portrait */}
      <div
        className="animate-float-slower absolute inset-0 -z-10"
        style={{
          borderRadius: "62% 38% 46% 54% / 56% 44% 56% 44%",
          background:
            "radial-gradient(120% 120% at 30% 20%, var(--color-secondary) 0%, rgba(56,183,199,0.18) 55%, rgba(37,63,164,0.06) 100%)",
        }}
      />
      <div
        className="absolute -inset-3 -z-10 bg-turquoise/10 blur-2xl"
        style={{ borderRadius: "62% 38% 46% 54% / 56% 44% 56% 44%" }}
      />

      {/* Thin curved aqua/turquoise accent ring */}
      <svg
        className="absolute -inset-4 h-[calc(100%+2rem)] w-[calc(100%+2rem)]"
        viewBox="0 0 100 100"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M50 2 C 78 2 98 24 98 52 C 98 82 76 98 48 98 C 20 98 2 76 2 48"
          stroke="var(--color-turquoise)"
          strokeOpacity="0.6"
          strokeWidth="0.5"
          strokeLinecap="round"
        />
      </svg>

      {/* The portrait inside an organic arched mask */}
      <div
        className="relative overflow-hidden ring-1 ring-secondary shadow-[0_30px_70px_-30px_rgba(23,35,59,0.4)]"
        style={{ borderRadius: "60% 40% 44% 56% / 54% 46% 54% 46%" }}
      >
        <img
          src={portrait.url}
          alt="Monzer Allan, Nutrition Specialist and Pharmacist, at his desk"
          width={960}
          height={1280}
          loading="eager"
          className="aspect-[3/3.5] w-full object-cover object-top"
        />
        {/* Soft gradient overlay to calm office background, keep face sharp */}
        <div className="absolute inset-0 bg-gradient-to-t from-navy/25 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/30 via-transparent to-turquoise/10" />
      </div>

      {/* Floating soft accent dots */}
      <div className="animate-float-slow absolute -right-2 top-8 h-16 w-16 rounded-full bg-turquoise/15 blur-md" />
      <div className="animate-float-slower absolute -left-3 bottom-12 h-3 w-3 rounded-full bg-green/50" />
    </div>
  );
}

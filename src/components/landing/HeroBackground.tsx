/**
 * Restrained abstract decoration inspired by the logo's shapes & colors.
 * Soft aqua / blue radial blooms and thin curved lines. Purely decorative.
 */
export function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Soft aqua + light-blue radial blooms */}
      <div className="animate-float-slow absolute -left-40 -top-44 h-[34rem] w-[34rem] rounded-full bg-secondary blur-3xl" />
      <div className="animate-float-slower absolute -right-32 top-1/4 h-[30rem] w-[30rem] rounded-full bg-turquoise/10 blur-3xl" />
      <div className="animate-float-slow absolute -bottom-52 left-1/3 h-[28rem] w-[28rem] rounded-full bg-primary/5 blur-3xl" />

      {/* Thin curved lines inspired by the logo */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1440 900"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        <path
          d="M-40 640 C 320 500 520 780 880 620 C 1140 500 1300 620 1520 520"
          stroke="var(--color-turquoise)"
          strokeOpacity="0.16"
          strokeWidth="1.2"
        />
        <path
          d="M-40 720 C 360 580 560 860 920 700 C 1180 580 1320 700 1520 600"
          stroke="var(--color-primary)"
          strokeOpacity="0.1"
          strokeWidth="1"
        />
      </svg>

      {/* Minimal grain texture */}
      <div className="grain absolute inset-0 opacity-[0.025] mix-blend-multiply" />
    </div>
  );
}

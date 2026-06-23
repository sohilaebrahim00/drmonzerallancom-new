/**
 * Abstract, restrained wellness-inspired decoration for the hero.
 * Soft organic shapes, blurred gradients, thin curved lines, faint grain.
 * Purely decorative — hidden from assistive tech.
 */
export function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Blurred soft gradient blooms */}
      <div className="animate-float-slow absolute -left-32 -top-40 h-[34rem] w-[34rem] rounded-full bg-primary/10 blur-3xl" />
      <div className="animate-float-slower absolute -bottom-48 left-1/4 h-[28rem] w-[28rem] rounded-full bg-gold/15 blur-3xl" />
      <div className="animate-float-slow absolute -right-24 top-1/4 h-[26rem] w-[26rem] rounded-full bg-secondary/40 blur-3xl" />

      {/* Thin curved nature-inspired lines */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1440 900"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        <path
          d="M-40 620 C 320 480 520 760 880 600 C 1140 480 1300 600 1520 500"
          stroke="var(--color-primary)"
          strokeOpacity="0.12"
          strokeWidth="1.2"
        />
        <path
          d="M-40 700 C 360 560 560 840 920 680 C 1180 560 1320 680 1520 580"
          stroke="var(--color-gold)"
          strokeOpacity="0.18"
          strokeWidth="1"
        />
        <path
          d="M120 80 C 280 200 240 360 420 420"
          stroke="var(--color-primary)"
          strokeOpacity="0.1"
          strokeWidth="1"
        />
      </svg>

      {/* Faint botanical-inspired soft circles */}
      <div className="absolute right-[12%] top-[14%] h-3 w-3 rounded-full bg-gold/40" />
      <div className="absolute left-[8%] top-[60%] h-2 w-2 rounded-full bg-primary/30" />
      <div className="absolute right-[30%] bottom-[16%] h-1.5 w-1.5 rounded-full bg-primary/40" />

      {/* Minimal grain texture */}
      <div className="grain absolute inset-0 opacity-[0.035] mix-blend-multiply" />
    </div>
  );
}

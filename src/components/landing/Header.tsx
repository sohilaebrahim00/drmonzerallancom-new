import logo from "@/assets/ma-logo.png.asset.json";
import { INSTAGRAM_URL, InstagramIcon } from "./instagram";

export function Header() {
  return (
    <header className="animate-fade-in relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-6 sm:px-10 sm:py-8">
      <a href="/" className="flex items-center gap-3" aria-label="Monzer Allan home">
        <img
          src={logo.url}
          alt="Monzer Allan logo"
          width={120}
          height={120}
          className="h-11 w-auto sm:h-12"
        />
        <span className="hidden font-display text-lg font-700 tracking-tight text-foreground sm:inline">
          Monzer Allan
        </span>
      </a>

      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/40 px-4 py-2 text-sm font-600 text-foreground/80 backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:bg-card hover:text-primary"
      >
        <InstagramIcon className="h-[1.05rem] w-[1.05rem] transition-transform duration-300 group-hover:scale-110" />
        <span>Instagram</span>
      </a>
    </header>
  );
}

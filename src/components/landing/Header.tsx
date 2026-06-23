import { InstagramIcon } from "./instagram";

export function Header() {
  return (
    <header className="animate-fade-in relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-6 sm:px-10 sm:py-7">
      <a href="/" className="flex items-center gap-2" aria-label="Monzer Allan home">
        <img
          src="/ma-logo.png"
          alt="Monzer Allan logo"
          width={140}
          height={140}
          className="h-14 w-auto sm:h-16"
        />
        <span className="hidden font-display text-lg font-bold tracking-tight text-navy sm:inline">
          Monzer Allan
        </span>
      </a>

      <a
        href="https://www.instagram.com/monzerallan/"
        target="_blank"
        rel="noopener noreferrer"
        className="group relative z-30 inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-2 text-sm font-semibold text-navy/80 backdrop-blur-sm transition-all duration-300 hover:border-turquoise hover:bg-card hover:text-turquoise"
      >
        <InstagramIcon className="h-[1.05rem] w-[1.05rem] transition-transform duration-300 group-hover:scale-110" />
        <span>Instagram</span>
      </a>
    </header>
  );
}

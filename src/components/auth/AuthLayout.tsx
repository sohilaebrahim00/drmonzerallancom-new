import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { Reveal } from "@/components/common/Reveal";

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-[calc(100vh-6rem)] items-center justify-center overflow-hidden px-6 py-16 sm:px-10">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-secondary/60 via-background to-background"
        aria-hidden="true"
      />
      <Reveal direction="up" className="w-full max-w-md">
        <div className="rounded-3xl border border-border/70 bg-card/95 p-8 shadow-[0_30px_70px_-30px_rgba(23,35,59,0.35)] backdrop-blur-xl sm:p-10">
          <div className="text-center">
            <Link to="/" aria-label="Monzer Allan home">
              <img
                src="/ma-logo.png"
                alt="Monzer Allan logo"
                width={163}
                height={140}
                className="mx-auto h-12 w-auto"
              />
            </Link>
            <h1 className="mt-5 font-display text-2xl font-extrabold tracking-tight text-navy">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
        </div>
      </Reveal>
    </div>
  );
}

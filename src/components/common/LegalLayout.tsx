import type { ReactNode } from "react";
import { Reveal } from "@/components/common/Reveal";

interface LegalLayoutProps {
  title: string;
  updated: string;
  children: ReactNode;
}

export function LegalLayout({ title, updated, children }: LegalLayoutProps) {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16 sm:px-10 sm:py-20">
      <Reveal direction="up">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated: {updated}</p>
      </Reveal>
      <Reveal
        direction="up"
        delay={0.1}
        className="prose-legal mt-10 space-y-6 text-sm leading-relaxed text-muted-foreground sm:text-base [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-navy [&_h2]:mt-8 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5"
      >
        {children}
      </Reveal>
    </div>
  );
}

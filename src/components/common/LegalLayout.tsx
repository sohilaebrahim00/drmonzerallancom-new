import type { ReactNode } from "react";

import { useLocale, useTranslate } from "@/i18n";

interface LegalLayoutProps {
  title: string;
  updated: string;
  children: ReactNode;
}

export function LegalLayout({ title, updated, children }: LegalLayoutProps) {
  const t = useTranslate();
  const { locale } = useLocale();

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16 sm:px-10 sm:py-20">
      {/* Privacy, Terms and the Medical Disclaimer stay ENGLISH ONLY. A
          translated legal document creates ambiguity about which version
          governs in a dispute, which is why many organisations keep one
          authoritative language on purpose. Instead of translating the text we
          say plainly, in Arabic, that the English is the version that applies.

          The notice is rendered dir="rtl" regardless of the surrounding page
          because its content is Arabic — the body below it stays English and
          stays LTR. */}
      {locale !== "en" && (
        <p
          dir="rtl"
          lang="ar"
          className="mb-8 rounded-xl border border-border/70 bg-secondary/40 px-4 py-3 text-sm leading-loose text-navy"
        >
          {t("legal.englishAuthoritative")}
        </p>
      )}
      <div dir="ltr" lang="en">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated: {updated}</p>
      </div>
      <div className="prose-legal mt-10 space-y-6 text-sm leading-relaxed text-muted-foreground sm:text-base [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-navy [&_h2]:mt-8 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:ps-5 [&_ul]:space-y-1.5">
        {children}
      </div>
    </div>
  );
}

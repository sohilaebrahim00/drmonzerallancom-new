import { Link } from "react-router-dom";
import { MessageCircle, Sparkles, XCircle } from "lucide-react";

import { Seo } from "@/components/seo/Seo";
import { Reveal } from "@/components/common/Reveal";
import { whatsappLink } from "@/config/contact";
import { useTranslate } from "@/i18n";

export default function MembershipCancelledPage() {
  const t = useTranslate();
  const waHref = whatsappLink(
    "Hello, I started a payment on Monzer Allan's website but had a question before completing it.",
  );

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-xl flex-col items-center justify-center px-6 py-24 text-center sm:px-10">
      <Seo
        title="Checkout Cancelled"
        description="Your checkout was cancelled — no payment was made."
        path="/membership/cancelled"
        noindex
      />
      <Reveal direction="up">
        <XCircle className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 dir="auto" className="mt-5 font-display text-2xl font-bold text-navy">
          {t("membership.cancelledTitle")}
        </h1>
        <p dir="auto" className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          {t("membership.cancelledBody")}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/packages"
            className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-turquoise"
          >
            <Sparkles className="h-4 w-4" /> {t("hero.viewPackages")}
          </Link>
          {waHref && (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold text-navy transition-colors hover:border-turquoise hover:text-turquoise"
            >
              <MessageCircle className="h-4 w-4" /> {t("membership.askQuestion")}
            </a>
          )}
        </div>
      </Reveal>
    </div>
  );
}

import { Link } from "react-router-dom";
import { MessageCircle, Sparkles, XCircle } from "lucide-react";

import { Seo } from "@/components/seo/Seo";
import { Reveal } from "@/components/common/Reveal";
import { whatsappLink } from "@/config/contact";

export default function MembershipCancelledPage() {
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
        <h1 className="mt-5 font-display text-2xl font-bold text-navy">Checkout Cancelled</h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          No payment was made and nothing was charged — whether you cancelled or the card was
          declined. You can pick up where you left off anytime.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/packages"
            className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-turquoise"
          >
            <Sparkles className="h-4 w-4" /> View Packages
          </Link>
          {waHref && (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold text-navy transition-colors hover:border-turquoise hover:text-turquoise"
            >
              <MessageCircle className="h-4 w-4" /> Ask a Question
            </a>
          )}
        </div>
      </Reveal>
    </div>
  );
}

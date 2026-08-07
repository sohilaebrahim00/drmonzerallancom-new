import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, Loader2, MessageCircle, TriangleAlert } from "lucide-react";

import { getBookingProvider, type PackageSlug } from "@/config/booking";
import { whatsappLink } from "@/config/contact";
import { packages } from "@/data/packages";

interface SchedulerEmbedProps {
  packageSlug: PackageSlug;
}

function SchedulerUnavailable({ packageSlug }: { packageSlug: PackageSlug }) {
  const pkg = packages.find((p) => p.slug === packageSlug);
  const waHref = whatsappLink(
    `Hello, I need assistance scheduling an online consultation${pkg ? ` for the ${pkg.name} plan` : ""}.`,
  );

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border/70 bg-secondary/30 px-6 py-14 text-center">
      <TriangleAlert className="h-8 w-8 text-primary/60" />
      <div>
        <p className="font-display text-lg font-bold text-navy">Scheduler Not Yet Connected</p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Online scheduling for this plan isn't connected yet. In the meantime, our team can help
          you book directly.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {waHref && (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-turquoise"
          >
            <MessageCircle className="h-4 w-4" /> Contact via WhatsApp
          </a>
        )}
        <Link
          to="/packages"
          className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-navy transition-colors hover:border-turquoise hover:text-turquoise"
        >
          Return to Packages
        </Link>
        <Link
          to="/contact"
          className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-navy transition-colors hover:border-turquoise hover:text-turquoise"
        >
          Contact Page
        </Link>
      </div>
    </div>
  );
}

export function SchedulerEmbed({ packageSlug }: SchedulerEmbedProps) {
  const provider = getBookingProvider(packageSlug);
  const [loaded, setLoaded] = useState(false);

  if (!provider.embedUrl) {
    return <SchedulerUnavailable packageSlug={packageSlug} />;
  }

  // Only the "google" provider is implemented today. Swapping to Cal.com
  // later means adding a branch here (and in src/config/booking.ts) —
  // nothing in the booking page itself needs to change.
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b border-border/60 bg-secondary/40 px-4 py-3">
        <CalendarClock className="h-4 w-4 text-primary" />
        <p className="text-xs font-semibold text-navy">
          Live availability — subject to change until you complete your booking below.
        </p>
      </div>
      <div className="relative">
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-card">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        <iframe
          title="Book an online consultation"
          src={provider.embedUrl}
          className="h-[720px] w-full"
          loading="lazy"
          onLoad={() => setLoaded(true)}
        />
      </div>
    </div>
  );
}

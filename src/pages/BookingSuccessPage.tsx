import { useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CalendarCheck, Home, Mail, MessageCircle, RefreshCcw, Video } from "lucide-react";

import { Seo } from "@/components/seo/Seo";
import { packages } from "@/data/packages";
import { whatsappLink } from "@/config/contact";

interface SuccessState {
  packageSlug?: string;
  timeZone?: string;
}

export default function BookingSuccessPage() {
  const location = useLocation();
  const state = (location.state ?? {}) as SuccessState;
  const selectedPackage = packages.find((pkg) => pkg.slug === state.packageSlug);
  const supportHref = whatsappLink(
    "Hello, I just booked an online consultation and had a quick question.",
  );

  if (!selectedPackage) {
    return (
      <div className="mx-auto flex min-h-[50vh] w-full max-w-xl flex-col items-center justify-center px-6 py-24 text-center sm:px-10">
        <Seo
          title="Booking"
          description="Schedule your online consultation."
          path="/booking/success"
          noindex
        />
        <p className="font-display text-xl font-bold text-navy">Nothing to show yet</p>
        <p className="mt-3 text-sm text-muted-foreground">
          Looks like you landed here directly. Start a new booking to schedule your consultation.
        </p>
        <Link
          to="/booking"
          className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-turquoise"
        >
          <CalendarCheck className="h-4 w-4" /> Go to Booking
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl px-6 py-16 text-center sm:px-10 sm:py-20">
      <Seo
        title="Booking Received"
        description="Your consultation booking has been received."
        path="/booking/success"
        noindex
      />

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 16 }}
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-turquoise/15 text-turquoise"
      >
        <CalendarCheck className="h-10 w-10" />
      </motion.div>

      <h1 className="mt-6 font-display text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
        You're All Set
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        If you completed your booking in the scheduler, your consultation request has been sent to
        Google Calendar for the <strong className="text-navy">{selectedPackage.name}</strong> plan.
      </p>

      <div className="mt-8 space-y-3 rounded-2xl border border-border/70 bg-card p-6 text-left shadow-sm">
        <div className="flex items-start gap-3">
          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-sm text-navy/80">
            Google will email your confirmed date, time
            {state.timeZone ? ` (${state.timeZone})` : ""}, and calendar invite to the address you
            booked with.
          </p>
        </div>
        <div className="flex items-start gap-3">
          <Video className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-sm text-navy/80">
            Your session takes place over Google Meet — the join link is included in that calendar
            invite.
          </p>
        </div>
        <div className="flex items-start gap-3">
          <RefreshCcw className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-sm text-navy/80">
            Need to reschedule or cancel? Use the link in your calendar invite, or reach out to us
            directly.
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-turquoise"
        >
          <Home className="h-4 w-4" /> Return to Home
        </Link>
        {supportHref ? (
          <a
            href={supportHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold text-navy transition-colors hover:border-turquoise hover:text-turquoise"
          >
            <MessageCircle className="h-4 w-4" /> Contact Support
          </a>
        ) : (
          <Link
            to="/contact"
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold text-navy transition-colors hover:border-turquoise hover:text-turquoise"
          >
            Contact Support
          </Link>
        )}
      </div>
    </div>
  );
}

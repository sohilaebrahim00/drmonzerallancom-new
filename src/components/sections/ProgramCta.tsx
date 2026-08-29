import { Link } from "react-router-dom";
import { Sparkles, UserRound } from "lucide-react";

import { useAuth } from "@/context/AuthContext";

export function ProgramCta() {
  const { user } = useAuth();

  return (
    <section className="relative py-20 sm:py-28" aria-labelledby="program-cta-heading">
      <div className="mx-auto w-full max-w-4xl px-6 text-center sm:px-10">
        <div className="rounded-3xl border border-border/70 bg-gradient-to-br from-navy to-primary p-10 text-white shadow-[0_30px_70px_-30px_rgba(23,35,59,0.5)] sm:p-14">
          <h2
            dir="auto"
            id="program-cta-heading"
            className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl"
          >
            Ready to Start Your Personalized Nutrition Journey?
          </h2>
          <p
            dir="auto"
            className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base"
          >
            Choose a one-time Treatment program and get access to consultation credits and ongoing
            guidance from {"Dr. Monzer Allan"} — no recurring billing.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/packages"
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-turquoise px-6 py-3 text-sm font-semibold text-navy transition-all duration-300 hover:-translate-y-0.5 hover:bg-turquoise/90"
            >
              <Sparkles className="h-4 w-4" /> Choose Your Program
            </Link>
            {user && (
              <Link
                to="/account"
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/10"
              >
                <UserRound className="h-4 w-4" /> Go to My Account
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

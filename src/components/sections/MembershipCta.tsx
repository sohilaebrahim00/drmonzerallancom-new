import { Link } from "react-router-dom";
import { Sparkles, UserRound } from "lucide-react";

import { Reveal } from "@/components/common/Reveal";
import { useAuth } from "@/context/AuthContext";

export function MembershipCta() {
  const { user } = useAuth();

  return (
    <section className="relative py-20 sm:py-28" aria-labelledby="membership-cta-heading">
      <div className="mx-auto w-full max-w-4xl px-6 text-center sm:px-10">
        <Reveal
          direction="up"
          className="rounded-3xl border border-border/70 bg-gradient-to-br from-navy to-primary p-10 text-white shadow-[0_30px_70px_-30px_rgba(23,35,59,0.5)] sm:p-14"
        >
          <h2
            id="membership-cta-heading"
            className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl"
          >
            Ready to Start Your Personalized Nutrition Journey?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">
            Choose a membership package and get access to consultation credits, priority booking,
            and ongoing guidance from {"Dr. Monzer Allan"}.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/packages"
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-turquoise px-6 py-3 text-sm font-semibold text-navy transition-all duration-300 hover:-translate-y-0.5 hover:bg-turquoise/90"
            >
              <Sparkles className="h-4 w-4" /> View Memberships
            </Link>
            {user ? (
              <Link
                to="/account"
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/10"
              >
                <UserRound className="h-4 w-4" /> Go to My Account
              </Link>
            ) : (
              <Link
                to="/join"
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/10"
              >
                <UserRound className="h-4 w-4" /> Create Account
              </Link>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

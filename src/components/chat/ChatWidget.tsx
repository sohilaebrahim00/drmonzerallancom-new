import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookOpen,
  CalendarCheck,
  MessageCircle,
  Package,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";

import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { isWhatsAppConfigured, whatsappLink } from "@/config/contact";
import { business } from "@/data/business";

type QuickAction =
  | { label: string; description: string; icon: typeof Sparkles; kind: "nav"; to: string }
  | {
      label: string;
      description: string;
      icon: typeof Sparkles;
      kind: "whatsapp";
      message: string;
    };

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Find the Right Membership",
    description: "Compare Basic, Premium, and VIP Elite",
    icon: Sparkles,
    kind: "nav",
    to: "/packages",
  },
  {
    label: "Request a Consultation",
    description: "See membership plans with consultation credits",
    icon: CalendarCheck,
    kind: "nav",
    to: "/packages",
  },
  {
    label: "Explore Products",
    description: "Wellness products & availability",
    icon: Package,
    kind: "nav",
    to: "/products",
  },
  {
    label: "Ask About Nutrition Services",
    description: "General questions, answered by our team",
    icon: MessageCircle,
    kind: "whatsapp",
    message: `Hello, I'm visiting ${business.doctorName}'s website and would like to ask about nutrition services.`,
  },
  {
    label: "Browse Educational Content",
    description: "Evidence-based nutrition articles",
    icon: BookOpen,
    kind: "nav",
    to: "/blog",
  },
];

const PAGE_PROMPTS: { prefix: string; prompt: string }[] = [
  { prefix: "/packages", prompt: "Need help choosing a membership?" },
  { prefix: "/join", prompt: "Need help choosing a membership?" },
  { prefix: "/products", prompt: "Have a question about a product?" },
  { prefix: "/blog", prompt: "Looking for information on a specific topic?" },
  { prefix: "/gallery", prompt: "Want to see more from the practice?" },
  { prefix: "/faq", prompt: "Can't find the answer you're looking for?" },
];

function usePagePrompt() {
  const { pathname } = useLocation();
  return (
    PAGE_PROMPTS.find((p) => pathname.startsWith(p.prefix))?.prompt ??
    "Choose an option below to get started."
  );
}

export function ChatWidget() {
  const pagePrompt = usePagePrompt();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <motion.button
          type="button"
          aria-label="Open chat — Dr. Monzer Allan's virtual assistant"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 260, damping: 18 }}
          className="group fixed bottom-6 right-5 z-40 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-navy text-white shadow-[0_10px_30px_-8px_rgba(37,63,164,0.6)] outline-none transition-transform duration-300 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-turquoise focus-visible:ring-offset-2 sm:bottom-8 sm:right-8"
        >
          <span
            className="absolute inset-0 -z-10 rounded-full bg-turquoise/40 blur-xl transition-opacity duration-300 group-hover:opacity-80 motion-safe:animate-pulse"
            aria-hidden="true"
          />
          <MessageCircle className="h-6 w-6" />
          <span
            className="absolute right-0.5 top-0.5 h-3 w-3 rounded-full bg-green ring-2 ring-navy"
            aria-hidden="true"
          />
        </motion.button>
      </PopoverTrigger>

      <PopoverContent
        side="top"
        align="end"
        sideOffset={16}
        className="w-[min(22rem,calc(100vw-2.5rem))] rounded-2xl border border-white/40 bg-card/95 p-0 shadow-[0_30px_60px_-24px_rgba(23,35,59,0.45)] backdrop-blur-xl"
      >
        <div className="flex items-start justify-between gap-3 rounded-t-2xl bg-gradient-to-br from-navy to-primary p-5 text-white">
          <div>
            <p className="font-display text-base font-bold">
              Hi, I&apos;m {business.doctorName}&apos;s virtual assistant
            </p>
            <p className="mt-1 text-xs text-white/75">{pagePrompt}</p>
          </div>
          <PopoverClose
            aria-label="Close chat"
            className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <X className="h-4 w-4" />
          </PopoverClose>
        </div>

        <div className="space-y-1.5 p-3">
          {QUICK_ACTIONS.map((action) => {
            if (action.kind === "nav") {
              return (
                <Link
                  key={action.label}
                  to={action.to}
                  className="flex cursor-pointer items-start gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                    <action.icon className="h-4.5 w-4.5" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-navy">{action.label}</span>
                    <span className="block text-xs text-muted-foreground">
                      {action.description}
                    </span>
                  </span>
                </Link>
              );
            }

            const href = whatsappLink(action.message);
            return href ? (
              <a
                key={action.label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex cursor-pointer items-start gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                  <action.icon className="h-4.5 w-4.5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-navy">{action.label}</span>
                  <span className="block text-xs text-muted-foreground">{action.description}</span>
                </span>
              </a>
            ) : (
              <Link
                key={action.label}
                to="/contact"
                className="flex cursor-pointer items-start gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                  <action.icon className="h-4.5 w-4.5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-navy">{action.label}</span>
                  <span className="block text-xs text-muted-foreground">
                    Contact us on the Contact page
                  </span>
                </span>
              </Link>
            );
          })}
        </div>

        {!isWhatsAppConfigured && (
          <p className="border-t border-border/60 px-4 py-2.5 text-[0.7rem] leading-relaxed text-muted-foreground">
            WhatsApp isn&apos;t connected yet — the options above open our Contact page instead.
          </p>
        )}

        <div className="flex items-start gap-2 rounded-b-2xl border-t border-border/60 bg-secondary/40 p-4">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <p className="text-[0.7rem] leading-relaxed text-muted-foreground">
            This assistant does not diagnose or replace a physician. Please do not send urgent or
            highly sensitive medical information through this chat. If you are experiencing a
            medical emergency, contact your local emergency services.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

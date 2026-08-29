import { Link } from "react-router-dom";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { SocialLinks } from "@/components/common/SocialLinks";
import { business, tel } from "@/data/business";
import { whatsappLink } from "@/config/contact";
import { services } from "@/data/services";

const NAV_LINKS = [
  { label: "About", href: "/about" },
  { label: "Packages", href: "/packages" },
  { label: "Shop", href: "/products" },
  { label: "Blog", href: "/blog" },
  { label: "Gallery", href: "/gallery" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Medical Disclaimer", href: "/medical-disclaimer" },
];

export function Footer() {
  const year = new Date().getFullYear();
  const waHref = whatsappLink(
    "Hello, I'm visiting Dr. Monzer Allan's website and would like assistance.",
  );
  const hasContactRow = business.phone || business.email || business.fullAddress || waHref;

  return (
    <footer className="relative z-10 border-t border-border/60 bg-card/40">
      <div className="mx-auto w-full max-w-7xl px-6 py-14 sm:px-10">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2" aria-label="Monzer Allan home">
              <img
                src="/ma-logo.png"
                alt="Monzer Allan logo"
                width={65}
                height={56}
                loading="lazy"
                decoding="async"
                className="h-12 w-auto"
              />
              <span className="font-display text-lg font-bold tracking-tight text-navy">
                {business.doctorName}
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Trusted nutrition, health, and wellness guidance from a {business.professionalTitle} —
              understand more, choose better, live healthier.
            </p>
            <SocialLinks className="mt-5" />
          </div>

          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wide text-navy">
              Navigation
            </h3>
            <ul className="mt-4 space-y-2.5">
              {NAV_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-turquoise"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wide text-navy">
              Popular Services
            </h3>
            <ul className="mt-4 space-y-2.5">
              {services.slice(0, 6).map((service) => (
                <li key={service.slug}>
                  <Link
                    to="/#services"
                    className="text-sm text-muted-foreground transition-colors hover:text-turquoise"
                  >
                    {service.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wide text-navy">
              Get in Touch
            </h3>
            {hasContactRow ? (
              <ul className="mt-4 space-y-3">
                {business.phone && (
                  <li className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-turquoise" />
                    <a
                      href={tel(business.phone)}
                      className="transition-colors hover:text-turquoise"
                    >
                      {business.phone}
                    </a>
                  </li>
                )}
                {business.email && (
                  <li className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-turquoise" />
                    <a
                      href={`mailto:${business.email}`}
                      className="break-all transition-colors hover:text-turquoise"
                    >
                      {business.email}
                    </a>
                  </li>
                )}
                {business.fullAddress && (
                  <li className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-turquoise" />
                    <span>{business.fullAddress}</span>
                  </li>
                )}
                {waHref && (
                  <li className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-turquoise" />
                    <a
                      href={waHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-colors hover:text-turquoise"
                    >
                      Message us on WhatsApp
                    </a>
                  </li>
                )}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Reach out via the{" "}
                <Link to="/contact" className="font-semibold text-primary hover:text-turquoise">
                  Contact page
                </Link>
                .
              </p>
            )}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-border/60 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            © {year} {business.doctorName}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-xs font-medium text-muted-foreground transition-colors hover:text-turquoise"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <p className="mt-4 max-w-2xl text-xs leading-relaxed text-muted-foreground/80">
          Educational content only and not a substitute for professional medical consultation.
          Always consult a qualified healthcare provider before making changes to your diet,
          especially if you have an existing medical condition.
        </p>
      </div>
    </footer>
  );
}

import { Link } from "react-router-dom";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { SocialLinks } from "@/components/common/SocialLinks";
import { business, tel } from "@/data/business";
import { whatsappLink } from "@/config/contact";
import { services } from "@/data/services";
import { useTranslate, type SimpleTranslationKey, serviceTitle } from "@/i18n";

const NAV_LINKS: { labelKey: SimpleTranslationKey; href: string }[] = [
  { labelKey: "nav.about", href: "/about" },
  { labelKey: "nav.packages", href: "/packages" },
  { labelKey: "nav.shop", href: "/products" },
  { labelKey: "nav.blog", href: "/blog" },
  { labelKey: "nav.gallery", href: "/gallery" },
  { labelKey: "nav.faq", href: "/faq" },
  { labelKey: "nav.contact", href: "/contact" },
];

const LEGAL_LINKS: { labelKey: SimpleTranslationKey; href: string }[] = [
  { labelKey: "footer.privacy", href: "/privacy-policy" },
  { labelKey: "footer.terms", href: "/terms" },
  { labelKey: "footer.medicalDisclaimer", href: "/medical-disclaimer" },
];

export function Footer() {
  const t = useTranslate();
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
            <Link to="/" className="flex items-center gap-2" aria-label={t("header.homeAriaLabel")}>
              <img
                src="/ma-logo.png"
                alt={t("header.logoAlt")}
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
              {t("footer.tagline", { title: business.professionalTitle })}
            </p>
            <SocialLinks className="mt-5" />
          </div>

          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wide text-navy">
              {t("footer.navigation")}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {NAV_LINKS.map((link) => (
                <li key={t(link.labelKey)}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-turquoise"
                  >
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wide text-navy">
              {t("footer.popularServices")}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {services.slice(0, 6).map((service) => (
                <li key={service.slug}>
                  <Link
                    to="/#services"
                    className="text-sm text-muted-foreground transition-colors hover:text-turquoise"
                  >
                    {serviceTitle(service, t)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wide text-navy">
              {t("footer.getInTouch")}
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
                {t("footer.reachOut")}{" "}
                <Link to="/contact" className="font-semibold text-primary hover:text-turquoise">
                  {t("footer.contactPage")}
                </Link>
                .
              </p>
            )}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-border/60 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {t("footer.rights", { year: String(year), name: business.doctorName })}
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-xs font-medium text-muted-foreground transition-colors hover:text-turquoise"
              >
                {t(link.labelKey)}
              </Link>
            ))}
          </div>
        </div>
        <p className="mt-4 max-w-2xl text-xs leading-relaxed text-muted-foreground/80">
          {t("footer.disclaimer")} {t("footer.disclaimerConsult")}
        </p>
      </div>
    </footer>
  );
}

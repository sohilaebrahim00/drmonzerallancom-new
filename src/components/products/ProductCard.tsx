import { Link } from "react-router-dom";
import { ArrowUpRight, MessageCircle, PackageSearch } from "lucide-react";

import type { Product } from "@/data/products";
import { buildAvailabilityInquiryMessage, buildProductInquiryMessage } from "@/config/commerce";
import { whatsappLink } from "@/config/contact";
import { business } from "@/data/business";
import { SoldOutBadge } from "@/components/products/SoldOutBadge";
import { Photo } from "@/components/common/Photo";
import { useTranslate, PRODUCT_CATEGORY_LABELS } from "@/i18n";

export function ProductCard({ product }: { product: Product }) {
  const t = useTranslate();
  const isSoldOut = product.availability === "sold-out";
  const pageUrl = `${business.domain}/products/${product.slug}`;
  const availabilityHref = whatsappLink(buildAvailabilityInquiryMessage(product.name));
  const inquiryHref = whatsappLink(buildProductInquiryMessage(product.name, pageUrl));

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-turquoise/50 hover:shadow-[0_24px_50px_-24px_rgba(23,35,59,0.35)]">
      <div className="relative flex h-56 items-center justify-center overflow-hidden bg-secondary/40 p-4">
        {product.mainImage ? (
          <Photo
            src={product.mainImage}
            alt={product.name}
            width={480}
            height={480}
            className="block h-full w-full"
            imgClassName="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <PackageSearch className="h-10 w-10 text-primary/40" />
          </div>
        )}
        <span className="absolute start-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-navy">
          {t(PRODUCT_CATEGORY_LABELS[product.category])}
        </span>
        {isSoldOut && <SoldOutBadge className="absolute end-4 top-4" />}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-6">
        <h3 className="font-display text-lg font-bold leading-snug text-navy">{product.name}</h3>
        {(product.strength || product.quantity) && (
          <p className="text-xs font-medium text-muted-foreground">
            {[product.strength, product.quantity].filter(Boolean).join(" · ")}
          </p>
        )}
        <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
          {product.shortDescription}
        </p>
        <p className="font-display text-lg font-extrabold text-primary">{product.priceLabel}</p>

        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Link
            to={`/products/${product.slug}`}
            className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-border px-4 py-2 text-sm font-semibold text-navy transition-colors hover:border-turquoise hover:text-turquoise focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            View Details
            <ArrowUpRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
          </Link>
          {isSoldOut ? (
            availabilityHref ? (
              <a
                href={availabilityHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-border bg-secondary/60 px-4 py-2 text-sm font-semibold text-navy transition-colors hover:border-turquoise hover:text-turquoise focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label={`Ask about availability for ${product.name}`}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Ask About Availability
              </a>
            ) : (
              <Link
                to="/contact"
                className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-border bg-secondary/60 px-4 py-2 text-sm font-semibold text-navy transition-colors hover:border-turquoise hover:text-turquoise focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Ask About Availability
              </Link>
            )
          ) : inquiryHref ? (
            <a
              href={inquiryHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-turquoise focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Ask About This
            </a>
          ) : (
            <Link
              to="/contact"
              className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-turquoise focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Ask About This
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

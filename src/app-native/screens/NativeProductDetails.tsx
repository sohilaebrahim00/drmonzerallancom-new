import { useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { MessageCircle, PackageSearch } from "lucide-react";

import { AppScreen } from "@/app-native/components/AppScreen";
import { SoldOutBadge } from "@/components/products/SoldOutBadge";
import { getProductBySlug } from "@/data/products";
import { buildAvailabilityInquiryMessage, buildProductInquiryMessage } from "@/config/commerce";
import { whatsappLink } from "@/config/contact";
import { business } from "@/data/business";
import { openExternal } from "@/lib/externalLink";
import { cn } from "@/lib/utils";

export default function NativeProductDetails() {
  const { slug } = useParams<{ slug: string }>();
  const product = slug ? getProductBySlug(slug) : undefined;
  const images = product ? [product.mainImage, ...product.gallery].filter(Boolean) : [];
  const [activeImage, setActiveImage] = useState(0);

  if (!product) return <Navigate to="/products" replace />;

  const isSoldOut = product.availability === "sold-out";
  const pageUrl = `${business.domain}/products/${product.slug}`;
  const availabilityHref = whatsappLink(buildAvailabilityInquiryMessage(product.name));
  const inquiryHref = whatsappLink(buildProductInquiryMessage(product.name, pageUrl));
  const ctaHref = isSoldOut ? availabilityHref : inquiryHref;
  const ctaLabel = isSoldOut ? "Ask About Availability" : "Ask About This Product";

  return (
    <AppScreen title={product.name} back className="mx-auto w-full max-w-lg px-4 pb-8 pt-3">
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-secondary/40 p-5">
        {images[activeImage] ? (
          <img
            src={images[activeImage]}
            alt={product.name}
            className="aspect-square w-full object-contain"
          />
        ) : (
          <div className="flex aspect-square w-full items-center justify-center">
            <PackageSearch className="h-14 w-14 text-primary/40" />
          </div>
        )}
        {isSoldOut && <SoldOutBadge className="absolute left-3 top-3" />}
      </div>
      {images.length > 1 && (
        <div className="mt-2.5 flex gap-2">
          {images.map((src, index) => (
            <button
              key={src}
              type="button"
              onClick={() => setActiveImage(index)}
              className={cn(
                "h-14 w-14 shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 bg-secondary/40 p-1",
                activeImage === index ? "border-primary" : "border-transparent",
              )}
            >
              <img src={src} alt="" className="h-full w-full object-contain" />
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-primary">
          {product.category}
        </span>
      </div>
      {(product.strength || product.quantity) && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          {[product.strength, product.quantity].filter(Boolean).join(" · ")}
        </p>
      )}
      <p className="mt-2 font-display text-xl font-extrabold text-primary">{product.priceLabel}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {product.shortDescription}
      </p>

      {product.highlights.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {product.highlights.map((h) => (
            <li key={h} className="flex items-start gap-2 text-sm text-navy/80">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-turquoise" />
              {h}
            </li>
          ))}
        </ul>
      )}

      {isSoldOut && (
        <div className="mt-4 rounded-lg bg-muted px-4 py-2.5 text-center text-sm font-semibold text-muted-foreground">
          Currently Out of Stock
        </div>
      )}

      {ctaHref ? (
        <button
          type="button"
          onClick={() => openExternal(ctaHref)}
          className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
        >
          <MessageCircle className="h-4 w-4" /> {ctaLabel}
        </button>
      ) : null}

      {Object.keys(product.specifications).length > 0 && (
        <div className="mt-5 rounded-xl border border-border/70 bg-card p-4">
          <h2 className="font-display text-sm font-bold text-navy">Specifications</h2>
          <dl className="mt-3 space-y-2">
            {Object.entries(product.specifications).map(([key, value]) => (
              <div key={key} className="flex justify-between gap-4 text-sm">
                <dt className="shrink-0 text-muted-foreground">{key}</dt>
                <dd className="text-right font-medium text-navy">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <p className="mt-5 rounded-xl border border-border/70 bg-secondary/40 p-4 text-xs leading-relaxed text-muted-foreground">
        Product information is provided for general informational purposes only. Dietary supplements
        are not intended to diagnose, treat, cure, or prevent any disease. Consult a qualified
        healthcare professional before use.
      </p>
    </AppScreen>
  );
}

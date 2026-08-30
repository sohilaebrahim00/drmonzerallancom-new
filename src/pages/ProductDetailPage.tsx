import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { MessageCircle, PackageSearch } from "lucide-react";

import { Seo } from "@/components/seo/Seo";
import { ProductCard } from "@/components/products/ProductCard";
import { SoldOutBadge } from "@/components/products/SoldOutBadge";
import { Photo } from "@/components/common/Photo";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getProductBySlug, getRelatedProducts } from "@/data/products";
import { buildAvailabilityInquiryMessage, buildProductInquiryMessage } from "@/config/commerce";
import { whatsappLink } from "@/config/contact";
import { business } from "@/data/business";
import { breadcrumbSchema, productSchema } from "@/lib/schema";
import { cn } from "@/lib/utils";
import {
  useTranslate,
  PRODUCT_CATEGORY_LABELS,
  productName,
  productShort,
  productFull,
  productHighlightText,
  productPriceLabel,
  productMeta,
  specKeyText,
  specValueText,
} from "@/i18n";

export default function ProductDetailPage() {
  const t = useTranslate();
  const { slug } = useParams<{ slug: string }>();
  const product = slug ? getProductBySlug(slug) : undefined;
  const images = product ? [product.mainImage, ...product.gallery].filter(Boolean) : [];
  const [activeImage, setActiveImage] = useState(0);

  if (!product) {
    return <Navigate to="/products" replace />;
  }

  const isSoldOut = product.availability === "sold-out";
  const pageUrl = `${business.domain}/products/${product.slug}`;
  const availabilityHref = whatsappLink(buildAvailabilityInquiryMessage(product.name));
  const inquiryHref = whatsappLink(buildProductInquiryMessage(product.name, pageUrl));
  const related = getRelatedProducts(product);

  const jsonLd = [
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Products", path: "/products" },
      { name: product.name, path: `/products/${product.slug}` },
    ]),
    productSchema(product, pageUrl),
  ];

  function showImage(index: number) {
    setActiveImage(((index % images.length) + images.length) % images.length);
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-16 sm:px-10 sm:py-20">
      <Seo
        title={productName(product, t)}
        description={productShort(product, t)}
        path={`/products/${product.slug}`}
        jsonLd={jsonLd}
      />

      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">{t("common.home")}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/products">{t("product.breadcrumb")}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{productName(product, t)}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div>
          <div
            role="group"
            aria-label={`${productName(product, t)} image gallery`}
            tabIndex={images.length > 1 ? 0 : undefined}
            onKeyDown={(e) => {
              if (images.length < 2) return;
              if (e.key === "ArrowRight") showImage(activeImage + 1);
              if (e.key === "ArrowLeft") showImage(activeImage - 1);
            }}
            className="relative overflow-hidden rounded-2xl border border-border/70 bg-secondary/40 p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {images[activeImage] ? (
              <Photo
                src={images[activeImage]}
                alt={productName(product, t)}
                width={800}
                height={800}
                priority
                className="block w-full"
                imgClassName="aspect-square w-full object-contain"
              />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center">
                <PackageSearch className="h-14 w-14 text-primary/40" />
              </div>
            )}
            {isSoldOut && <SoldOutBadge className="absolute start-4 top-4" />}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {images.map((src, index) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => showImage(index)}
                  aria-label={`Show image ${index + 1} of ${productName(product, t)}`}
                  aria-pressed={activeImage === index}
                  className={cn(
                    "h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 bg-secondary/40 p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    activeImage === index ? "border-primary" : "border-transparent",
                  )}
                >
                  <Photo
                    src={src}
                    alt=""
                    decorative
                    width={64}
                    height={64}
                    className="block h-full w-full"
                    imgClassName="h-full w-full object-contain"
                  />
                </button>
              ))}
            </div>
          )}
          <p dir="auto" className="mt-3 text-xs text-muted-foreground">
            {t("product.packagingNote", { name: business.doctorName })}
          </p>
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
                {t(PRODUCT_CATEGORY_LABELS[product.category])}
              </span>
              {isSoldOut && <SoldOutBadge />}
            </div>
            <h1
              dir="auto"
              className="mt-3 font-display text-2xl font-extrabold leading-tight tracking-tight text-navy sm:text-3xl"
            >
              {productName(product, t)}
            </h1>
            {(product.strength || product.quantity) && (
              <p dir="auto" className="mt-1.5 text-sm font-medium text-muted-foreground">
                {productMeta(product, t)}
              </p>
            )}
            <p dir="auto" className="mt-3 font-display text-2xl font-extrabold text-primary">
              {productPriceLabel(product, t)}
            </p>
          </div>

          <p dir="auto" className="text-sm leading-relaxed text-muted-foreground">
            {productFull(product, t)}
          </p>

          {product.highlights.length > 0 && (
            <ul className="space-y-1.5">
              {product.highlights.map((highlight) => (
                <li key={highlight} className="flex items-start gap-2 text-sm text-navy/80">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-turquoise" />
                  {productHighlightText(highlight, t)}
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            {isSoldOut ? (
              <>
                <span
                  aria-disabled="true"
                  className="inline-flex flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-md bg-muted px-5 py-3 text-sm font-semibold text-muted-foreground"
                >
                  {t("product.currentlyOutOfStock")}
                </span>
                {availabilityHref ? (
                  <a
                    href={availabilityHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-border px-5 py-3 text-sm font-semibold text-navy transition-colors hover:border-turquoise hover:text-turquoise"
                  >
                    <MessageCircle className="h-4 w-4" /> {t("product.askAvailability")}
                  </a>
                ) : (
                  <Link
                    to="/contact"
                    className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-border px-5 py-3 text-sm font-semibold text-navy transition-colors hover:border-turquoise hover:text-turquoise"
                  >
                    <MessageCircle className="h-4 w-4" /> {t("product.askAvailability")}
                  </Link>
                )}
              </>
            ) : inquiryHref ? (
              <a
                href={inquiryHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-turquoise"
              >
                <MessageCircle className="h-4 w-4" /> Ask About This Product
              </a>
            ) : (
              <Link
                to="/contact"
                className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-turquoise"
              >
                <MessageCircle className="h-4 w-4" /> Ask via Contact Page
              </Link>
            )}
          </div>

          {Object.keys(product.specifications).length > 0 && (
            <div className="rounded-xl border border-border/70 bg-card p-4">
              <h2 dir="auto" className="font-display text-sm font-bold text-navy">
                {t("product.specificationsHeading")}
              </h2>
              <dl className="mt-3 space-y-2">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-4 text-sm">
                    <dt className="shrink-0 text-muted-foreground">{specKeyText(key, t)}</dt>
                    <dd className="text-end font-medium text-navy">{specValueText(value, t)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <p
            dir="auto"
            className="rounded-xl border border-border/70 bg-secondary/40 p-4 text-xs leading-relaxed text-muted-foreground"
          >
            {t("product.disclaimer")}
          </p>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-16">
          <h2 dir="auto" className="font-display text-xl font-bold text-navy">
            {t("product.related")}
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

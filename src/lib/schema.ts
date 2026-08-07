import { business } from "@/data/business";
import type { Article } from "@/data/articles";
import type { Faq } from "@/data/faqs";
import type { Product } from "@/data/products";
import { services } from "@/data/services";

/** Omits any key whose value is undefined so we never publish an empty/fake field. */
function withoutUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}

export function medicalBusinessSchema() {
  return withoutUndefined({
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    name: business.doctorName,
    description: `Nutrition, health, and wellness guidance from ${business.doctorName}, ${business.professionalTitle}.`,
    url: business.domain,
    image: `${business.domain}/monzer-portrait.jpg`,
    logo: `${business.domain}/ma-logo.png`,
    telephone: business.phone,
    email: business.email,
    address: business.fullAddress,
    sameAs: business.instagram ? [business.instagram] : undefined,
    medicalSpecialty: services.map((service) => service.title),
    openingHoursSpecification: business.officeHours?.map((hours) => ({
      "@type": "OpeningHoursSpecification",
      description: hours,
    })),
  });
}

export function personSchema() {
  return withoutUndefined({
    "@context": "https://schema.org",
    "@type": "Person",
    name: business.doctorName,
    jobTitle: business.professionalTitle,
    url: business.domain,
    image: `${business.domain}/monzer-portrait.jpg`,
    sameAs: business.instagram ? [business.instagram] : undefined,
  });
}

export function faqSchema(faqs: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function articleSchema(article: Article, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    author: {
      "@type": "Person",
      name: business.doctorName,
    },
    publisher: {
      "@type": "Organization",
      name: business.doctorName,
      logo: {
        "@type": "ImageObject",
        url: `${business.domain}/ma-logo.png`,
      },
    },
    datePublished: article.date,
    dateModified: article.updated ?? article.date,
    mainEntityOfPage: url,
    url,
  };
}

const availabilitySchema: Record<Product["availability"], string> = {
  "in-stock": "https://schema.org/InStock",
  "low-stock": "https://schema.org/LimitedAvailability",
  "sold-out": "https://schema.org/OutOfStock",
  inquiry: "https://schema.org/PreOrder",
};

/**
 * No product price has been confirmed yet, so `offers.price` is deliberately
 * omitted rather than filled with a placeholder — only availability, which
 * is known, is published.
 */
export function productSchema(product: Product, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription,
    category: product.category,
    image: [product.mainImage, ...product.gallery].filter(Boolean),
    url,
    offers: {
      "@type": "Offer",
      availability: availabilitySchema[product.availability],
      url,
    },
  };
}

export interface BreadcrumbEntry {
  name: string;
  path: string;
}

export function breadcrumbSchema(entries: BreadcrumbEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: entries.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: `${business.domain}${entry.path}`,
    })),
  };
}

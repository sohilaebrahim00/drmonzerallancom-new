import { useEffect } from "react";
import { business } from "@/data/business";

/**
 * The sitewide share card. 1200x630 — the shape unfurlers expect.
 *
 * .jpg, not .webp: several crawlers (WhatsApp among them) still will not
 * render a WebP share card, so this is the one place the JPEG is primary.
 * Dimensions are stated so a crawler can lay the card out before fetching.
 */
const DEFAULT_OG_IMAGE = {
  path: "/images/og-image.jpg",
  width: 1200,
  height: 630,
  alt: "Dr. Monzer Allan — nutrition, health and wellness guidance",
} as const;

/**
 * A per-page share card. Carries its own dimensions and alt because emitting
 * the sitewide 1200x630 and the sitewide alt alongside a different image would
 * be stating something untrue to every crawler that reads it — and the article
 * heroes are not all one size (two are 960x540, four are 1400x787).
 *
 * `path` must be the .jpg. WhatsApp does not render a WebP share card.
 */
export interface SeoImage {
  path: string;
  width: number;
  height: number;
  alt: string;
}

interface SeoProps {
  title: string;
  description: string;
  path: string;
  image?: SeoImage;
  type?: "website" | "article";
  jsonLd?: object | object[];
  noindex?: boolean;
}

function setMetaByName(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setMetaByProperty(property: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(url: string) {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", url);
}

export function Seo({
  title,
  description,
  path,
  image,
  type = "website",
  jsonLd,
  noindex,
}: SeoProps) {
  const jsonLdKey = jsonLd ? JSON.stringify(jsonLd) : "";

  useEffect(() => {
    const url = `${business.domain}${path}`;
    // Absolute, always. A relative path in a share card resolves against the
    // crawler's own base, not ours, so it simply fails. The origin comes from
    // business.domain — one declared constant, not window.location, which
    // would bake a preview/staging host into the tag.
    //
    // Note: these tags are written by JS. Crawlers that do not execute
    // JavaScript (WhatsApp, Facebook, Slack) never see them — for those, what
    // counts is the static block in index.html. This keeps the two in step for
    // anything that DOES run JS, and for in-app SPA navigation.
    const card = image ?? DEFAULT_OG_IMAGE;
    const resolvedImage = card.path.startsWith("http")
      ? card.path
      : `${business.domain}${card.path}`;
    const fullTitle = title.includes(business.doctorName)
      ? title
      : `${title} | ${business.doctorName}`;

    document.title = fullTitle;
    setMetaByName("description", description);
    setMetaByName("robots", noindex ? "noindex, nofollow" : "index, follow");
    setMetaByProperty("og:title", fullTitle);
    setMetaByProperty("og:description", description);
    setMetaByProperty("og:type", type);
    setMetaByProperty("og:url", url);
    setMetaByProperty("og:image", resolvedImage);
    setMetaByProperty("og:image:type", "image/jpeg");
    setMetaByProperty("og:image:width", String(card.width));
    setMetaByProperty("og:image:height", String(card.height));
    setMetaByProperty("og:image:alt", card.alt);
    setMetaByProperty("og:site_name", business.doctorName);
    setMetaByProperty("og:locale", "en_US");
    setMetaByName("twitter:card", "summary_large_image");
    setMetaByName("twitter:title", fullTitle);
    setMetaByName("twitter:description", description);
    setMetaByName("twitter:image", resolvedImage);
    setMetaByName("twitter:image:alt", card.alt);
    setCanonical(url);

    const scripts: HTMLScriptElement[] = [];
    if (jsonLdKey) {
      const parsed = JSON.parse(jsonLdKey) as object | object[];
      const items = Array.isArray(parsed) ? parsed : [parsed];
      items.forEach((data) => {
        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.text = JSON.stringify(data);
        document.head.appendChild(script);
        scripts.push(script);
      });
    }

    return () => {
      scripts.forEach((s) => s.remove());
    };
  }, [title, description, path, image, type, jsonLdKey, noindex]);

  return null;
}

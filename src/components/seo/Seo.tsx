import { useEffect } from "react";
import { business } from "@/data/business";

interface SeoProps {
  title: string;
  description: string;
  path: string;
  image?: string;
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
    const resolvedImage = image ?? `${business.domain}/monzer-portrait.jpg`;
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
    setMetaByName("twitter:card", "summary_large_image");
    setMetaByName("twitter:title", fullTitle);
    setMetaByName("twitter:description", description);
    setMetaByName("twitter:image", resolvedImage);
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

// Generates the AI Concierge's knowledge base from the website's real
// source-of-truth data files — never hand-duplicated. Run whenever
// packages/products/services/faqs/articles/videos/business data changes:
//
//   npm run build:knowledge
//
// Output: src/ai/knowledge/generated-knowledge.json — committed to the repo
// and imported directly (as JSON) by the ai-chat Supabase Edge Function,
// since Deno can't safely import Vite-aliased / import.meta.env-dependent
// frontend modules. This script runs in Node (via tsx), which can.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

// THE CATALOGUE THE TILL USES, and therefore the only one the assistant may
// describe.
//
// This used to import `../src/data/packages` — the monthly membership tiers
// (Basic $29/mo, Premium $61/mo, VIP Elite $103/mo). Those were retired from
// the site in 024cee0, but that commit changed the UI and left this pointing at
// the dead file. Nothing regenerated, nothing complained, and for weeks the
// assistant quoted $29/month to visitors that checkout then charged $119 once.
//
// `purchasableProgramPackages`, not `programPackages`: three Diet programs are
// present in the data with availableForPurchase: false. The assistant must not
// offer what the site will not sell.
import {
  purchasableProgramPackages,
  programPackageDisclaimer,
} from "../src/data/programPackages";
import { getPublishedProducts } from "../src/data/products";
import { services } from "../src/data/services";
import { faqs } from "../src/data/faqs";
import { articles } from "../src/data/articles";
import { videos, youtubeChannelUrl } from "../src/data/videos";
import { business } from "../src/data/business";
import { bio, credentials } from "../src/data/about";
import { ar } from "../src/i18n/dictionaries/ar";
import type { KnowledgeBase, KnowledgeItem } from "../src/ai/knowledge/types";

/**
 * ARABIC SEARCH TERMS.
 *
 * Retrieval scores a query against each item's keywords. Every keyword here
 * was English, so even after knowledge-retrieval.ts stopped deleting Arabic
 * characters, an Arabic question still matched nothing: "بريميوم" is not
 * "premium" to a string comparison. Half the audience could not reach the
 * knowledge base at all.
 *
 * PRODUCT NOUNS COME FROM THE ARABIC DICTIONARY, not from a list typed here —
 * the site already had to name these things in Arabic to render the cards, and
 * a second Arabic name for the same product is exactly the kind of duplicate
 * that put "$29 per month" in front of customers for weeks.
 */
function arText(...keys: string[]): string[] {
  const out: string[] = [];
  for (const k of keys) {
    const v = (ar as Record<string, unknown>)[k];
    if (typeof v === "string") out.push(v);
  }
  return out;
}

/** "treatment_plus" -> "treatmentPlus", the shape the dictionary keys use. */
function camelSlug(slug: string): string {
  return slug.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

/**
 * Splits Arabic (or any) text into search words. The retriever folds both the
 * stored keywords and the incoming query through the same normaliser at load
 * time, so this only has to avoid throwing the letters away — which is exactly
 * what slugKeywords() above does to anything non-ASCII, and why it must not be
 * used for Arabic.
 */
function arKeywords(...texts: (string | undefined)[]): string[] {
  return [
    ...new Set(
      texts
        .filter((t): t is string => Boolean(t))
        .flatMap((t) => t.split(/[^\p{L}\p{N}]+/u))
        .filter((w) => w.length > 2),
    ),
  ];
}

/**
 * HOW VISITORS ASK, which is genuinely new information and not duplicated
 * product data — the dictionary has the site's nouns, not a patient's phrasing.
 * Small on purpose; every entry earns its place by being a word someone would
 * actually type into a chat box.
 */
const ASK_AR = {
  price: ["سعر", "أسعار", "تكلفة", "كلفة", "بكم", "التكلفة", "ثمن"],
  discount: ["خصم", "تخفيض", "عرض", "عروض", "خصومات"],
  subscription: ["اشتراك", "شهري", "شهرية", "عضوية", "تجديد", "إلغاء"],
  consultation: ["استشارة", "استشارات", "حجز", "موعد", "مواعيد", "جلسة"],
  program: ["برنامج", "برامج", "باقة", "باقات", "خطة"],
};

function slugKeywords(...values: (string | undefined)[]): string[] {
  return Array.from(
    new Set(
      values
        .filter((v): v is string => Boolean(v))
        .flatMap((v) => v.toLowerCase().split(/[^a-z0-9]+/))
        .filter((w) => w.length > 2),
    ),
  );
}

/**
 * The tier names as a readable list, e.g. "Treatment Basic, Treatment Plus, or
 * Treatment Premium" — read from the catalogue so hand-written prose can name
 * the products without hardcoding them. The retired version of this sentence
 * said "Basic, Premium, or VIP Elite" because it was typed out by hand.
 */
function listTiers(): string {
  const names = purchasableProgramPackages.map((p) => p.name);
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")}, or ${names[names.length - 1]}`;
}

const items: KnowledgeItem[] = [];

// ── doctor ──────────────────────────────────────────────────────────────
items.push({
  id: "doctor-profile",
  category: "doctor",
  title: `About ${business.doctorName}`,
  content: [
    `${business.doctorName} is a ${business.professionalTitle}.`,
    bio.paragraphs.join(" "),
    `Mission: ${bio.mission}`,
    `Credentials: ${credentials.map((c) => `${c.title} — ${c.description}`).join(" | ")}`,
  ].join(" "),
  keywords: slugKeywords(business.doctorName, business.professionalTitle, "who", "about", "qualifications", "credentials", "background"),
  route: "/about",
});

// ── programs (how it works, general rules) ─────────────────────────────
//
// The prose below is hand-written, so it is the part most able to drift from
// the catalogue. Everything countable in it is interpolated from the data
// rather than typed out, so the sentence cannot outlive the facts: the tier
// names and the credit counts come from purchasableProgramPackages, and the
// gate (scripts/check-knowledge.mjs) fails the build if a price or a product
// name appears here that the catalogue does not contain.
items.push({
  id: "program-overview",
  category: "membership",
  title: "How Programs Work",
  content:
    `Programs work in six steps: choose a program (${listTiers()}), complete secure payment via Stripe Checkout, your account activates once payment is confirmed, your consultation credits become available, you request an online consultation from your account dashboard using a credit, and approved consultations happen over Google Meet. Each program is a ONE-TIME purchase, not a subscription — there is no recurring billing and no monthly renewal. Creating an account is not free — it begins with choosing and paying for a program. ` +
    programPackageDisclaimer,
  keywords: [
    ...slugKeywords("membership", "program", "how", "works", "join", "sign", "up", "create", "account", "free", "trial", "subscription", "recurring"),
    ...ASK_AR.program,
    ...ASK_AR.subscription,
  ],
  // No `route` — navigating to view/choose a membership is the VIEW_MEMBERSHIP
  // action concept (see supabase/functions/_shared/actionRegistry.ts), which
  // resolves to the correct platform-specific destination server-side.
});

// A KNOWLEDGE BASE THAT ONLY STATES POSITIVES CANNOT ANSWER "DO YOU HAVE X?"
//
// After the catalogue was repointed, prices were correct but "Do you have a
// monthly membership?" still got "Yes, I offer various membership packages" —
// because the denial existed only as a clause inside a longer passage about
// how programs work, and retrieval surfaced the passage rather than the point.
//
// Emitted only while nothing recurring is sold, so it disappears by itself if
// a subscription is ever reintroduced. That is the difference between an
// assertion and a hardcoded sentence.
if (!purchasableProgramPackages.some((p) => /month|subscription/i.test(p.priceLabel))) {
  items.push({
    id: "no-subscription",
    category: "membership",
    title: "Is There a Monthly Membership or Subscription?",
    content:
      "No. There is no monthly membership, no subscription, and no recurring billing. Everything sold is a one-time purchase: " +
      `${purchasableProgramPackages.map((p) => `${p.name} at ${p.priceLabel}`).join(", ")}. ` +
      "You pay once, the consultations included in that program are granted to your account, and nothing renews or charges again. " +
      "Monthly membership tiers were offered in the past and are no longer available, so any price quoted per month is out of date.",
    keywords: [
      ...slugKeywords(
        "membership", "monthly", "month", "subscription", "subscribe", "recurring", "renew", "renewal",
        "cancel", "billing", "plan", "tier", "free", "trial", "one", "time", "once",
      ),
      ...ASK_AR.subscription,
      ...ASK_AR.price,
      ...ASK_AR.program,
    ],
  });
}

items.push({
  id: "consultation-credits",
  category: "consultations",
  title: "Consultation Credits & Requests",
  content:
    "Each program includes a fixed number of consultation credits, granted once at purchase and not renewed monthly: " +
    purchasableProgramPackages
      .map((p) => `${p.name} includes ${p.consultationCount}`)
      .join(", ") +
    ". A credit is only used once a booking is actually confirmed with a real Google Meet link — not just for opening the booking page or selecting a date. Clients book from their account by choosing an available date and time, reviewing the appointment, and confirming. If someone has no credits remaining, they can purchase another program — there is no renewal, because there is no subscription. Detailed medical history should not be shared through the consultation booking form — that stays with the consultation itself.",
  keywords: [
    ...slugKeywords("consultation", "credit", "credits", "book", "booking", "meeting", "meet", "google", "request", "schedule", "appointment"),
    ...ASK_AR.consultation,
  ],
  // No `route` — booking is the BOOK_CONSULTATION action concept.
});

items.push({
  id: "consultation-availability",
  category: "consultations",
  title: "Consultation Availability & Booking Rules",
  content:
    "Dr. Monzer Allan's standard consultation hours are Monday, Wednesday, and Friday, 4:00 PM to 9:00 PM Dubai time (Asia/Dubai). Actual open slots change as appointments are booked and as the schedule is updated, so the real available times should always be checked on the booking page rather than assumed from this general schedule. Appointments must be requested at least 48 hours in advance — same-day and next-day booking are not available. Consultations are conducted online via a real Google Meet link, created only once a booking is confirmed.",
  keywords: slugKeywords(
    "availability",
    "available",
    "when",
    "monday",
    "wednesday",
    "friday",
    "hours",
    "today",
    "tomorrow",
    "notice",
    "advance",
    "48",
    "book",
    "schedule",
    "time",
  ),
  // No `route` — booking is the BOOK_CONSULTATION action concept.
});

// ── packages ────────────────────────────────────────────────────────────
for (const pkg of purchasableProgramPackages) {
  items.push({
    id: `package-${pkg.slug}`,
    category: "packages",
    title: `${pkg.name} Program`,
    content: [
      `${pkg.name}: ${pkg.tagline}.`,
      // previousPrice is optional and only set where a real earlier price
      // existed, so the "(was ...)" clause has to be conditional. The old code
      // printed it unconditionally off a required field — which is how a
      // package with no price history would have grown a fake discount.
      `Price: ${pkg.priceLabel}, a one-time payment${pkg.previousPrice ? ` (was $${pkg.previousPrice})` : ""}.`,
      `Includes ${pkg.consultationCount} doctor consultation${pkg.consultationCount === 1 ? "" : "s"}, granted once at purchase.`,
      `Features: ${pkg.features.join("; ")}.`,
    ]
      .filter(Boolean)
      .join(" "),
    keywords: [
      ...slugKeywords(pkg.name, pkg.slug, pkg.packageType, pkg.tier, "price", "cost", "program", "package", "plan"),
      // The Arabic name the cards actually render, split into words, plus the
      // vocabulary a visitor uses to ask about price and discount. Without
      // these an Arabic price question scored zero against every item.
      ...arKeywords(...arText(`pkg.${camelSlug(pkg.slug)}.name`)),
      ...ASK_AR.price,
      ...ASK_AR.discount,
      ...ASK_AR.program,
    ],
    // No `route` — viewing/choosing a program is the VIEW_MEMBERSHIP action concept.
  });
}

// Built from the catalogue rather than a hand-maintained comparison table.
// The old version read `comparisonRows` from the retired file, which is why it
// still compared Basic/Premium/VIP Elite by *monthly* price long after the site
// stopped selling anything monthly.
items.push({
  id: "package-comparison",
  category: "packages",
  title: "Program Comparison",
  content: [
    `One-time price — ${purchasableProgramPackages.map((p) => `${p.name}: ${p.priceLabel}`).join("; ")}.`,
    `Consultations included — ${purchasableProgramPackages.map((p) => `${p.name}: ${p.consultationCount}`).join("; ")}.`,
    `The tiers differ only in how many consultations are included. There is no monthly plan and no recurring charge.`,
  ].join(" "),
  keywords: [
    ...slugKeywords("compare", "comparison", "difference", "tier", "tiers", ...purchasableProgramPackages.map((p) => p.name)),
    ...arKeywords(...arText(...purchasableProgramPackages.map((p) => `pkg.${camelSlug(p.slug)}.name`))),
    ...ASK_AR.price,
    ...ASK_AR.discount,
    ...ASK_AR.program,
    "مقارنة",
    "الفرق",
  ],
  // No `route` — the VIEW_MEMBERSHIP action concept covers this.
});

// ── services ────────────────────────────────────────────────────────────
for (const service of services) {
  items.push({
    id: `service-${service.slug}`,
    category: "services",
    title: service.title,
    content: `${service.title}: ${service.description} Highlights: ${service.highlights.join(", ")}.`,
    keywords: slugKeywords(service.title, ...service.highlights),
    // No `route` — /booking (with a service query param) is a website-only
    // flow; the native app books through BOOK_CONSULTATION instead, which
    // doesn't currently support preselecting one of these 12 programs.
  });
}

// ── products ────────────────────────────────────────────────────────────
for (const product of getPublishedProducts()) {
  const availabilityText =
    product.availability === "sold-out"
      ? "Currently Out of Stock."
      : product.availability === "low-stock"
        ? "Low stock."
        : product.availability === "in-stock"
          ? "In stock."
          : "Available on inquiry.";
  items.push({
    id: `product-${product.slug}`,
    category: "products",
    title: product.name,
    content: [
      `${product.name}${product.strength ? ` (${product.strength})` : ""}${product.quantity ? `, ${product.quantity}` : ""} — ${product.category}.`,
      product.shortDescription,
      availabilityText,
      `Price: ${product.priceLabel}.`,
    ].join(" "),
    keywords: slugKeywords(product.name, product.category, product.strength),
    route: `/products/${product.slug}`,
  });
}

items.push({
  id: "products-overview",
  category: "products",
  title: "Product Catalog Overview",
  content: `All current products (${getPublishedProducts().length} items across Supplements, Vitamins & Minerals, Herbal Wellness, and Health Monitoring Devices) are currently marked Out of Stock. Visitors can view details and ask about availability from any product page — no online checkout is currently available for products.`,
  keywords: slugKeywords("products", "shop", "store", "buy", "stock", "available", "availability"),
  // No `route` — the VIEW_PRODUCTS action concept covers navigating to the catalog.
});

// ── faq ─────────────────────────────────────────────────────────────────
for (const [index, faq] of faqs.entries()) {
  items.push({
    id: `faq-${index}`,
    category: "faq",
    title: faq.question,
    content: faq.answer,
    keywords: slugKeywords(faq.question, faq.category),
    // No `route` — the VIEW_FAQ action concept covers this (web-only; no FAQ screen in the native app).
  });
}

// ── blog ────────────────────────────────────────────────────────────────
for (const article of articles) {
  items.push({
    id: `blog-${article.slug}`,
    category: "blog",
    title: article.title,
    content: `${article.title} (${article.category}): ${article.excerpt}`,
    keywords: slugKeywords(article.title, article.category),
    route: `/blog/${article.slug}`,
  });
}

// ── videos ──────────────────────────────────────────────────────────────
for (const video of videos) {
  items.push({
    id: `video-${video.id}`,
    category: "videos",
    title: video.title,
    content: `${video.title} (${video.category}): ${video.caption} Watch on the official YouTube channel or in the site's video library.`,
    keywords: slugKeywords(video.title, video.category),
    // No `route` — the VIEW_VIDEOS action concept covers navigating to the video library on both platforms.
  });
}
items.push({
  id: "videos-overview",
  category: "videos",
  title: "YouTube Channel",
  content: `Educational videos are published on the official Dr. Monzer Allan YouTube channel (${youtubeChannelUrl}) and featured on the website's Watch & Learn section and Gallery page, and on the native app's video library.`,
  keywords: slugKeywords("youtube", "video", "videos", "watch", "channel"),
  // No `route` — the VIEW_VIDEOS action concept covers this.
});

// ── contact ─────────────────────────────────────────────────────────────
const socialLines = [
  business.instagram ? `Instagram: ${business.instagram}` : "",
  business.facebook ? `Facebook: ${business.facebook}` : "",
  business.tiktok ? `TikTok: ${business.tiktok}` : "",
  business.youtube ? `YouTube: ${business.youtube}` : "",
]
  .filter(Boolean)
  .join(" | ");
items.push({
  id: "contact-info",
  category: "contact",
  title: "Contact & Social",
  content: `The fastest way to reach the team is the Contact page (website) or Help & Support (native app), which offer a message form and, when configured, a WhatsApp link. Official social profiles: ${socialLines}. No public phone number, email address, or physical office address has been confirmed yet — do not state one.`,
  keywords: slugKeywords("contact", "reach", "email", "phone", "address", "social", "instagram", "facebook", "tiktok"),
  // No `route` — the CONTACT_TEAM action concept covers this (different destination per platform).
});

// ── navigation ──────────────────────────────────────────────────────────
items.push({
  id: "site-navigation",
  category: "navigation",
  title: "Navigation",
  content:
    // NOTE: the mobile-app half of this sentence is deliberately left saying
    // "membership". src/app-native/ still imports the retired src/data/packages
    // and still presents monthly tiers, so on that platform the wording is
    // accurate. Correcting it here would make the assistant describe an app
    // that does not exist yet. Flagged for the app to be repointed; see
    // FIX_PLAN.md.
    "On the website: Home, About, Packages, Shop/Products, Blog, Gallery, FAQ, Contact, Sign In, Create Account / Choose a program, My Account (requires sign-in). On the native mobile app, navigation instead uses five bottom tabs: Home (dashboard), Health (Food Scanner, Prayer Times, Qibla, Products, Blog, Videos), AI (the AI Concierge), Consultations (membership, credits, booking), and Account (profile, settings, help). Create Account begins a paid purchase — it is not a free signup, on either platform.",
  keywords: slugKeywords("navigate", "navigation", "page", "pages", "find", "where", "menu", "sign", "login", "account", "tab", "tabs"),
});

// ── app-features (native app only) ─────────────────────────────────────
items.push({
  id: "app-feature-prayer-times",
  category: "app-features",
  title: "Prayer Times (mobile app)",
  content:
    "The mobile app includes a Prayer Times feature (in the app's Health tab) showing today's five daily prayers (Fajr, Dhuhr, Asr, Maghrib, Isha) plus Sunrise, calculated for the visitor's location (device location or a manually chosen city), with a configurable calculation method and Asr madhab. Optional on-device reminders can be enabled per prayer. This feature is only available in the native app, not the website — do not offer it as a website navigation link.",
  keywords: slugKeywords("prayer", "prayer times", "fajr", "dhuhr", "asr", "maghrib", "isha", "salah", "salat"),
  // No `route` on this content item — the OPEN_PRAYER_TIMES action concept
  // (native-only, see _shared/actionRegistry.ts) is what actually offers a
  // clickable action for this screen, resolved per-platform server-side.
});
items.push({
  id: "app-feature-qibla",
  category: "app-features",
  title: "Qibla (mobile app)",
  content:
    "The mobile app includes a Qibla compass (in the app's Health tab) showing the direction to the Kaaba from the visitor's location, using the device's compass when available (with a manual-alignment fallback and calibration tip when it isn't). This feature is only available in the native app, not the website — do not offer it as a website navigation link.",
  keywords: slugKeywords("qibla", "kaaba", "mecca", "compass", "direction"),
  // No `route` — OPEN_QIBLA is the (native-only) action concept for this.
});
items.push({
  id: "app-feature-food-scanner",
  category: "app-features",
  title: "Food Scanner (mobile app)",
  content:
    "The mobile app includes a Food Scanner (in the app's Health tab): the visitor photographs a meal and receives an ESTIMATED calorie and macronutrient (protein, carbohydrate, fat) breakdown per detected food item, powered by Gemini image analysis. These are estimates only, never exact measurements, and the visitor can correct detected items before optionally asking the AI assistant general educational questions about the meal. This feature is only available in the native app, not the website — do not offer it as a website navigation link.",
  keywords: slugKeywords("food", "scanner", "calorie", "calories", "nutrition", "macros", "meal", "scan"),
  // No `route` — OPEN_FOOD_SCANNER is the (native-only) action concept for this.
});

// ── policies ────────────────────────────────────────────────────────────
items.push({
  id: "policy-membership-disclaimer",
  category: "policies",
  title: "Program & Nutrition Service Disclaimer",
  content: programPackageDisclaimer,
  keywords: slugKeywords("disclaimer", "policy", "medical", "diagnosis", "emergency"),
});
items.push({
  id: "policy-product-disclaimer",
  category: "policies",
  title: "Product Disclaimer",
  content:
    "Product information is provided for general informational purposes only. Dietary supplements are not intended to diagnose, treat, cure, or prevent any disease. Consult a qualified healthcare professional before using a supplement, especially if pregnant, nursing, taking medication, managing a medical condition, or considering use for a child.",
  keywords: slugKeywords("supplement", "disclaimer", "product", "claim", "treat", "cure"),
});
items.push({
  id: "policy-privacy",
  category: "policies",
  title: "Privacy & Sensitive Information",
  content:
    "Visitors should not share detailed medical history, diagnoses, medications, or lab results through the chat, contact form, or consultation request form — that information stays with the consultation itself with a qualified professional.",
  keywords: slugKeywords("privacy", "medical", "records", "sensitive", "share"),
});

const knowledgeBase: KnowledgeBase = {
  generatedFrom: "src/data/{programPackages,products,services,faqs,articles,videos,business,about}.ts",
  items,
};

const outPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "ai",
  "knowledge",
  "generated-knowledge.json",
);
writeFileSync(outPath, JSON.stringify(knowledgeBase, null, 2) + "\n", "utf-8");
console.log(`Wrote ${items.length} knowledge items to ${outPath}`);

import type { Entry } from "../types";

/**
 * English is the source dictionary: its keys ARE the key type, so a typo in a
 * `t()` call is a compile error rather than a string that renders as its own
 * key in production.
 *
 * Keys are flat and dotted (`faq.resultCount`) rather than nested objects.
 * With the surface in FIX_PLAN 5.2 — around 280 files — a nested shape needs
 * recursive template-literal path types to stay type-safe, which is slow to
 * compile and produces unreadable errors. Flat keys are greppable: the string
 * in the editor is the string in the file.
 *
 * Convention: `<area>.<thing>`, and a plural entry is named for what it
 * counts, not for the sentence it appears in.
 *
 * SEEDED, NOT COMPLETE. These are the entries needed to prove the mechanism —
 * each one lifted from a string that exists in the tree today. Component
 * conversion is the next step, not this one.
 */
export const en = {
  // --- plural entries -------------------------------------------------
  // src/pages/FaqPage.tsx:115 — `{n} {n === 1 ? "question" : "questions"} found`
  "faq.resultCount": {
    one: "{count} question found",
    other: "{count} questions found",
  },
  // src/pages/ProductsIndexPage.tsx:84
  "products.resultCount": {
    one: "{count} product found",
    other: "{count} products found",
  },
  // src/app-native/screens/NativeNotificationSettings.tsx:74 — was "day(s)"
  "notifications.coverageDays": {
    one: "Currently covering the next day.",
    other: "Currently covering the next {count} days.",
  },
  // src/pages/AccountConsultationsPage.tsx:253 and three sibling screens
  "consultations.creditsRemaining": {
    one: "{count} of {limit} credit remaining",
    other: "{count} of {limit} credits remaining",
  },

  // --- simple entries -------------------------------------------------
  "common.language": "Language",
  "consultations.title": "Consultations",
  "faq.searchPlaceholder": "Search questions",

  // --- global navigation ----------------------------------------------
  "nav.about": "About",
  "nav.packages": "Packages",
  "nav.shop": "Shop",
  "nav.blog": "Blog",
  "nav.gallery": "Gallery",
  "nav.faq": "FAQ",
  "nav.contact": "Contact",

  // --- header -----------------------------------------------------------
  "header.homeAriaLabel": "Monzer Allan home",
  "header.logoAlt": "Monzer Allan logo",
  "header.openMenu": "Open menu",
  "header.menuTitle": "Menu",
  "header.primaryNavLabel": "Primary",
  "header.mobileNavLabel": "Mobile",
  "header.signIn": "Sign In",
  "header.createAccount": "Create Account",
  "header.myAccount": "My Account",

  // --- footer -----------------------------------------------------------
  "footer.navigation": "Navigation",
  "footer.popularServices": "Popular Services",
  "footer.getInTouch": "Get in Touch",
  "footer.reachOut": "Reach out via the",
  "footer.contactPage": "Contact page",
  "footer.privacy": "Privacy Policy",
  "footer.terms": "Terms of Service",
  "footer.medicalDisclaimer": "Medical Disclaimer",

  // --- shared controls --------------------------------------------------
  "cta.bookSession": "Book a Session",
  "cta.viewPrograms": "View Programs",
  "cta.backToTop": "Back to top",

  // --- home sections: heading blocks ------------------------------------
  "services.eyebrow": "Services",
  "services.title": "Specialized Nutrition Care For Every Stage Of Life",
  "services.description":
    "Twelve focused programs, each tailored to your body, your goals, and your medical needs.",

  "programs.eyebrow": "Programs",
  "programs.title": "Choose Your Path Forward",
  "programs.description":
    "A treatment program with close medical follow-up — pick the level of consultation support you need, with no recurring billing.",

  "howItWorks.eyebrow": "Programs",
  "howItWorks.title": "How It Works",
  "howItWorks.description":
    "From choosing a program to your first consultation — a simple, transparent, one-time process.",

  "products.eyebrow": "Products",
  "products.title": "Featured Wellness Products",
  "products.description":
    "Carefully selected products designed to support a healthier daily routine.",

  "blog.eyebrow": "Blog",
  "blog.title": "Learn The Science Behind The Advice",
  "blog.description":
    "Free, evidence-based articles covering the topics that matter most to your health.",

  "discovery.eyebrow": "Explore by Topic",
  "discovery.title": "Find Guidance For What Matters Most to You",

  "gallery.eyebrow": "Gallery",
  "gallery.title": "A Look Inside the Practice",

  "testimonials.eyebrow": "Client Reviews",
  "testimonials.title": "What Clients Are Saying",

  "videos.eyebrow": "Watch & Learn",
  "videos.title": "Nutrition Insights on Video",
  "videos.description": "Practical nutrition insights, explained clearly.",

  "community.eyebrow": "Community",
  "community.title": "Join the Community",

  "contactSection.eyebrow": "Contact",
  "contactSection.title": "Let's Start Your Nutrition Journey",
  "contactSection.description":
    "Reach out with questions, or book your first session directly — whichever is easiest for you.",

  "beforeAfter.eyebrow": "What Changes",
  "beforeAfter.title": "The same table, two different evenings",
  "beforeAfter.description":
    "Drag the slider to compare. This is about what is on the plate — not about anyone's body.",
  "beforeAfter.storiesEyebrow": "Real Progress",
  "beforeAfter.storiesTitle": "Transformation Stories",
  "beforeAfter.storiesDescription":
    "Illustrative snapshots of client progress. Drag the slider to compare before and after results.",

  "faqSection.eyebrow": "FAQ",
  "faqSection.title": "Frequently Asked Questions",

  // --- page furniture ---------------------------------------------------
  "faqPage.eyebrow": "Knowledge Center",
  "faqPage.description":
    "Search or filter by topic to find answers about programs, consultations, billing, and more.",
  "faqPage.searchPlaceholder": "Search questions…",
  "faqPage.searchAriaLabel": "Search FAQs",
  "faqPage.categoryAll": "All",
  "faqPage.noResults": "No questions match your search. Try another keyword or category.",
  "faqPage.stillHaveQuestion": "Still Have a Question?",
  "faqPage.stillHaveQuestionBody":
    "Ask directly, or explore programs to see what's included in each package.",
  "faqPage.explorePrograms": "Explore Programs",
  "faqPage.contactUs": "Contact Us",

  "productsPage.searchPlaceholder": "Search products…",
  "productsPage.searchAriaLabel": "Search products",

  "blogPage.searchPlaceholder": "Search articles…",
  "blogPage.searchAriaLabel": "Search articles",
  "blogPage.featured": "Featured Article",
  "blogPage.readArticle": "Read the Article",

  "common.minRead": "min read",
  "common.read": "Read",
  "common.home": "Home",

  // --- taxonomy labels --------------------------------------------------
  // DISPLAY ONLY. The identity stays the English string in the data files —
  // see the second rule at the top of ar.ts. Filtering, gradient lookup,
  // related-content scoring and search all compare the identity, never these.
  "faqCategory.programs": "Programs",
  "faqCategory.consultations": "Consultations",
  "faqCategory.consultationCredits": "Consultation Credits",
  "faqCategory.onlineMeetings": "Online Meetings",
  "faqCategory.accountBilling": "Account & Billing",
  "faqCategory.products": "Products",
  "faqCategory.nutritionServices": "Nutrition Services",
  "faqCategory.generalQuestions": "General Questions",

  "articleCategory.weightManagement": "Weight Management",
  "articleCategory.clinicalNutrition": "Clinical Nutrition",
  "articleCategory.sportsNutrition": "Sports Nutrition",
  "articleCategory.womensHealth": "Women's Health",
  "articleCategory.familyNutrition": "Family Nutrition",
  "articleCategory.digestiveHealth": "Digestive Health",
  "articleCategory.heartHealth": "Heart Health",

  "productCategory.supplements": "Supplements",
  "productCategory.vitaminsMinerals": "Vitamins & Minerals",
  "productCategory.herbalWellness": "Herbal Wellness",
  "productCategory.healthMonitoringDevices": "Health Monitoring Devices",

  "videoCategory.nutrition": "Nutrition",
  "videoCategory.wellness": "Wellness",
  "videoCategory.education": "Education",
  "videoCategory.lifestyle": "Lifestyle",
  "videoCategory.metabolicHealth": "Metabolic Health",

  // --- gallery page -----------------------------------------------------
  "galleryPage.storyInPractice": "In Practice",
  "galleryPage.storyInPracticeBody": "Moments from real consultations and everyday practice life.",
  "galleryPage.storyBehindKnowledge": "Behind the Knowledge",
  "galleryPage.storyBehindKnowledgeBody":
    "How research and clinical training shape each recommendation.",
  "galleryPage.storyEducational": "Educational Moments",
  "galleryPage.storyEducationalBody": "Snapshots from talks, sessions, and community education.",
  "galleryPage.storyEvents": "Events & Community",
  "galleryPage.storyEventsBody": "Community initiatives and wellness events.",
  "galleryPage.storyJourney": "Professional Journey",
  "galleryPage.storyJourneyBody": "Milestones in clinical and nutrition specialization.",
} as const satisfies Record<string, Entry>;

/** Every key that exists. Arabic is checked against this, and so is `t()`. */
export type TranslationKey = keyof typeof en;

/**
 * Only the keys whose entry is a plain string.
 *
 * Needed because `t()` requires a `count` for plural keys, and that requirement
 * is decided per key. Hand it a VARIABLE of the full union — a nav item's
 * `labelKey`, say — and the conditional type has to assume the value might be
 * a plural key, so it demands `count` for something that will never need one.
 *
 * Data structures that carry a key should use this type, which says at the
 * type level "this slot never holds a plural key".
 */
export type SimpleTranslationKey = {
  [K in TranslationKey]: (typeof en)[K] extends string ? K : never;
}[TranslationKey];

import type { SimpleTranslationKey } from "./dictionaries/en";
import type { FaqCategory } from "@/data/faqs";
import type { ArticleCategory } from "@/data/articles";
import type { ProductCategory } from "@/data/products";
import type { VideoCategory } from "@/data/videos";

/**
 * Identity -> display key, for every taxonomy shown to a visitor.
 *
 * The IDENTITY is the English string stored in the data files. It stays
 * English forever: gradient lookup, filtering, related-content scoring, search
 * matching and any future URL parameter all compare that. See the second rule
 * at the top of dictionaries/ar.ts for why translating it in place would
 * silently break all four.
 *
 * These maps are `Record<Category, ...>` rather than a partial lookup on
 * purpose: adding a category to a data file without giving it a label is a
 * compile error, not a chip that renders in the wrong language.
 */
export const FAQ_CATEGORY_LABELS: Record<FaqCategory, SimpleTranslationKey> = {
  Programs: "faqCategory.programs",
  Consultations: "faqCategory.consultations",
  "Consultation Credits": "faqCategory.consultationCredits",
  "Online Meetings": "faqCategory.onlineMeetings",
  "Account & Billing": "faqCategory.accountBilling",
  Products: "faqCategory.products",
  "Nutrition Services": "faqCategory.nutritionServices",
  "General Questions": "faqCategory.generalQuestions",
};

export const ARTICLE_CATEGORY_LABELS: Record<ArticleCategory, SimpleTranslationKey> = {
  "Weight Management": "articleCategory.weightManagement",
  "Clinical Nutrition": "articleCategory.clinicalNutrition",
  "Sports Nutrition": "articleCategory.sportsNutrition",
  "Women's Health": "articleCategory.womensHealth",
  "Family Nutrition": "articleCategory.familyNutrition",
  "Digestive Health": "articleCategory.digestiveHealth",
  "Heart Health": "articleCategory.heartHealth",
};

/**
 * Video categories are identity too: getVideosByCategory() in src/data/videos.ts
 * filters on the raw string, so translating the stored value would return an
 * empty list rather than a visibly wrong one.
 */
export const VIDEO_CATEGORY_LABELS: Record<VideoCategory, SimpleTranslationKey> = {
  Nutrition: "videoCategory.nutrition",
  Wellness: "videoCategory.wellness",
  Education: "videoCategory.education",
  Lifestyle: "videoCategory.lifestyle",
  "Metabolic Health": "videoCategory.metabolicHealth",
};

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, SimpleTranslationKey> = {
  Supplements: "productCategory.supplements",
  "Vitamins & Minerals": "productCategory.vitaminsMinerals",
  "Herbal Wellness": "productCategory.herbalWellness",
  "Health Monitoring Devices": "productCategory.healthMonitoringDevices",
};

/**
 * Credential titles are identity too — `about.ts` is the source used by
 * schema.org (personSchema) and the app, and the title doubles as the React
 * key in the credentials grid. Display comes from here.
 */
export const CREDENTIAL_LABELS: Record<
  string,
  { title: SimpleTranslationKey; description: SimpleTranslationKey }
> = {
  "Licensed Pharmacist": {
    title: "credential.licensedPharmacist",
    description: "credential.licensedPharmacistBody",
  },
  "Nutrition Specialist": {
    title: "credential.nutritionSpecialist",
    description: "credential.nutritionSpecialistBody",
  },
};

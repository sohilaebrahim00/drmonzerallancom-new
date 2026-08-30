import type { SimpleTranslationKey } from "./dictionaries/en";
import type { Service } from "@/data/services";
import type { TranslateFn } from "./translate";

/**
 * Service slug -> display keys.
 *
 * The slug is the identity: it is the "/#services" anchor target and the React
 * key. Title, description and highlights are display only.
 *
 * The highlight lists are per-service rather than deduplicated across
 * services, unlike the product highlights. They read as short phrases in a
 * specific clinical context ("Progress monitoring" under Cholesterol is about
 * lipids; the same words under Weight Loss would be about weight), and
 * collapsing them into one shared key would force one Arabic phrasing to serve
 * both.
 */
export const SERVICE_LABELS: Record<
  string,
  { title: SimpleTranslationKey; desc: SimpleTranslationKey; highlights: SimpleTranslationKey[] }
> = {
  "nutrition-consultation": {
    title: "service.nutritionConsultation.title",
    desc: "service.nutritionConsultation.desc",
    highlights: [
      "service.nutritionConsultation.h1",
      "service.nutritionConsultation.h2",
      "service.nutritionConsultation.h3",
    ],
  },
  "weight-loss": {
    title: "service.weightLoss.title",
    desc: "service.weightLoss.desc",
    highlights: ["service.weightLoss.h1", "service.weightLoss.h2", "service.weightLoss.h3"],
  },
  "weight-gain": {
    title: "service.weightGain.title",
    desc: "service.weightGain.desc",
    highlights: ["service.weightGain.h1", "service.weightGain.h2", "service.weightGain.h3"],
  },
  "clinical-nutrition": {
    title: "service.clinicalNutrition.title",
    desc: "service.clinicalNutrition.desc",
    highlights: [
      "service.clinicalNutrition.h1",
      "service.clinicalNutrition.h2",
      "service.clinicalNutrition.h3",
    ],
  },
  "sports-nutrition": {
    title: "service.sportsNutrition.title",
    desc: "service.sportsNutrition.desc",
    highlights: [
      "service.sportsNutrition.h1",
      "service.sportsNutrition.h2",
      "service.sportsNutrition.h3",
    ],
  },
  "diabetes-nutrition": {
    title: "service.diabetesNutrition.title",
    desc: "service.diabetesNutrition.desc",
    highlights: [
      "service.diabetesNutrition.h1",
      "service.diabetesNutrition.h2",
      "service.diabetesNutrition.h3",
    ],
  },
  hypertension: {
    title: "service.hypertension.title",
    desc: "service.hypertension.desc",
    highlights: ["service.hypertension.h1", "service.hypertension.h2", "service.hypertension.h3"],
  },
  cholesterol: {
    title: "service.cholesterol.title",
    desc: "service.cholesterol.desc",
    highlights: ["service.cholesterol.h1", "service.cholesterol.h2", "service.cholesterol.h3"],
  },
  "digestive-health": {
    title: "service.digestiveHealth.title",
    desc: "service.digestiveHealth.desc",
    highlights: [
      "service.digestiveHealth.h1",
      "service.digestiveHealth.h2",
      "service.digestiveHealth.h3",
    ],
  },
  "pregnancy-nutrition": {
    title: "service.pregnancyNutrition.title",
    desc: "service.pregnancyNutrition.desc",
    highlights: [
      "service.pregnancyNutrition.h1",
      "service.pregnancyNutrition.h2",
      "service.pregnancyNutrition.h3",
    ],
  },
  "senior-nutrition": {
    title: "service.seniorNutrition.title",
    desc: "service.seniorNutrition.desc",
    highlights: [
      "service.seniorNutrition.h1",
      "service.seniorNutrition.h2",
      "service.seniorNutrition.h3",
    ],
  },
  "oncology-nutrition": {
    title: "service.oncologyNutrition.title",
    desc: "service.oncologyNutrition.desc",
    highlights: [
      "service.oncologyNutrition.h1",
      "service.oncologyNutrition.h2",
      "service.oncologyNutrition.h3",
      "service.oncologyNutrition.h4",
    ],
  },
};

export function serviceTitle(s: Service, t: TranslateFn): string {
  const k = SERVICE_LABELS[s.slug];
  return k ? t(k.title) : s.title;
}

export function serviceDescription(s: Service, t: TranslateFn): string {
  const k = SERVICE_LABELS[s.slug];
  return k ? t(k.desc) : s.description;
}

/**
 * Falls back index-wise to the stored English, so a highlight added to
 * services.ts without a matching key shows its English rather than vanishing
 * from the list.
 */
export function serviceHighlights(s: Service, t: TranslateFn): string[] {
  const k = SERVICE_LABELS[s.slug];
  if (!k) return s.highlights;
  return s.highlights.map((h, i) => (k.highlights[i] ? t(k.highlights[i]) : h));
}

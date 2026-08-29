import type { SimpleTranslationKey } from "./dictionaries/en";
import type { ProgramPackage, ProgramPackageSlug } from "@/data/programPackages";
import type { TranslateFn } from "./translate";

/**
 * Display copy for the six program packages.
 *
 * The slug stays the identity — it is what the checkout request sends, what
 * the Edge Function maps to an amount, what the webhook resolves, and what a
 * stored subscription row holds. Nothing here is ever compared or sent.
 */
export const PACKAGE_LABELS: Record<
  ProgramPackageSlug,
  { name: SimpleTranslationKey; tagline: SimpleTranslationKey }
> = {
  diet_basic: { name: "pkg.dietBasic.name", tagline: "pkg.dietBasic.tagline" },
  diet_plus: { name: "pkg.dietPlus.name", tagline: "pkg.dietPlus.tagline" },
  diet_premium: { name: "pkg.dietPremium.name", tagline: "pkg.dietPremium.tagline" },
  treatment_basic: { name: "pkg.treatmentBasic.name", tagline: "pkg.treatmentBasic.tagline" },
  treatment_plus: { name: "pkg.treatmentPlus.name", tagline: "pkg.treatmentPlus.tagline" },
  treatment_premium: {
    name: "pkg.treatmentPremium.name",
    tagline: "pkg.treatmentPremium.tagline",
  },
};

/**
 * The feature list, derived from the package's own fields rather than from a
 * lookup on its English feature strings.
 *
 * This reproduces the stored lists exactly — a diet package lists its program,
 * its consultations and monthly follow-up; a treatment package lists its plan
 * and its consultations — while letting the consultation line be a real plural.
 * That matters in Arabic: two consultations is the dual "استشارتان", not "2
 * استشارات", and Intl.PluralRules picks the form.
 *
 * Deriving beats mapping here because the English strings would otherwise have
 * to stay byte-identical forever for the lookup to keep working.
 */
export function packageFeatures(pkg: ProgramPackage, t: TranslateFn): string[] {
  const out = [
    pkg.packageType === "diet" ? t("pkg.feature.nutritionProgram") : t("pkg.feature.treatmentPlan"),
    t("pkg.feature.doctorConsultations", { count: pkg.consultationCount }),
  ];
  if (pkg.packageType === "diet") out.push(t("pkg.feature.monthlyFollowUp"));
  return out;
}

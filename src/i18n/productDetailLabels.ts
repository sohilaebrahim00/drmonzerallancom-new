import type { SimpleTranslationKey } from "./dictionaries/en";
import type { Product } from "@/data/products";
import type { TranslateFn } from "./translate";

/**
 * The rest of the product surface: long description, highlights, quantity,
 * price label and specification field names.
 *
 * These maps are keyed by the ENGLISH SOURCE STRING, not by a translated one.
 * That is deliberate and is not a breach of "a translated string is never an
 * identity": the English in src/data/products.ts is the stored canonical
 * value, the same way product.category is, and it is what
 * PRODUCT_CATEGORY_LABELS already keys on. Nothing looks up an Arabic string.
 *
 * WHERE THE LINE IS DRAWN on specification values, which are a mixture:
 *
 *   - A TRANSCRIBED QUANTITY IS NEVER RE-EXPRESSED. "1000 mg", "5000 IU",
 *     "7500 mcg", "≤37.5°C", "MK-7", "LJ100" and the like stay exactly as
 *     they are. Re-expressing a transcribed quantity is how a dose becomes
 *     wrong, and a buyer checks these against the physical label.
 *   - AN ENGLISH WORD IS TRANSLATED. "Capsule", "60 Capsules", "Digital
 *     Upper-Arm", "Whole Food Formula" are our prose, not label arithmetic,
 *     and leaving them sitting under an Arabic field name reads as an
 *     oversight rather than as fidelity.
 *   - Mixed values keep the number and translate the words, so
 *     "3,125 IU (label)" keeps "3,125 IU" and translates only the marker.
 *
 *   - product.strength is left whole: every one of its values is a dose.
 *
 * The same split is recorded in productLabels.ts for names, and it is flagged
 * for review rather than decided permanently here.
 */

/** "1000 mg · 60 Capsules" — the count word is ours, the number is the label's. */
export const QUANTITY_LABELS: Record<string, SimpleTranslationKey> = {
  "60 Capsules": "product.qty.capsules60",
  "120 Capsules": "product.qty.capsules120",
  "120 Tablets": "product.qty.tablets120",
  "1 Piece": "product.qty.piece1",
};

export const PRICE_LABELS: Record<string, SimpleTranslationKey> = {
  "Contact for Price": "product.priceLabel.contact",
};

export const SPEC_KEY_LABELS: Record<string, SimpleTranslationKey> = {
  Strength: "spec.strength",
  "Omega-3 content": "spec.omega3Content",
  Count: "spec.count",
  Form: "spec.form",
  Formula: "spec.formula",
  Type: "spec.type",
  "Omega-3": "spec.omega3",
  EPA: "spec.epa",
  DHA: "spec.dha",
  "Vitamin D3": "spec.vitaminD3",
  "Vitamin A": "spec.vitaminA",
  "Vitamin E": "spec.vitaminE",
  Standardization: "spec.standardization",
  Glucosamine: "spec.glucosamine",
  Chondroitin: "spec.chondroitin",
  Extract: "spec.extract",
  "K2 Form": "spec.k2Form",
  Display: "spec.display",
  "Normal range shown": "spec.normalRange",
  "Low fever range shown": "spec.lowFeverRange",
  "High fever range shown": "spec.highFeverRange",
  Cuff: "spec.cuff",
  Memory: "spec.memory",
  Operation: "spec.operation",
  "Metrics tracked": "spec.metricsTracked",
  Connectivity: "spec.connectivity",
  Users: "spec.users",
  "Test time": "spec.testTime",
  "Sample size": "spec.sampleSize",
  Standard: "spec.standard",
  "Kit includes": "spec.kitIncludes",
};

/**
 * Only the specification values that contain English words. Anything absent
 * from this map is a transcribed quantity and is rendered as-is: see the
 * header comment. "(label)" is the same kind of disclosure as "(label claim)"
 * and is carried across rather than dropped.
 */
export const SPEC_VALUE_LABELS: Record<string, SimpleTranslationKey> = {
  "0.6 µL (label)": "specValue.microlitres06",
  "1 Piece": "specValue.piece1",
  "1,250 mcg (label)": "specValue.mcg1250",
  "110 mg (label)": "specValue.mg110",
  "120 Capsules": "specValue.capsules120",
  "120 Memories / 2 Users (label)": "specValue.memories120Users2",
  "120 Tablets": "specValue.tablets120",
  "125 mg (label)": "specValue.mg125",
  "13 Body Metrics (label): Body Fat %, BMI, Muscle Mass, Body Water %, Bone Mass, Protein %":
    "specValue.bodyMetrics13",
  "13 IU (label)": "specValue.iu13",
  "235 mg (label)": "specValue.mg235",
  "3,125 IU (label)": "specValue.iu3125",
  "3-Color Fever Alert (label)": "specValue.threeColorFeverAlert",
  "5 Second Test Time (label)": "specValue.fiveSecondTest",
  "500 Test Memory (label)": "specValue.testMemory500",
  "60 Capsules": "specValue.capsules60",
  "80% Silymarin": "specValue.silymarin80",
  Capsule: "specValue.capsule",
  "ComfortFit Universal Cuff (label)": "specValue.comfortFitCuff",
  "Complete Formula": "specValue.completeFormula",
  Digital: "specValue.digital",
  "Digital Upper-Arm": "specValue.digitalUpperArm",
  "EN ISO 15197:2015 (label)": "specValue.enIso15197",
  "Men's Support Formula": "specValue.mensSupportFormula",
  "Meter, lancing pen, lancets, test strips, batteries, user manual, quick start guide (per label)":
    "specValue.glucoseKitContents",
  "Mineral Vitality Formula": "specValue.mineralVitalityFormula",
  "Non-Contact Infrared": "specValue.nonContactInfrared",
  "One Touch (label)": "specValue.oneTouch",
  "Performance Formula": "specValue.performanceFormula",
  "Sea Mineral Blend": "specValue.seaMineralBlend",
  Tablet: "specValue.tablet",
  "Unlimited Users (label)": "specValue.unlimitedUsers",
  "Vitamin A Precursor": "specValue.vitaminAPrecursor",
  "Whole Food Formula": "specValue.wholeFoodFormula",
  "Wi-Fi Sync": "specValue.wifiSync",
  "~240 mg per label": "specValue.mg240PerLabel",
};

/**
 * "(label claim)" is a disclosure, not decoration: it marks the line as the
 * manufacturer's claim rather than the practice's. It is carried into the
 * Arabic on every line that has it in the English. Dropping it there would
 * turn a manufacturer's claim into ours.
 */
export const HIGHLIGHT_LABELS: Record<string, SimpleTranslationKey> = {
  "EPA & DHA": "productHighlight.epaDha",
  "Heart & Cellular Energy (label claim)": "productHighlight.heartCellularEnergy",
  "Immune + Heart Support (label claim)": "productHighlight.immuneHeartSupport",
  "Vitamin A & D": "productHighlight.vitaminAD",
  "Seaweed Power": "productHighlight.seaweedPower",
  "Ocean Nourished": "productHighlight.oceanNourished",
  "Mineral Rich": "productHighlight.mineralRichPlain",
  "Daily Wellness": "productHighlight.dailyWellnessPlain",
  "Antioxidant defense (label claim)": "productHighlight.antioxidantDefense",
  "Healthy aging (label claim)": "productHighlight.healthyAging",
  "Cellular support (label claim)": "productHighlight.cellularSupport",
  "Supports vision, skin health, and immune function (label claim)":
    "productHighlight.visionSkinImmune",
  "Omega-3 Support": "productHighlight.omega3Support",
  "Vitamins A & D": "productHighlight.vitaminsAD",
  "Immune + Heart (label claim)": "productHighlight.immuneHeart",
  "Liver health (label claim)": "productHighlight.liverHealth",
  "Digestive support (label claim)": "productHighlight.digestiveSupport",
  "Liver support (label claim)": "productHighlight.liverSupport",
  "Detox support (label claim)": "productHighlight.detoxSupport",
  "Antioxidant support (label claim)": "productHighlight.antioxidantSupport",
  "Joint comfort (label claim)": "productHighlight.jointComfort",
  "Cartilage support (label claim)": "productHighlight.cartilageSupport",
  "Mobility support (label claim)": "productHighlight.mobilitySupport",
  "Supports metabolic balance (label claim)": "productHighlight.metabolicBalance",
  "Daily wellness (label claim)": "productHighlight.dailyWellnessClaim",
  "Supports antioxidant defense (label claim)": "productHighlight.supportsAntioxidantDefense",
  "Hydration balance (label claim)": "productHighlight.hydrationBalance",
  "Mineral support (label claim)": "productHighlight.mineralSupport",
  "Mineral-rich (label claim)": "productHighlight.mineralRichClaim",
  "Plant-based nutrition (label claim)": "productHighlight.plantBasedNutrition",
  "Power (label claim)": "productHighlight.power",
  "Endurance (label claim)": "productHighlight.endurance",
  "Vitality (label claim)": "productHighlight.vitality",
  "Balance (label claim)": "productHighlight.balance",
  "Wellness (label claim)": "productHighlight.wellness",
  "Stamina (label claim)": "productHighlight.stamina",
  "Performance (label claim)": "productHighlight.performance",
  "Energy (label claim)": "productHighlight.energy",
  "Focus (label claim)": "productHighlight.focus",
  "Cellular defense (label claim)": "productHighlight.cellularDefense",
  "Nutrient-dense support for energy, immunity, and vitality (label claim)":
    "productHighlight.nutrientDense",
  "Supports bone, heart, and immune system health (label claim)":
    "productHighlight.boneHeartImmune",
  "Daily Energy Support (label claim)": "productHighlight.dailyEnergySupport",
  "Fast Reading (label claim)": "productHighlight.fastReading",
  "Non-Contact": "productHighlight.nonContact",
  "3-Color Fever Alert (label claim)": "productHighlight.threeColorFeverAlert",
  "High Accuracy (label claim)": "productHighlight.highAccuracy",
  "Beep Alert (label claim)": "productHighlight.beepAlert",
  "Safe & Hygienic (label claim)": "productHighlight.safeHygienic",
  "Irregular Heartbeat Detection (label claim)": "productHighlight.irregularHeartbeat",
  "ComfortFit Universal Cuff": "productHighlight.comfortFitCuff",
  "120 Memories, 2 Users": "productHighlight.memories120Users2",
  "One Touch Operation": "productHighlight.oneTouchOperation",
  "Body Fat %, BMI, Muscle Mass, Body Water %, Bone Mass, Protein %":
    "productHighlight.bodyMetrics",
  "Wi-Fi Sync": "productHighlight.wifiSync",
  "Multi-User": "productHighlight.multiUser",
  "5 Second Test Time (label claim)": "productHighlight.fiveSecondTest",
  "High Accuracy — EN ISO 15197:2015 (label claim)": "productHighlight.highAccuracyIso",
  "500 Test Memory": "productHighlight.testMemory500",
};

/** Product slug -> long-description key. */
export const PRODUCT_FULL_LABELS: Record<string, SimpleTranslationKey> = {
  "omega-3-krill-oil": "product.omega3KrillOil.full",
  "irish-moss-bladderwrack": "product.irishMossBladderwrack.full",
  resveratrol: "product.resveratrol.full",
  "beta-carotene": "product.betaCarotene.full",
  "norwegian-cod-liver-oil-60": "product.norwegianCodLiverOil60.full",
  tudca: "product.tudca.full",
  "milk-thistle-extract": "product.milkThistleExtract.full",
  "glucosamine-chondroitin": "product.glucosamineChondroitin.full",
  "berberine-plus": "product.berberinePlus.full",
  "alpha-lipoic-acid": "product.alphaLipoicAcid.full",
  "potassium-gluconate": "product.potassiumGluconate.full",
  spirulina: "product.spirulina.full",
  "shilajit-extra-strength": "product.shilajitExtraStrength.full",
  "stinging-nettle": "product.stingingNettle.full",
  "tongkat-ali": "product.tongkatAli.full",
  "super-male-b-complex": "product.superMaleBComplex.full",
  glutathione: "product.glutathione.full",
  "grass-fed-beef-liver": "product.grassFedBeefLiver.full",
  "vitamin-d3-k2": "product.vitaminD3K2.full",
  "norwegian-cod-liver-oil-120": "product.norwegianCodLiverOil120.full",
  coq10: "product.coq10.full",
  "advanced-b-complex": "product.advancedBComplex.full",
  "non-contact-infrared-thermometer": "product.nonContactInfraredThermometer.full",
  "digital-thermometer": "product.digitalThermometer.full",
  "digital-blood-pressure-monitor": "product.digitalBloodPressureMonitor.full",
  "smart-body-composition-scale": "product.smartBodyCompositionScale.full",
  "blood-glucose-meter-kit": "product.bloodGlucoseMeterKit.full",
};

/**
 * Every accessor below falls back to the stored English rather than showing a
 * key, so adding a product without adding keys degrades to English copy on the
 * page instead of "product.foo.full" in front of a customer.
 */
export function productFull(p: Product, t: TranslateFn): string {
  const k = PRODUCT_FULL_LABELS[p.slug];
  return k ? t(k) : p.fullDescription;
}

export function productHighlightText(highlight: string, t: TranslateFn): string {
  const k = HIGHLIGHT_LABELS[highlight];
  return k ? t(k) : highlight;
}

export function productPriceLabel(p: Product, t: TranslateFn): string {
  const k = PRICE_LABELS[p.priceLabel];
  return k ? t(k) : p.priceLabel;
}

export function specKeyText(key: string, t: TranslateFn): string {
  const k = SPEC_KEY_LABELS[key];
  return k ? t(k) : key;
}

/**
 * Absence from this map is the signal "this value is a transcribed quantity,
 * leave it alone" — so the fallback returns the value untouched, which is the
 * correct outcome for "1000 mg" and not merely a missing translation.
 */
export function specValueText(value: string, t: TranslateFn): string {
  const k = SPEC_VALUE_LABELS[value];
  return k ? t(k) : value;
}

/**
 * Strength stays exactly as transcribed; only the quantity's count word is
 * translated. Joined with the same " · " separator the English uses.
 */
export function productMeta(p: Product, t: TranslateFn): string {
  const qtyKey = p.quantity ? QUANTITY_LABELS[p.quantity] : undefined;
  const qty = p.quantity ? (qtyKey ? t(qtyKey) : p.quantity) : "";
  return [p.strength, qty].filter(Boolean).join(" · ");
}

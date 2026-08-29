import type { SimpleTranslationKey } from "./dictionaries/en";

/**
 * Product slug -> display keys.
 *
 * The slug is the identity: it is the URL segment, the related-product lookup
 * and the React key. Names and short descriptions are display only.
 *
 * NAMES ARE PART-TRANSLATED ON PURPOSE. Scientific and brand tokens stay in
 * Latin — TUDCA, CoQ10, LJ100, MK-7, D3, K2 — because a buyer matches them
 * against what is printed on the bottle, and an Arabic rendering of "TUDCA"
 * would make the product harder to identify, not easier. Where a settled
 * Arabic term exists it is used: زيت كبد سمك القد النرويجي, ميزان حرارة رقمي.
 * That split is the pharmacy convention and it is flagged for review.
 */
export const PRODUCT_LABELS: Record<
  string,
  { name: SimpleTranslationKey; short: SimpleTranslationKey }
> = {
  "omega-3-krill-oil": {
    name: "product.omega3KrillOil.name",
    short: "product.omega3KrillOil.short",
  },
  "irish-moss-bladderwrack": {
    name: "product.irishMossBladderwrack.name",
    short: "product.irishMossBladderwrack.short",
  },
  resveratrol: { name: "product.resveratrol.name", short: "product.resveratrol.short" },
  "beta-carotene": { name: "product.betaCarotene.name", short: "product.betaCarotene.short" },
  "norwegian-cod-liver-oil-60": {
    name: "product.norwegianCodLiverOil60.name",
    short: "product.norwegianCodLiverOil60.short",
  },
  tudca: { name: "product.tudca.name", short: "product.tudca.short" },
  "milk-thistle-extract": {
    name: "product.milkThistleExtract.name",
    short: "product.milkThistleExtract.short",
  },
  "glucosamine-chondroitin": {
    name: "product.glucosamineChondroitin.name",
    short: "product.glucosamineChondroitin.short",
  },
  "berberine-plus": { name: "product.berberinePlus.name", short: "product.berberinePlus.short" },
  "alpha-lipoic-acid": {
    name: "product.alphaLipoicAcid.name",
    short: "product.alphaLipoicAcid.short",
  },
  "potassium-gluconate": {
    name: "product.potassiumGluconate.name",
    short: "product.potassiumGluconate.short",
  },
  spirulina: { name: "product.spirulina.name", short: "product.spirulina.short" },
  "shilajit-extra-strength": {
    name: "product.shilajitExtraStrength.name",
    short: "product.shilajitExtraStrength.short",
  },
  "stinging-nettle": { name: "product.stingingNettle.name", short: "product.stingingNettle.short" },
  "tongkat-ali": { name: "product.tongkatAli.name", short: "product.tongkatAli.short" },
  "super-male-b-complex": {
    name: "product.superMaleBComplex.name",
    short: "product.superMaleBComplex.short",
  },
  glutathione: { name: "product.glutathione.name", short: "product.glutathione.short" },
  "grass-fed-beef-liver": {
    name: "product.grassFedBeefLiver.name",
    short: "product.grassFedBeefLiver.short",
  },
  "vitamin-d3-k2": { name: "product.vitaminD3K2.name", short: "product.vitaminD3K2.short" },
  "norwegian-cod-liver-oil-120": {
    name: "product.norwegianCodLiverOil120.name",
    short: "product.norwegianCodLiverOil120.short",
  },
  coq10: { name: "product.coq10.name", short: "product.coq10.short" },
  "advanced-b-complex": {
    name: "product.advancedBComplex.name",
    short: "product.advancedBComplex.short",
  },
  "non-contact-infrared-thermometer": {
    name: "product.nonContactInfraredThermometer.name",
    short: "product.nonContactInfraredThermometer.short",
  },
  "digital-thermometer": {
    name: "product.digitalThermometer.name",
    short: "product.digitalThermometer.short",
  },
  "digital-blood-pressure-monitor": {
    name: "product.digitalBloodPressureMonitor.name",
    short: "product.digitalBloodPressureMonitor.short",
  },
  "smart-body-composition-scale": {
    name: "product.smartBodyCompositionScale.name",
    short: "product.smartBodyCompositionScale.short",
  },
  "blood-glucose-meter-kit": {
    name: "product.bloodGlucoseMeterKit.name",
    short: "product.bloodGlucoseMeterKit.short",
  },
};

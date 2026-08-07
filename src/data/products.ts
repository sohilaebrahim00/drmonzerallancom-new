export type ProductCategory =
  | "Supplements"
  | "Vitamins & Minerals"
  | "Herbal Wellness"
  | "Health Monitoring Devices";

export type ProductAvailability = "in-stock" | "low-stock" | "sold-out" | "inquiry";

export interface Product {
  id: string;
  slug: string;
  name: string;
  strength?: string;
  quantity?: string;
  shortDescription: string;
  fullDescription: string;
  category: ProductCategory;
  mainImage: string;
  gallery: string[];
  price: number | null;
  currency: "USD";
  priceLabel: string;
  /** No real Stripe link exists yet — leave unset until one does. */
  stripePaymentLink?: string;
  availability: ProductAvailability;
  restockDate?: string | null;
  specifications: Record<string, string>;
  highlights: string[];
  published: boolean;
  featured: boolean;
}

const IMG = "/images/products";

/**
 * Real, approved Monzer Allan-branded product photography (supplied directly
 * by the client — not sourced from Alibaba or generated). Every name,
 * strength, quantity, and highlight below is transcribed from what is
 * visibly printed on that product's own packaging — nothing invented.
 *
 * All 27 products are currently marked `availability: "sold-out"` — see
 * AUTH_AND_SOLD_OUT_REPORT.md. No price has been confirmed for any product,
 * so `price` is `null` and `priceLabel` reads "Contact for Price"
 * everywhere; do not attach the old Alibaba placeholder prices to these.
 */
export const products: Product[] = [
  {
    id: "omega-3-krill-oil",
    slug: "omega-3-krill-oil",
    name: "Omega-3 Krill Oil",
    strength: "1000 mg",
    quantity: "120 Capsules",
    category: "Supplements",
    shortDescription:
      "A Monzer Allan-branded krill oil dietary supplement providing about 240 mg of omega-3s per serving.",
    fullDescription:
      "A Monzer Allan-branded omega-3 krill oil dietary supplement presented in capsule form, providing approximately 240 mg of omega-3s per the label. Strength and capsule count are shown on the product packaging.",
    mainImage: `${IMG}/omega-3-krill-oil.webp`,
    gallery: [],
    price: null,
    currency: "USD",
    priceLabel: "Contact for Price",
    availability: "sold-out",
    restockDate: null,
    specifications: {
      Strength: "1000 mg",
      "Omega-3 content": "~240 mg per label",
      Count: "120 Capsules",
      Form: "Capsule",
    },
    highlights: [
      "EPA & DHA",
      "Heart & Cellular Energy (label claim)",
      "Immune + Heart Support (label claim)",
      "Vitamin A & D",
    ],
    published: true,
    featured: true,
  },
  {
    id: "irish-moss-bladderwrack",
    slug: "irish-moss-bladderwrack",
    name: "Irish Moss + Bladderwrack",
    quantity: "60 Capsules",
    category: "Herbal Wellness",
    shortDescription:
      "A Monzer Allan-branded sea mineral blend supplement combining Irish moss and bladderwrack.",
    fullDescription:
      "A Monzer Allan-branded Irish Moss + Bladderwrack sea mineral blend, presented as an ocean greens and wellness support capsule. Capsule count is shown on the packaging.",
    mainImage: `${IMG}/irish-moss-bladderwrack.webp`,
    gallery: [],
    price: null,
    currency: "USD",
    priceLabel: "Contact for Price",
    availability: "sold-out",
    restockDate: null,
    specifications: {
      Formula: "Sea Mineral Blend",
      Count: "60 Capsules",
      Form: "Capsule",
    },
    highlights: ["Seaweed Power", "Ocean Nourished", "Mineral Rich", "Daily Wellness"],
    published: true,
    featured: true,
  },
  {
    id: "resveratrol",
    slug: "resveratrol",
    name: "Resveratrol",
    strength: "1000 mg",
    quantity: "60 Capsules",
    category: "Supplements",
    shortDescription:
      "A Monzer Allan-branded resveratrol supplement positioned for antioxidant and cellular support.",
    fullDescription:
      "A Monzer Allan-branded resveratrol dietary supplement presented in capsule form. Strength and capsule count are displayed on the packaging.",
    mainImage: `${IMG}/resveratrol.webp`,
    gallery: [],
    price: null,
    currency: "USD",
    priceLabel: "Contact for Price",
    availability: "sold-out",
    restockDate: null,
    specifications: {
      Strength: "1000 mg",
      Count: "60 Capsules",
      Form: "Capsule",
    },
    highlights: [
      "Antioxidant defense (label claim)",
      "Healthy aging (label claim)",
      "Cellular support (label claim)",
    ],
    published: true,
    featured: false,
  },
  {
    id: "beta-carotene",
    slug: "beta-carotene",
    name: "Beta Carotene",
    strength: "7500 mcg",
    quantity: "120 Capsules",
    category: "Vitamins & Minerals",
    shortDescription: "A Monzer Allan-branded beta carotene supplement, a vitamin A precursor.",
    fullDescription:
      "A Monzer Allan-branded Beta Carotene dietary supplement, labeled as a vitamin A precursor. Strength and capsule count are shown on the packaging.",
    mainImage: `${IMG}/beta-carotene.webp`,
    gallery: [],
    price: null,
    currency: "USD",
    priceLabel: "Contact for Price",
    availability: "sold-out",
    restockDate: null,
    specifications: {
      Strength: "7500 mcg",
      Type: "Vitamin A Precursor",
      Count: "120 Capsules",
      Form: "Capsule",
    },
    highlights: ["Supports vision, skin health, and immune function (label claim)"],
    published: true,
    featured: false,
  },
  {
    id: "norwegian-cod-liver-oil-60",
    slug: "norwegian-cod-liver-oil-60",
    name: "Norwegian Cod Liver Oil — 60 Capsules",
    strength: "1250 mg",
    quantity: "60 Capsules",
    category: "Supplements",
    shortDescription:
      "A Monzer Allan-branded Norwegian cod liver oil supplement with omega-3s and vitamins A & D.",
    fullDescription:
      "A Monzer Allan-branded Norwegian Cod Liver Oil dietary supplement in the 60-capsule size, with per-capsule amounts for omega-3, EPA, DHA, vitamin D3, vitamin A, and vitamin E printed on the label. This is a separate listing from the 120-capsule size.",
    mainImage: `${IMG}/norwegian-cod-liver-oil-60.webp`,
    gallery: [],
    price: null,
    currency: "USD",
    priceLabel: "Contact for Price",
    availability: "sold-out",
    restockDate: null,
    specifications: {
      Strength: "1250 mg",
      Count: "60 Capsules",
      "Omega-3": "235 mg (label)",
      EPA: "110 mg (label)",
      DHA: "125 mg (label)",
      "Vitamin D3": "3,125 IU (label)",
      "Vitamin A": "1,250 mcg (label)",
      "Vitamin E": "13 IU (label)",
    },
    highlights: [
      "Omega-3 Support",
      "Vitamins A & D",
      "Immune + Heart (label claim)",
      "Daily Wellness",
    ],
    published: true,
    featured: false,
  },
  {
    id: "tudca",
    slug: "tudca",
    name: "TUDCA",
    strength: "250 mg",
    quantity: "60 Capsules",
    category: "Supplements",
    shortDescription:
      "A Monzer Allan-branded TUDCA supplement positioned for liver and digestive support.",
    fullDescription:
      "A Monzer Allan-branded TUDCA dietary supplement presented in capsule form. Strength and capsule count are displayed on the packaging.",
    mainImage: `${IMG}/tudca.webp`,
    gallery: [],
    price: null,
    currency: "USD",
    priceLabel: "Contact for Price",
    availability: "sold-out",
    restockDate: null,
    specifications: {
      Strength: "250 mg",
      Count: "60 Capsules",
      Form: "Capsule",
    },
    highlights: [
      "Liver health (label claim)",
      "Digestive support (label claim)",
      "Cellular support (label claim)",
    ],
    published: true,
    featured: false,
  },
  {
    id: "milk-thistle-extract",
    slug: "milk-thistle-extract",
    name: "Milk Thistle Extract",
    strength: "175 mg (80% Silymarin)",
    quantity: "60 Capsules",
    category: "Herbal Wellness",
    shortDescription:
      "A Monzer Allan-branded milk thistle extract supplement standardized to 80% silymarin.",
    fullDescription:
      "A Monzer Allan-branded Milk Thistle Extract dietary supplement, standardized to 80% silymarin per the label, positioned for liver detox and protection support. Strength and capsule count are shown on the packaging.",
    mainImage: `${IMG}/milk-thistle-extract.webp`,
    gallery: [],
    price: null,
    currency: "USD",
    priceLabel: "Contact for Price",
    availability: "sold-out",
    restockDate: null,
    specifications: {
      Strength: "175 mg",
      Standardization: "80% Silymarin",
      Count: "60 Capsules",
      Form: "Capsule",
    },
    highlights: [
      "Liver support (label claim)",
      "Detox support (label claim)",
      "Antioxidant support (label claim)",
    ],
    published: true,
    featured: false,
  },
  {
    id: "glucosamine-chondroitin",
    slug: "glucosamine-chondroitin",
    name: "Glucosamine Chondroitin",
    strength: "1500 mg Glucosamine / 1200 mg Chondroitin",
    quantity: "60 Capsules",
    category: "Supplements",
    shortDescription:
      "A Monzer Allan-branded glucosamine and chondroitin supplement for joint and mobility support.",
    fullDescription:
      "A Monzer Allan-branded Glucosamine with Chondroitin dietary supplement. Strength and capsule count are shown on the packaging.",
    mainImage: `${IMG}/glucosamine-chondroitin.webp`,
    gallery: [],
    price: null,
    currency: "USD",
    priceLabel: "Contact for Price",
    availability: "sold-out",
    restockDate: null,
    specifications: {
      Glucosamine: "1500 mg",
      Chondroitin: "1200 mg",
      Count: "60 Capsules",
      Form: "Capsule",
    },
    highlights: [
      "Joint comfort (label claim)",
      "Cartilage support (label claim)",
      "Mobility support (label claim)",
    ],
    published: true,
    featured: false,
  },
  {
    id: "berberine-plus",
    slug: "berberine-plus",
    name: "Berberine Plus",
    strength: "1200 mg",
    quantity: "60 Capsules",
    category: "Supplements",
    shortDescription:
      "A Monzer Allan-branded berberine supplement positioned for metabolic and glucose support.",
    fullDescription:
      "A Monzer Allan-branded Berberine Plus dietary supplement presented in capsule form. Strength and capsule count are displayed on the packaging.",
    mainImage: `${IMG}/berberine-plus.webp`,
    gallery: [],
    price: null,
    currency: "USD",
    priceLabel: "Contact for Price",
    availability: "sold-out",
    restockDate: null,
    specifications: {
      Strength: "1200 mg",
      Count: "60 Capsules",
      Form: "Capsule",
    },
    highlights: ["Supports metabolic balance (label claim)", "Daily wellness (label claim)"],
    published: true,
    featured: true,
  },
  {
    id: "alpha-lipoic-acid",
    slug: "alpha-lipoic-acid",
    name: "Alpha Lipoic Acid",
    strength: "600 mg",
    quantity: "60 Capsules",
    category: "Supplements",
    shortDescription:
      "A Monzer Allan-branded alpha lipoic acid supplement for cellular and metabolic support.",
    fullDescription:
      "A Monzer Allan-branded Alpha Lipoic Acid dietary supplement presented in capsule form. Strength and capsule count are displayed on the packaging.",
    mainImage: `${IMG}/alpha-lipoic-acid.webp`,
    gallery: [],
    price: null,
    currency: "USD",
    priceLabel: "Contact for Price",
    availability: "sold-out",
    restockDate: null,
    specifications: {
      Strength: "600 mg",
      Count: "60 Capsules",
      Form: "Capsule",
    },
    highlights: ["Supports antioxidant defense (label claim)", "Daily wellness (label claim)"],
    published: true,
    featured: false,
  },
  {
    id: "potassium-gluconate",
    slug: "potassium-gluconate",
    name: "Potassium Gluconate",
    strength: "595 mg",
    quantity: "60 Capsules",
    category: "Vitamins & Minerals",
    shortDescription:
      "A Monzer Allan-branded potassium gluconate supplement for electrolyte and wellness support.",
    fullDescription:
      "A Monzer Allan-branded Potassium Gluconate dietary supplement presented in capsule form. Strength and capsule count are displayed on the packaging.",
    mainImage: `${IMG}/potassium-gluconate.webp`,
    gallery: [],
    price: null,
    currency: "USD",
    priceLabel: "Contact for Price",
    availability: "sold-out",
    restockDate: null,
    specifications: {
      Strength: "595 mg",
      Count: "60 Capsules",
      Form: "Capsule",
    },
    highlights: [
      "Hydration balance (label claim)",
      "Mineral support (label claim)",
      "Daily wellness (label claim)",
    ],
    published: true,
    featured: false,
  },
  {
    id: "spirulina",
    slug: "spirulina",
    name: "Spirulina",
    strength: "3000 mg",
    quantity: "60 Capsules",
    category: "Herbal Wellness",
    shortDescription:
      "A Monzer Allan-branded spirulina supplement for greens and daily wellness support.",
    fullDescription:
      "A Monzer Allan-branded Spirulina dietary supplement presented in capsule form. Strength and capsule count are displayed on the packaging.",
    mainImage: `${IMG}/spirulina.webp`,
    gallery: [],
    price: null,
    currency: "USD",
    priceLabel: "Contact for Price",
    availability: "sold-out",
    restockDate: null,
    specifications: {
      Strength: "3000 mg",
      Count: "60 Capsules",
      Form: "Capsule",
    },
    highlights: [
      "Mineral-rich (label claim)",
      "Plant-based nutrition (label claim)",
      "Daily wellness (label claim)",
    ],
    published: true,
    featured: false,
  },
  {
    id: "shilajit-extra-strength",
    slug: "shilajit-extra-strength",
    name: "Shilajit Extra Strength",
    quantity: "120 Capsules",
    category: "Herbal Wellness",
    shortDescription:
      "A Monzer Allan-branded Shilajit supplement labeled as a mineral vitality formula.",
    fullDescription:
      "A Monzer Allan-branded Shilajit Extra Strength dietary supplement presented in capsule form. Capsule count is displayed on the packaging.",
    mainImage: `${IMG}/shilajit-extra-strength.webp`,
    gallery: [],
    price: null,
    currency: "USD",
    priceLabel: "Contact for Price",
    availability: "sold-out",
    restockDate: null,
    specifications: {
      Formula: "Mineral Vitality Formula",
      Count: "120 Capsules",
      Form: "Capsule",
    },
    highlights: ["Power (label claim)", "Endurance (label claim)", "Vitality (label claim)"],
    published: true,
    featured: false,
  },
  {
    id: "stinging-nettle",
    slug: "stinging-nettle",
    name: "Stinging Nettle",
    strength: "500 mg",
    quantity: "120 Capsules",
    category: "Herbal Wellness",
    shortDescription:
      "A Monzer Allan-branded stinging nettle supplement labeled as a men's support formula.",
    fullDescription:
      "A Monzer Allan-branded Stinging Nettle dietary supplement presented in capsule form. Strength and capsule count are displayed on the packaging.",
    mainImage: `${IMG}/stinging-nettle.webp`,
    gallery: [],
    price: null,
    currency: "USD",
    priceLabel: "Contact for Price",
    availability: "sold-out",
    restockDate: null,
    specifications: {
      Strength: "500 mg",
      Formula: "Men's Support Formula",
      Count: "120 Capsules",
      Form: "Capsule",
    },
    highlights: ["Balance (label claim)", "Vitality (label claim)", "Wellness (label claim)"],
    published: true,
    featured: false,
  },
  {
    id: "tongkat-ali",
    slug: "tongkat-ali",
    name: "Tongkat Ali",
    strength: "1000 mg (LJ100)",
    quantity: "120 Capsules",
    category: "Herbal Wellness",
    shortDescription:
      "A Monzer Allan-branded Tongkat Ali (LJ100) supplement labeled as a strength and vitality formula.",
    fullDescription:
      "A Monzer Allan-branded Tongkat Ali dietary supplement using the LJ100 extract per the label. Strength and capsule count are displayed on the packaging.",
    mainImage: `${IMG}/tongkat-ali.webp`,
    gallery: [],
    price: null,
    currency: "USD",
    priceLabel: "Contact for Price",
    availability: "sold-out",
    restockDate: null,
    specifications: {
      Strength: "1000 mg",
      Extract: "LJ100",
      Count: "120 Capsules",
      Form: "Capsule",
    },
    highlights: ["Stamina (label claim)", "Performance (label claim)", "Vitality (label claim)"],
    published: true,
    featured: false,
  },
  {
    id: "super-male-b-complex",
    slug: "super-male-b-complex",
    name: "Super Male B-Complex",
    quantity: "120 Capsules",
    category: "Vitamins & Minerals",
    shortDescription:
      "A Monzer Allan-branded B-Complex supplement labeled as a performance formula.",
    fullDescription:
      "A Monzer Allan-branded Super Male B-Complex dietary supplement presented in capsule form. Capsule count is displayed on the packaging.",
    mainImage: `${IMG}/super-male-b-complex.webp`,
    gallery: [],
    price: null,
    currency: "USD",
    priceLabel: "Contact for Price",
    availability: "sold-out",
    restockDate: null,
    specifications: {
      Formula: "Performance Formula",
      Count: "120 Capsules",
      Form: "Capsule",
    },
    highlights: ["Energy (label claim)", "Focus (label claim)", "Vitality (label claim)"],
    published: true,
    featured: false,
  },
  {
    id: "glutathione",
    slug: "glutathione",
    name: "Glutathione",
    strength: "500 mg",
    quantity: "60 Capsules",
    category: "Supplements",
    shortDescription:
      "A Monzer Allan-branded glutathione supplement for antioxidant and cellular defense support.",
    fullDescription:
      "A Monzer Allan-branded Glutathione dietary supplement presented in capsule form. Strength and capsule count are displayed on the packaging.",
    mainImage: `${IMG}/glutathione.webp`,
    gallery: [],
    price: null,
    currency: "USD",
    priceLabel: "Contact for Price",
    availability: "sold-out",
    restockDate: null,
    specifications: {
      Strength: "500 mg",
      Count: "60 Capsules",
      Form: "Capsule",
    },
    highlights: [
      "Antioxidant support (label claim)",
      "Cellular defense (label claim)",
      "Detox support (label claim)",
    ],
    published: true,
    featured: false,
  },
  {
    id: "grass-fed-beef-liver",
    slug: "grass-fed-beef-liver",
    name: "Grass-Fed Beef Liver",
    strength: "4500 mg",
    quantity: "120 Capsules",
    category: "Supplements",
    shortDescription: "A Monzer Allan-branded grass-fed beef liver whole food supplement.",
    fullDescription:
      "A Monzer Allan-branded Grass-Fed Beef Liver whole food formula dietary supplement, presented in capsule form. Strength and capsule count are displayed on the packaging.",
    mainImage: `${IMG}/grass-fed-beef-liver.webp`,
    gallery: [],
    price: null,
    currency: "USD",
    priceLabel: "Contact for Price",
    availability: "sold-out",
    restockDate: null,
    specifications: {
      Strength: "4500 mg",
      Formula: "Whole Food Formula",
      Count: "120 Capsules",
      Form: "Capsule",
    },
    highlights: ["Nutrient-dense support for energy, immunity, and vitality (label claim)"],
    published: true,
    featured: false,
  },
  {
    id: "vitamin-d3-k2",
    slug: "vitamin-d3-k2",
    name: "Vitamin D3K2",
    strength: "5000 IU (MK-7)",
    quantity: "120 Tablets",
    category: "Vitamins & Minerals",
    shortDescription:
      "A Monzer Allan-branded Vitamin D3 + K2 (MK-7) supplement for bone, heart, and immune support.",
    fullDescription:
      "A Monzer Allan-branded Vitamin D3K2 dietary supplement using the MK-7 form of vitamin K2 per the label. Strength and tablet count are displayed on the packaging.",
    mainImage: `${IMG}/vitamin-d3-k2.webp`,
    gallery: [],
    price: null,
    currency: "USD",
    priceLabel: "Contact for Price",
    availability: "sold-out",
    restockDate: null,
    specifications: {
      Strength: "5000 IU",
      "K2 Form": "MK-7",
      Count: "120 Tablets",
      Form: "Tablet",
    },
    highlights: ["Supports bone, heart, and immune system health (label claim)"],
    published: true,
    featured: true,
  },
  {
    id: "norwegian-cod-liver-oil-120",
    slug: "norwegian-cod-liver-oil-120",
    name: "Norwegian Cod Liver Oil — 120 Capsules",
    strength: "1250 mg",
    quantity: "120 Capsules",
    category: "Supplements",
    shortDescription:
      "A Monzer Allan-branded Norwegian cod liver oil supplement with vitamins A & D and omega-3.",
    fullDescription:
      "A Monzer Allan-branded Norwegian Cod Liver Oil dietary supplement in the 120-capsule size, labeled Vitamins A & D + 3-Omega. This is a separate listing from the 60-capsule size and is not merged with it.",
    mainImage: `${IMG}/norwegian-cod-liver-oil-120.webp`,
    gallery: [],
    price: null,
    currency: "USD",
    priceLabel: "Contact for Price",
    availability: "sold-out",
    restockDate: null,
    specifications: {
      Strength: "1250 mg",
      Count: "120 Capsules",
      Form: "Capsule",
    },
    highlights: ["EPA & DHA", "Immune + Heart Support (label claim)", "Vitamin A & D"],
    published: true,
    featured: false,
  },
  {
    id: "coq10",
    slug: "coq10",
    name: "CoQ10",
    strength: "200 mg",
    quantity: "120 Capsules",
    category: "Supplements",
    shortDescription:
      "A Monzer Allan-branded CoQ10 supplement for heart and cellular energy support.",
    fullDescription:
      "A Monzer Allan-branded CoQ10 dietary supplement presented in capsule form. Strength and capsule count are displayed on the packaging.",
    mainImage: `${IMG}/coq10.webp`,
    gallery: [],
    price: null,
    currency: "USD",
    priceLabel: "Contact for Price",
    availability: "sold-out",
    restockDate: null,
    specifications: {
      Strength: "200 mg",
      Count: "120 Capsules",
      Form: "Capsule",
    },
    highlights: ["Heart & Cellular Energy (label claim)"],
    published: true,
    featured: false,
  },
  {
    id: "advanced-b-complex",
    slug: "advanced-b-complex",
    name: "Advanced B-Complex",
    quantity: "120 Capsules",
    category: "Vitamins & Minerals",
    shortDescription:
      "A Monzer Allan-branded B-Complex supplement labeled as a complete daily energy formula.",
    fullDescription:
      "A Monzer Allan-branded Advanced B-Complex dietary supplement presented in capsule form. Capsule count is displayed on the packaging.",
    mainImage: `${IMG}/advanced-b-complex.webp`,
    gallery: [],
    price: null,
    currency: "USD",
    priceLabel: "Contact for Price",
    availability: "sold-out",
    restockDate: null,
    specifications: {
      Formula: "Complete Formula",
      Count: "120 Capsules",
      Form: "Capsule",
    },
    highlights: ["Daily Energy Support (label claim)"],
    published: true,
    featured: false,
  },
  {
    id: "non-contact-infrared-thermometer",
    slug: "non-contact-infrared-thermometer",
    name: "Non-Contact Infrared Thermometer",
    category: "Health Monitoring Devices",
    shortDescription:
      "A Monzer Allan-branded non-contact infrared thermometer with a 3-color fever alert display.",
    fullDescription:
      "A Monzer Allan-branded non-contact infrared thermometer for convenient at-home temperature checks. Refer to the included product instructions for correct setup and use.",
    mainImage: `${IMG}/non-contact-infrared-thermometer.webp`,
    gallery: [],
    price: null,
    currency: "USD",
    priceLabel: "Contact for Price",
    availability: "sold-out",
    restockDate: null,
    specifications: {
      Type: "Non-Contact Infrared",
      Display: "3-Color Fever Alert (label)",
      "Normal range shown": "≤37.5°C",
      "Low fever range shown": "37.6–38.5°C",
      "High fever range shown": "≥38.6°C",
    },
    highlights: ["Fast Reading (label claim)", "Non-Contact", "3-Color Fever Alert (label claim)"],
    published: true,
    featured: false,
  },
  {
    id: "digital-thermometer",
    slug: "digital-thermometer",
    name: "Digital Thermometer",
    quantity: "1 Piece",
    category: "Health Monitoring Devices",
    shortDescription:
      "A Monzer Allan-branded digital thermometer for at-home temperature readings.",
    fullDescription:
      "A Monzer Allan-branded digital thermometer designed for convenient at-home measurements. Refer to the included product instructions for correct setup and use.",
    mainImage: `${IMG}/digital-thermometer.webp`,
    gallery: [],
    price: null,
    currency: "USD",
    priceLabel: "Contact for Price",
    availability: "sold-out",
    restockDate: null,
    specifications: {
      Type: "Digital",
      Count: "1 Piece",
    },
    highlights: [
      "High Accuracy (label claim)",
      "Fast Reading (label claim)",
      "Beep Alert (label claim)",
      "Safe & Hygienic (label claim)",
    ],
    published: true,
    featured: false,
  },
  {
    id: "digital-blood-pressure-monitor",
    slug: "digital-blood-pressure-monitor",
    name: "Digital Upper-Arm Blood Pressure Monitor",
    category: "Health Monitoring Devices",
    shortDescription:
      "A Monzer Allan-branded digital upper-arm blood pressure monitor with a universal cuff.",
    fullDescription:
      "A Monzer Allan-branded digital upper-arm blood pressure monitor designed for convenient at-home measurements, including a universal-fit cuff. Refer to the included product instructions for correct setup and use.",
    mainImage: `${IMG}/digital-blood-pressure-monitor.webp`,
    gallery: [],
    price: null,
    currency: "USD",
    priceLabel: "Contact for Price",
    availability: "sold-out",
    restockDate: null,
    specifications: {
      Type: "Digital Upper-Arm",
      Cuff: "ComfortFit Universal Cuff (label)",
      Memory: "120 Memories / 2 Users (label)",
      Operation: "One Touch (label)",
    },
    highlights: [
      "Irregular Heartbeat Detection (label claim)",
      "ComfortFit Universal Cuff",
      "120 Memories, 2 Users",
      "One Touch Operation",
    ],
    published: true,
    featured: true,
  },
  {
    id: "smart-body-composition-scale",
    slug: "smart-body-composition-scale",
    name: "Smart Body Composition Scale",
    category: "Health Monitoring Devices",
    shortDescription:
      "A Monzer Allan-branded smart scale that tracks body composition metrics with Wi-Fi sync.",
    fullDescription:
      "A Monzer Allan-branded smart body composition scale designed for convenient at-home tracking, with Wi-Fi sync and support for unlimited user profiles per the label. Refer to the included product instructions for correct setup and use.",
    mainImage: `${IMG}/smart-body-composition-scale.webp`,
    gallery: [],
    price: null,
    currency: "USD",
    priceLabel: "Contact for Price",
    availability: "sold-out",
    restockDate: null,
    specifications: {
      "Metrics tracked":
        "13 Body Metrics (label): Body Fat %, BMI, Muscle Mass, Body Water %, Bone Mass, Protein %",
      Connectivity: "Wi-Fi Sync",
      Users: "Unlimited Users (label)",
    },
    highlights: [
      "Body Fat %, BMI, Muscle Mass, Body Water %, Bone Mass, Protein %",
      "Wi-Fi Sync",
      "Multi-User",
    ],
    published: true,
    featured: true,
  },
  {
    id: "blood-glucose-meter-kit",
    slug: "blood-glucose-meter-kit",
    name: "Blood Glucose Meter Kit",
    category: "Health Monitoring Devices",
    shortDescription: "A Monzer Allan-branded blood glucose meter kit for at-home glucose testing.",
    fullDescription:
      "A Monzer Allan-branded blood glucose meter kit designed for convenient at-home testing. Refer to the included product instructions for correct setup and use.",
    mainImage: `${IMG}/blood-glucose-meter-kit.webp`,
    gallery: [],
    price: null,
    currency: "USD",
    priceLabel: "Contact for Price",
    availability: "sold-out",
    restockDate: null,
    specifications: {
      "Test time": "5 Second Test Time (label)",
      "Sample size": "0.6 µL (label)",
      Standard: "EN ISO 15197:2015 (label)",
      Memory: "500 Test Memory (label)",
      "Kit includes":
        "Meter, lancing pen, lancets, test strips, batteries, user manual, quick start guide (per label)",
    },
    highlights: [
      "5 Second Test Time (label claim)",
      "High Accuracy — EN ISO 15197:2015 (label claim)",
      "500 Test Memory",
    ],
    published: true,
    featured: false,
  },
];

export const productCategories: ProductCategory[] = [
  "Supplements",
  "Vitamins & Minerals",
  "Herbal Wellness",
  "Health Monitoring Devices",
];

export function getPublishedProducts() {
  return products.filter((product) => product.published);
}

export function getFeaturedProducts() {
  return products.filter((product) => product.published && product.featured);
}

export function getProductBySlug(slug: string) {
  const product = products.find((item) => item.slug === slug);
  return product && product.published ? product : undefined;
}

export function getRelatedProducts(product: Product, limit = 3) {
  return getPublishedProducts()
    .filter((item) => item.slug !== product.slug)
    .sort(
      (a, b) =>
        (a.category === product.category ? -1 : 0) - (b.category === product.category ? -1 : 0),
    )
    .slice(0, limit);
}

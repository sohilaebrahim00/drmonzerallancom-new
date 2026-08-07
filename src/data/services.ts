import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Apple,
  Baby,
  Bike,
  Cookie,
  Droplets,
  Gauge,
  HeartPulse,
  Salad,
  Scale,
  Stethoscope,
  Users,
} from "lucide-react";

export interface Service {
  slug: string;
  title: string;
  description: string;
  icon: LucideIcon;
  highlights: string[];
}

export const services: Service[] = [
  {
    slug: "nutrition-consultation",
    title: "Nutrition Consultation",
    description:
      "A personalized one-on-one assessment of your eating habits, lifestyle, and health goals to build a plan that actually fits your life.",
    icon: Stethoscope,
    highlights: ["Full dietary assessment", "Custom nutrition plan", "Ongoing follow-up"],
  },
  {
    slug: "weight-loss",
    title: "Weight Loss",
    description:
      "Sustainable, medically sound weight management built around real food, not extremes or fad diets that don't last.",
    icon: Scale,
    highlights: ["Metabolic evaluation", "Realistic meal structure", "Progress tracking"],
  },
  {
    slug: "weight-gain",
    title: "Weight Gain",
    description:
      "Structured calorie and nutrient plans to help you build healthy mass safely, whether for health, strength, or recovery.",
    icon: Apple,
    highlights: ["Caloric surplus planning", "Nutrient-dense menus", "Strength-friendly guidance"],
  },
  {
    slug: "clinical-nutrition",
    title: "Clinical Nutrition",
    description:
      "Evidence-based nutrition therapy that works alongside your medical treatment for chronic or complex conditions.",
    icon: Activity,
    highlights: [
      "Condition-specific plans",
      "Coordination with physicians",
      "Lab-informed adjustments",
    ],
  },
  {
    slug: "sports-nutrition",
    title: "Sports Nutrition",
    description:
      "Fueling strategies for athletes and active people to improve performance, recovery, and endurance.",
    icon: Bike,
    highlights: ["Performance fueling", "Recovery nutrition", "Hydration strategy"],
  },
  {
    slug: "diabetes-nutrition",
    title: "Diabetes Nutrition",
    description:
      "Blood-sugar-conscious meal planning designed to help you manage diabetes with confidence and enjoy your food again.",
    icon: Droplets,
    highlights: ["Glycemic load planning", "Carb-balanced menus", "Lifestyle coaching"],
  },
  {
    slug: "hypertension",
    title: "Hypertension",
    description:
      "Heart-healthy, low-sodium nutrition strategies tailored to help manage blood pressure naturally.",
    icon: HeartPulse,
    highlights: ["Sodium-conscious planning", "Heart-healthy swaps", "Lifestyle support"],
  },
  {
    slug: "cholesterol",
    title: "Cholesterol",
    description:
      "Targeted dietary changes to help improve your lipid profile and support long-term cardiovascular health.",
    icon: Gauge,
    highlights: ["Lipid-friendly menus", "Fiber & fat balance", "Progress monitoring"],
  },
  {
    slug: "digestive-health",
    title: "Digestive Health",
    description:
      "Gut-focused nutrition to ease discomfort, improve digestion, and identify food sensitivities.",
    icon: Salad,
    highlights: ["Elimination guidance", "Gut-friendly menus", "Symptom tracking"],
  },
  {
    slug: "pregnancy-nutrition",
    title: "Pregnancy Nutrition",
    description:
      "Safe, nutrient-rich guidance to support you and your baby through every trimester.",
    icon: Baby,
    highlights: ["Trimester-based planning", "Micronutrient focus", "Safe-food guidance"],
  },
  {
    slug: "child-nutrition",
    title: "Child Nutrition",
    description:
      "Family-friendly nutrition plans that support healthy growth, energy, and positive eating habits in kids.",
    icon: Cookie,
    highlights: ["Growth-focused planning", "Picky-eater strategies", "Family meal guidance"],
  },
  {
    slug: "senior-nutrition",
    title: "Senior Nutrition",
    description:
      "Thoughtful nutrition care that supports strength, immunity, and quality of life in later years.",
    icon: Users,
    highlights: ["Bone & muscle support", "Appetite-friendly menus", "Medication-aware planning"],
  },
];

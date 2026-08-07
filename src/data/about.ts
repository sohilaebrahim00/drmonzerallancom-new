import type { LucideIcon } from "lucide-react";
import { GraduationCap, Stethoscope } from "lucide-react";

export const bio = {
  paragraphs: [
    "Monzer Allan brings a combination of clinical and nutritional expertise to every consultation — trained as a pharmacist and specialized in nutrition, he approaches health from both the science of the body and the reality of everyday eating.",
    "Rather than one-size-fits-all diet plans, Monzer builds guidance around each client's actual life: their schedule, culture, preferences, and goals. The aim is always the same — lasting change that doesn't feel like a sacrifice.",
    "His approach blends evidence-based nutrition science with genuine, ongoing support, across the specialized programs described below.",
  ],
  mission:
    "To make expert, evidence-based nutrition guidance accessible and genuinely sustainable — helping every client build a healthier relationship with food, one realistic step at a time.",
  vision:
    "A community where healthier choices come from understanding, not restriction — where nutrition care is personal, informed, and built to last a lifetime.",
};

export interface Credential {
  title: string;
  description: string;
  icon: LucideIcon;
}

// Only the two credentials already established on the approved site (Hero:
// "Nutrition Specialist & Pharmacist"). No years-of-experience, client
// counts, ratings, certifications, or career timeline are shown here — none
// have been verified. Add real, confirmed details when available.
export const credentials: Credential[] = [
  {
    title: "Licensed Pharmacist",
    description:
      "A clinical foundation in pharmacology and how nutrition interacts with treatment.",
    icon: Stethoscope,
  },
  {
    title: "Nutrition Specialist",
    description: "Focused training in evidence-based dietary science and behavior change.",
    icon: GraduationCap,
  },
];

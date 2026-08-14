export type FaqCategory =
  | "Membership"
  | "Consultations"
  | "Consultation Credits"
  | "Online Meetings"
  | "Account & Billing"
  | "Products"
  | "Nutrition Services"
  | "General Questions";

export const faqCategories: FaqCategory[] = [
  "Membership",
  "Consultations",
  "Consultation Credits",
  "Online Meetings",
  "Account & Billing",
  "Products",
  "Nutrition Services",
  "General Questions",
];

export interface Faq {
  question: string;
  answer: string;
  category: FaqCategory;
}

export const faqs: Faq[] = [
  {
    question: "What's included in a membership?",
    answer:
      "Every membership includes a set number of monthly consultation credits, access to your member account and consultation history, and ongoing nutrition support. Basic, Premium, and VIP Elite differ in credit allowance and included features — compare them on the Packages page.",
    category: "Membership",
  },
  {
    question: "Can I change or cancel my membership?",
    answer:
      "Yes, memberships are designed to be flexible. Membership billing and self-service cancellation will be available once online payment is fully connected — in the meantime, reach out directly for any changes to your plan.",
    category: "Membership",
  },
  {
    question: "What happens in the first consultation?",
    answer:
      "Your first session is a full assessment of your health history, current eating habits, lifestyle, and goals. By the end, you'll leave with a clear picture of your plan and next steps — no guesswork.",
    category: "Consultations",
  },
  {
    question: "Do you offer online consultations?",
    answer:
      "Yes. Membership consultations are conducted online over Google Meet, and every service can also be booked in person — choose whichever fits your schedule and comfort best.",
    category: "Consultations",
  },
  {
    question: "How do consultation credits work?",
    answer:
      "Each membership includes a fixed number of consultation credits per month (1 for Basic, 3 for Premium, more for VIP Elite). You use one credit each time you request an online consultation from your member account.",
    category: "Consultation Credits",
  },
  {
    question: "What happens if I don't use all my credits?",
    answer:
      "Credits are tied to your active membership period. A formal rollover policy will be confirmed once billing is fully connected — nothing is promised beyond your current cycle at this time.",
    category: "Consultation Credits",
  },
  {
    question: "How do I join my online consultation?",
    answer:
      "Once a consultation request is approved, a Google Meet link is attached to that appointment in your member account. You'll be able to join directly from there at your scheduled time.",
    category: "Online Meetings",
  },
  {
    question: "How do I create a member account?",
    answer:
      "Creating an account is part of choosing a membership package. Visit the Packages page, select a plan, and follow the Create Account steps to set up your login and begin the payment process.",
    category: "Account & Billing",
  },
  {
    question: "Is my payment information secure?",
    answer:
      "Membership payments are intended to be processed through a secure, PCI-compliant payment provider — this website will never ask you to send card details directly. Full checkout is not yet live; the Packages and Join pages will show current status.",
    category: "Account & Billing",
  },
  {
    question: "Can I purchase products directly on the site?",
    answer:
      "All products currently listed are marked Out of Stock. You're welcome to ask about availability from any product page, and we'll follow up directly with updates.",
    category: "Products",
  },
  {
    question: "How soon will I see results?",
    answer:
      "It depends on your goal and starting point, but most clients notice meaningful changes in energy and habits within 2–3 weeks, with visible physical results typically building over 4–8 weeks.",
    category: "Nutrition Services",
  },
  {
    question: "Is the plan built around foods I already eat?",
    answer:
      "Always. Every plan starts from your current lifestyle, preferences, and culture — it's adapted to you, not a generic template you're forced to follow.",
    category: "Nutrition Services",
  },
  {
    question: "Can you work with an existing medical condition?",
    answer:
      "Yes, clinical nutrition for conditions like diabetes, hypertension, and high cholesterol is a core part of the practice. Plans are coordinated with your physician's guidance when needed.",
    category: "Nutrition Services",
  },
  {
    question: "Do you provide guidance for children or seniors?",
    answer:
      "Yes — both child nutrition and senior nutrition are dedicated services, each tailored to the specific needs of those life stages.",
    category: "Nutrition Services",
  },
  {
    question: "How do I book a session?",
    answer:
      "Use the “Book a Session” button anywhere on the site to choose your service, preferred date and time, and session type. You'll receive a confirmation immediately after booking.",
    category: "General Questions",
  },
  {
    question: "What is your cancellation policy?",
    answer:
      "We ask for at least 24 hours' notice to reschedule or cancel a session so the time slot can be offered to another client. Reach out via WhatsApp or the Contact page and we'll take care of it.",
    category: "General Questions",
  },
];

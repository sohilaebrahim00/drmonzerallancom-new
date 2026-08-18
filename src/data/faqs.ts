export type FaqCategory =
  | "Programs"
  | "Consultations"
  | "Consultation Credits"
  | "Online Meetings"
  | "Account & Billing"
  | "Products"
  | "Nutrition Services"
  | "General Questions";

export const faqCategories: FaqCategory[] = [
  "Programs",
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
    question: "What's included in a program?",
    answer:
      "Every program is a one-time purchase that includes a set number of doctor consultation credits, access to your account and consultation history, and ongoing nutrition or treatment support. Weight Loss and Treatment programs each come in Basic, Plus, and Premium tiers that differ only in how many consultations are included — compare them on the Packages page.",
    category: "Programs",
  },
  {
    question: "Is this a subscription? Will I be billed again?",
    answer:
      "No. Every program is a single, one-time payment — there is no recurring billing, and nothing renews automatically. If you'd like more consultations later, you can purchase another program at any time.",
    category: "Programs",
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
      "Yes. Program consultations are conducted online over Google Meet, and every service can also be booked in person — choose whichever fits your schedule and comfort best.",
    category: "Consultations",
  },
  {
    question: "How do consultation credits work?",
    answer:
      "Each program includes a fixed number of consultation credits, granted once when you purchase (1, 2, or 3, depending on the tier you choose). You use one credit each time you request an online consultation from your account.",
    category: "Consultation Credits",
  },
  {
    question: "What happens if I don't use all my credits?",
    answer:
      "Your credits stay on your account — they're granted once at purchase and don't expire on a monthly cycle, since there's no recurring billing to tie them to. They are tied to your account and are non-transferable.",
    category: "Consultation Credits",
  },
  {
    question: "How do I join my online consultation?",
    answer:
      "Once a consultation request is approved, a Google Meet link is attached to that appointment in your account. You'll be able to join directly from there at your scheduled time.",
    category: "Online Meetings",
  },
  {
    question: "How do I create an account?",
    answer:
      "Creating an account happens automatically when you purchase a program. Visit the Packages page, choose a Weight Loss or Treatment program, and complete secure payment — your account activates and you'll set your password from there.",
    category: "Account & Billing",
  },
  {
    question: "Is my payment information secure?",
    answer:
      "Payments are processed through Stripe, a secure, PCI-compliant payment provider — this website will never ask you to send card details directly, and we never see or store them.",
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

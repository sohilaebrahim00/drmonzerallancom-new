import type { LucideIcon } from "lucide-react";
import { Baby, Bike, Droplets, HeartPulse, Salad, Soup, TrendingDown } from "lucide-react";

export type ArticleCategory =
  | "Weight Management"
  | "Clinical Nutrition"
  | "Sports Nutrition"
  | "Women's Health"
  | "Family Nutrition"
  | "Digestive Health"
  | "Heart Health";

export interface ArticleSection {
  heading: string;
  body: string[];
}

/** Real pixel dimensions of one file. Not derived from a constant: two of the
 *  heroes are 960x540 rather than 1400x787, because their sources were only
 *  960px wide and were deliberately not upscaled. */
export interface ArticleImageSize {
  width: number;
  height: number;
}

export interface ArticleImage {
  /**
   * Path without the `-card` / `-hero` suffix or extension, e.g.
   * "/images/blog/how-much-protein-do-you-actually-need". Both a .webp and a
   * .jpg exist for each, so these go through <Photo base=...> unchanged.
   */
  base: string;
  /**
   * REQUIRED, and that is the point: `alt` is not optional on this type, so an
   * article image without alt text cannot be constructed at all. There is no
   * "" default and no fallback to the title — it is unrepresentable rather
   * than merely discouraged.
   *
   * These are illustrations. Three of them show people who are NOT the
   * doctor's clients and not the doctor. Alt text describes what is in the
   * frame and implies nothing about anyone.
   */
  alt: string;
  card: ArticleImageSize;
  hero: ArticleImageSize;
}

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  category: ArticleCategory;
  icon: LucideIcon;
  date: string;
  updated?: string;
  sections: ArticleSection[];
  /** Absent for articles with no photograph — the card falls back to the
   *  category gradient, which is a designed state, not a hole. */
  image?: ArticleImage;
}

export const categories: ArticleCategory[] = [
  "Weight Management",
  "Clinical Nutrition",
  "Sports Nutrition",
  "Women's Health",
  "Family Nutrition",
  "Digestive Health",
  "Heart Health",
];

export const articles: Article[] = [
  {
    slug: "sustainable-weight-loss-without-crash-diets",
    image: {
      base: "/images/blog/sustainable-weight-loss-without-crash-diets",
      alt: "A woman sitting at a sunlit kitchen table, smiling as she eats a bowl of mixed salad, with a jug of water, an avocado and blueberries in front of her and a rolled exercise mat and trainers behind.",
      card: { width: 960, height: 540 },
      hero: { width: 1400, height: 787 },
    },
    title: "Sustainable Weight Loss Without Crash Diets",
    excerpt:
      "Why extreme restriction backfires, and what a realistic weight-loss plan looks like in practice.",
    category: "Weight Management",
    icon: TrendingDown,
    date: "2026-06-02",
    sections: [
      {
        heading: "Why crash diets fail",
        body: [
          "Crash diets promise fast results, but the body responds to severe restriction by slowing metabolism and increasing hunger signals. Most weight lost quickly through extreme calorie cuts returns within months, often with a little extra — a pattern known as weight cycling.",
          "The underlying issue is rarely willpower. It's that a plan asking you to eat far below your needs simply isn't something any body can sustain long-term.",
        ],
      },
      {
        heading: "What actually works",
        body: [
          "Sustainable weight loss relies on a moderate, consistent calorie deficit built from foods you'll realistically keep eating — not a 30-day menu you abandon on day 10. Protein and fiber at each meal help manage hunger, while resistance training preserves muscle as weight comes down.",
          "Progress should be tracked over weeks, not days. Body weight fluctuates daily due to water, sodium, and hormones, so trends matter far more than any single number on the scale.",
        ],
      },
      {
        heading: "Building a plan that lasts",
        body: [
          "A good plan starts with your current habits and adjusts them gradually rather than replacing them wholesale. Small, compounding changes — an extra vegetable serving, a swapped snack, a consistent sleep schedule — tend to outlast dramatic overhauls.",
          "Working with a nutrition specialist helps identify which changes will move the needle for your specific routine, rather than following generic advice that ignores your lifestyle.",
        ],
      },
    ],
  },
  {
    slug: "eating-well-with-type-2-diabetes",
    image: {
      base: "/images/blog/eating-well-with-type-2-diabetes",
      alt: "A woman in a navy training top sitting at a kitchen table with a fork over a bowl of grilled chicken, quinoa, chickpeas, broccoli and red pepper, beside yoghurt with blueberries, halved boiled eggs, almonds, a salmon fillet, a bowl of lentils and a glass of water.",
      card: { width: 960, height: 540 },
      hero: { width: 960, height: 540 },
    },
    title: "Eating Well With Type 2 Diabetes",
    excerpt:
      "A practical look at managing blood sugar through food choices, meal timing, and carbohydrate balance.",
    category: "Clinical Nutrition",
    icon: Droplets,
    date: "2026-05-18",
    sections: [
      {
        heading: "It's about balance, not elimination",
        body: [
          "Managing type 2 diabetes through nutrition doesn't mean cutting out entire food groups. It means understanding how carbohydrates affect blood sugar and pairing them thoughtfully with protein, fat, and fiber to blunt sharp spikes.",
        ],
      },
      {
        heading: "The role of the glycemic load",
        body: [
          "Not all carbohydrates behave the same way in the body. Whole, fiber-rich carbohydrates are digested more slowly and cause a gentler rise in blood sugar than refined, low-fiber options. Meal composition — not just carb count — determines how your body responds.",
          "Consistent meal timing also plays a role, helping avoid the long gaps that can lead to overeating or unstable glucose levels later in the day.",
        ],
      },
      {
        heading: "Working with your care team",
        body: [
          "Nutrition guidance for diabetes should complement, not replace, your physician's treatment plan. Regular coordination between your nutrition specialist and doctor ensures your meal plan supports your medication, activity level, and lab results as they change over time.",
        ],
      },
    ],
  },
  {
    slug: "fueling-athletic-performance-and-recovery",
    image: {
      base: "/images/blog/fueling-athletic-performance-and-recovery",
      alt: "A person in a black training vest holding a shaker bottle at a table set with a bowl of grilled chicken, quinoa, sweet potato, broccoli and avocado, beside a dumbbell, a gym bag, a rolled towel and a glass of water.",
      card: { width: 960, height: 540 },
      hero: { width: 960, height: 540 },
    },
    title: "Fueling Athletic Performance and Recovery",
    excerpt:
      "How pre- and post-workout nutrition choices affect energy, endurance, and how quickly you bounce back.",
    category: "Sports Nutrition",
    icon: Bike,
    date: "2026-04-27",
    sections: [
      {
        heading: "Before training",
        body: [
          "A pre-workout meal rich in easily digestible carbohydrates, with moderate protein and low fat, gives your body accessible fuel without weighing down digestion. Timing this 1–3 hours before activity tends to work best for most people, though this varies by individual and workout intensity.",
        ],
      },
      {
        heading: "After training",
        body: [
          "The post-workout window is when your muscles are most receptive to replenishing glycogen and repairing tissue. A combination of protein and carbohydrates within a couple of hours after activity supports faster recovery and reduces next-day soreness.",
        ],
      },
      {
        heading: "Hydration matters more than people think",
        body: [
          "Even mild dehydration can measurably reduce performance and increase perceived effort. Fluid needs vary by sweat rate, climate, and session length, which is why hydration strategy is usually personalized rather than a flat daily target.",
        ],
      },
    ],
  },
  {
    slug: "nutrition-through-every-trimester-of-pregnancy",
    image: {
      base: "/images/blog/nutrition-through-every-trimester-of-pregnancy",
      alt: "A pregnant woman standing at a kitchen counter with one hand resting on her bump and a fork over a bowl of salad, with salmon, spinach, tomatoes, sweet potato and avocado on a board beside her.",
      card: { width: 960, height: 540 },
      hero: { width: 960, height: 540 },
    },
    title: "Nutrition Through Every Trimester of Pregnancy",
    excerpt:
      "What changes nutritionally from the first trimester to the third, and the nutrients worth paying closer attention to.",
    category: "Women's Health",
    icon: Baby,
    date: "2026-03-14",
    sections: [
      {
        heading: "First trimester: building the foundation",
        body: [
          "Caloric needs barely change in the first trimester, but nutrient quality matters immensely. Folate, iron, and adequate hydration are priorities, even amid nausea that can make eating consistently difficult.",
        ],
      },
      {
        heading: "Second trimester: increasing needs",
        body: [
          "As energy needs rise, so does the importance of protein, calcium, and omega-3 fatty acids to support your baby's growth. This is often the most manageable trimester to build consistent, balanced eating habits.",
        ],
      },
      {
        heading: "Third trimester: preparing for birth",
        body: [
          "Iron and protein needs peak as your baby gains weight quickly. Smaller, more frequent meals often feel more comfortable as physical space for a full stomach decreases.",
          "Every pregnancy is different, and a personalized plan accounts for pre-existing conditions, appetite changes, and any complications along the way.",
        ],
      },
    ],
  },
  {
    slug: "understanding-food-and-digestive-comfort",
    image: {
      base: "/images/blog/understanding-food-and-digestive-comfort",
      alt: "An anatomical model of the large intestine standing on a table beside bananas, a bowl of oats, broccoli, an apple, blueberries, papaya, prunes, yoghurt, garlic and chia seeds.",
      card: { width: 960, height: 540 },
      hero: { width: 1400, height: 787 },
    },
    title: "Understanding Food and Digestive Comfort",
    excerpt:
      "How to approach bloating, discomfort, and food sensitivities without cutting out entire food groups unnecessarily.",
    category: "Digestive Health",
    icon: Soup,
    date: "2026-01-30",
    sections: [
      {
        heading: "Start with patterns, not assumptions",
        body: [
          "Digestive discomfort is often blamed on the last thing eaten, when the real trigger may be a combination of factors — meal size, stress, timing, or a specific ingredient eaten regularly. Tracking symptoms alongside meals for a couple of weeks reveals patterns that guesswork misses.",
        ],
      },
      {
        heading: "Fiber is usually part of the solution",
        body: [
          "Both too little and too much fiber, introduced too quickly, can cause discomfort. Gradually increasing fiber from varied sources — vegetables, fruit, whole grains, legumes — while maintaining good hydration tends to improve digestive comfort over time.",
        ],
      },
      {
        heading: "When elimination makes sense",
        body: [
          "Structured elimination and reintroduction, guided by a nutrition professional, can help identify true sensitivities without the risk of unnecessarily restricting your diet long-term based on assumption alone.",
        ],
      },
    ],
  },
  {
    slug: "heart-healthy-eating-for-cholesterol-and-blood-pressure",
    image: {
      base: "/images/blog/heart-healthy-eating-for-cholesterol-and-blood-pressure",
      alt: "A stethoscope coiled around a red rubber heart beside a bowl of spinach, broccoli, kidney beans, quinoa, pumpkin seeds and tomatoes, with salmon, olive oil, almonds, oats and blueberries around it.",
      card: { width: 960, height: 540 },
      hero: { width: 1400, height: 787 },
    },
    title: "Heart-Healthy Eating for Cholesterol and Blood Pressure",
    excerpt:
      "The dietary patterns most consistently linked to better cardiovascular numbers, explained simply.",
    category: "Heart Health",
    icon: HeartPulse,
    date: "2025-12-11",
    sections: [
      {
        heading: "Fats aren't all equal",
        body: [
          "Replacing saturated fats with unsaturated fats — found in olive oil, nuts, seeds, and fatty fish — is one of the most consistently supported dietary changes for improving cholesterol levels.",
        ],
      },
      {
        heading: "Sodium and blood pressure",
        body: [
          "Reducing sodium intake, largely from processed and packaged foods rather than the salt shaker at home, remains one of the most effective dietary levers for blood pressure management.",
        ],
      },
      {
        heading: "A pattern, not a single food",
        body: [
          "No single ingredient fixes cardiovascular risk. The strongest evidence points to overall dietary patterns rich in vegetables, whole grains, legumes, and healthy fats, paired with regular activity and consistent follow-up on your numbers.",
        ],
      },
    ],
  },
  {
    slug: "how-much-protein-do-you-actually-need",
    image: {
      base: "/images/blog/how-much-protein-do-you-actually-need",
      alt: "A salmon fillet, a chicken breast and a beef steak on a wooden board, surrounded by cottage cheese, a glass of milk, mixed beans, lentils, halved boiled eggs, almonds, a scoop of protein powder and dumbbells.",
      card: { width: 960, height: 540 },
      hero: { width: 1400, height: 787 },
    },
    title: "How Much Protein Do You Actually Need?",
    excerpt:
      "Cutting through the noise around protein intake, timing, and sources for different goals.",
    category: "Weight Management",
    icon: Salad,
    date: "2025-11-05",
    sections: [
      {
        heading: "It depends on your goal",
        body: [
          "Protein needs vary depending on whether the goal is weight loss, muscle gain, general maintenance, or recovery from illness. General population guidelines are a starting point, not a one-size-fits-all target.",
        ],
      },
      {
        heading: "Distribution matters",
        body: [
          "Spreading protein intake across meals — rather than concentrating it all at dinner — tends to support muscle maintenance and satiety better throughout the day.",
        ],
      },
      {
        heading: "Quality sources over supplements",
        body: [
          "Whole food protein sources bring along fiber, vitamins, and minerals that isolated supplements don't. Powders and bars can help fill genuine gaps, but they work best as a supplement to a food-first plan rather than a replacement for one.",
        ],
      },
    ],
  },
];

export function getArticleBySlug(slug: string) {
  return articles.find((article) => article.slug === slug);
}

export function estimateReadingTime(article: Article) {
  const words = article.sections.reduce(
    (count, section) =>
      count + section.heading.split(" ").length + section.body.join(" ").split(" ").length,
    0,
  );
  return Math.max(1, Math.round(words / 200));
}

export function getRelatedArticles(article: Article, limit = 3) {
  return articles
    .filter((item) => item.slug !== article.slug)
    .sort((a, b) => {
      const aScore = a.category === article.category ? 1 : 0;
      const bScore = b.category === article.category ? 1 : 0;
      return bScore - aScore;
    })
    .slice(0, limit);
}

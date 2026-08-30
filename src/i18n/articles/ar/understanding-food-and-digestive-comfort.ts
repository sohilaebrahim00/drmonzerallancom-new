import type { ArticleSection } from "@/data/articles";

/**
 * "Understanding Food and Digestive Comfort" — Arabic body.
 * FLAGGED IN FULL as a unit. Read end to end against the English.
 *
 * THE TWO-SIDED CONDITION, which a careless translation flattens:
 *   "Both too little and too much fiber, introduced too quickly, can cause
 *   discomfort."
 *   -> قلة الألياف وكثرتها معًا، وإدخالها بسرعة أكبر من اللازم، قد يسبّب
 *      انزعاجًا.
 *   Three things had to survive: BOTH directions (too little AND too much),
 *   the "introduced too quickly" qualifier, and the hedge "can". Rendering
 *   this as "زيادة الألياف تسبب انزعاجًا" would be advice the English never
 *   gave.
 *
 * THE CONDITION ON ELIMINATION, which is the safety point of the article:
 *   "Structured elimination and reintroduction, GUIDED BY A NUTRITION
 *   PROFESSIONAL, can help identify true sensitivities"
 *   -> الإقصاء المنظّم وإعادة الإدخال، بإشراف أخصائي تغذية، قد يساعد ...
 *   The supervision clause is not a stylistic aside; without it the sentence
 *   tells a reader to run elimination diets alone.
 *
 * HEDGES CARRIED ACROSS:
 *   "is often blamed on"     -> غالبًا ما يُلقى اللوم على
 *   "the real trigger may be" -> قد يكون المحفّز الحقيقي
 *   "tends to improve"        -> يميل إلى تحسين
 */
export const sections: ArticleSection[] = [
  {
    heading: "ابدأ من الأنماط، لا من الافتراضات",
    body: [
      "غالبًا ما يُلقى اللوم في الانزعاج الهضمي على آخر ما تم تناوله، بينما قد يكون المحفّز الحقيقي مزيجًا من عوامل — حجم الوجبة، أو التوتر، أو التوقيت، أو مكوّن بعينه يُؤكل بانتظام. وتتبّع الأعراض إلى جانب الوجبات لأسبوعين يكشف أنماطًا يفوتها التخمين.",
    ],
  },
  {
    heading: "الألياف عادةً جزء من الحل",
    body: [
      "قلة الألياف وكثرتها معًا، وإدخالها بسرعة أكبر من اللازم، قد يسبّب انزعاجًا. وزيادة الألياف تدريجيًا من مصادر متنوعة — الخضار والفاكهة والحبوب الكاملة والبقوليات — مع الحفاظ على ترطيب جيد، يميل إلى تحسين راحة الجهاز الهضمي مع الوقت.",
    ],
  },
  {
    heading: "متى يكون الإقصاء منطقيًا",
    body: [
      "الإقصاء المنظّم وإعادة الإدخال، بإشراف أخصائي تغذية، قد يساعد في تحديد الحساسيات الحقيقية دون المخاطرة بتقييد نظامك الغذائي على المدى الطويل دون داعٍ، بناءً على الافتراض وحده.",
    ],
  },
];

import type { ArticleSection } from "@/data/articles";

/**
 * "Nutrition Through Every Trimester of Pregnancy" — Arabic body.
 * FLAGGED IN FULL as a unit. Read end to end against the English.
 *
 * ON GENDER — a correction to an earlier claim about this file.
 *
 * This was previously described as "feminine throughout", citing طفلك, جسمك
 * and حملك. That was wrong, and the error is worth keeping written down: the
 * pronoun suffix ك is spelled identically for masculine (كَ) and feminine (كِ)
 * in unvocalised Arabic, so none of those words carries gender at all. Only
 * verb morphology does — اختاري against اختر, تحتاجين against تحتاج — and this
 * article contains none of it.
 *
 * So the text is genuinely gender-neutral as written, by accident rather than
 * by design. It reads naturally to a pregnant reader without ever inflecting
 * for her, which is a good outcome here but not a decision anyone made.
 *
 * The real question is site-wide, not article-level, and is flagged as F-8:
 * the rest of the Arabic uses 96 masculine imperatives and zero feminine ones,
 * so a female patient is addressed as male everywhere except here.
 *
 * SCOPE KEPT EXACTLY:
 *   "Caloric needs barely change in the first trimester" — "barely change",
 *   not "do not change": لا تكاد تتغيّر. The difference is the whole clause.
 *   "even amid nausea that can make eating consistently difficult" kept as a
 *   concessive, not dropped: حتى وسط الغثيان الذي قد يجعل الأكل بانتظام صعبًا.
 *
 * HEDGES CARRIED ACROSS:
 *   "is often the most manageable trimester" -> غالبًا ما تكون ... الأسهل
 *   "often feel more comfortable"            -> غالبًا ما تكون أكثر راحة
 *   "any complications along the way"        -> أي مضاعفات قد تطرأ
 */
export const sections: ArticleSection[] = [
  {
    heading: "المرحلة الأولى: بناء الأساس",
    body: [
      "لا تكاد الاحتياجات من السعرات تتغيّر في المرحلة الأولى من الحمل، لكن جودة العناصر الغذائية بالغة الأهمية. فحمض الفوليك والحديد والترطيب الكافي أولويات، حتى وسط الغثيان الذي قد يجعل الأكل بانتظام صعبًا.",
    ],
  },
  {
    heading: "المرحلة الثانية: احتياجات متزايدة",
    body: [
      "مع ارتفاع احتياجات الطاقة، ترتفع أيضًا أهمية البروتين والكالسيوم وأحماض أوميغا-3 الدهنية لدعم نمو طفلك. وغالبًا ما تكون هذه المرحلة الأسهل لبناء عادات غذائية منتظمة ومتوازنة.",
    ],
  },
  {
    heading: "المرحلة الثالثة: الاستعداد للولادة",
    body: [
      "تبلغ الاحتياجات من الحديد والبروتين ذروتها مع اكتساب طفلك للوزن بسرعة. والوجبات الأصغر والأكثر تكرارًا غالبًا ما تكون أكثر راحة مع تناقص المساحة المتاحة لمعدة ممتلئة.",
      "كل حمل مختلف، والخطة المخصصة تراعي الحالات الصحية القائمة وتغيّرات الشهية وأي مضاعفات قد تطرأ على طول الطريق.",
    ],
  },
];

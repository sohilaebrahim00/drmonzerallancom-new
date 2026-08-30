import type { ArticleSection } from "@/data/articles";

/**
 * "Nutrition Through Every Trimester of Pregnancy" — Arabic body.
 * FLAGGED IN FULL as a unit. Read end to end against the English.
 *
 * ADDRESSED TO A PREGNANT READER, so the second person is feminine throughout
 * (طفلك ... جسمك ... حملك). The English "you" is genderless and the Arabic
 * cannot be; feminine is the only reading that fits the subject. Flagged
 * because it is a choice the English did not have to make.
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

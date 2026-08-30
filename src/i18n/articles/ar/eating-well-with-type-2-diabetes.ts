import type { ArticleSection } from "@/data/articles";

/**
 * "Eating Well With Type 2 Diabetes" — Arabic body.
 * FLAGGED IN FULL as a unit. Read end to end against the English.
 *
 * THE SENTENCE THAT MATTERS MOST IN THIS ARTICLE:
 *   "Nutrition guidance for diabetes should complement, not replace, your
 *   physician's treatment plan."
 *   -> يجب أن يكون الإرشاد الغذائي للسكري مكمّلًا لخطة العلاج التي يضعها طبيبك،
 *      لا بديلًا عنها.
 *   Both halves kept. "complement, not replace" is the whole clinical point of
 *   the section and is not compressed to "works alongside".
 *
 * SCOPE KEPT EXACTLY:
 *   "doesn't mean cutting out entire food groups" — the negation governs
 *   ENTIRE food groups, not "cutting out"; rendered as لا يعني استبعاد مجموعات
 *   غذائية كاملة, which negates the same thing.
 *   "Meal composition — not just carb count — determines" keeps the "not just":
 *   تكوين الوجبة — لا عدد الكربوهيدرات وحده.
 *
 * HEDGES CARRIED ACROSS:
 *   "can lead to overeating"  -> قد تؤدي إلى الإفراط في الأكل   (not تؤدي)
 *   "also plays a role"       -> له دور أيضًا
 */
export const sections: ArticleSection[] = [
  {
    heading: "المسألة توازن، لا استبعاد",
    body: [
      "إدارة السكري من النوع الثاني عن طريق التغذية لا تعني استبعاد مجموعات غذائية كاملة. إنها تعني فهم كيفية تأثير الكربوهيدرات على سكر الدم، وإقرانها بعناية بالبروتين والدهون والألياف لتخفيف الارتفاعات الحادة.",
    ],
  },
  {
    heading: "دور الحمل الغلايسيمي",
    body: [
      "ليست كل الكربوهيدرات تتصرّف بالطريقة نفسها داخل الجسم. فالكربوهيدرات الكاملة الغنية بالألياف تُهضم ببطء أكبر وتسبب ارتفاعًا أهدأ في سكر الدم مقارنةً بالخيارات المكرّرة قليلة الألياف. وتكوين الوجبة — لا عدد الكربوهيدرات وحده — هو ما يحدّد استجابة جسمك.",
      "ولانتظام أوقات الوجبات دور أيضًا، إذ يساعد على تجنّب الفجوات الطويلة التي قد تؤدي إلى الإفراط في الأكل أو إلى تذبذب مستويات الغلوكوز لاحقًا في اليوم.",
    ],
  },
  {
    heading: "العمل مع فريقك الطبي",
    body: [
      "يجب أن يكون الإرشاد الغذائي للسكري مكمّلًا لخطة العلاج التي يضعها طبيبك، لا بديلًا عنها. والتنسيق المنتظم بين أخصائي التغذية والطبيب يضمن أن تدعم خطتك الغذائية دواءك ومستوى نشاطك ونتائج تحاليلك مع تغيّرها بمرور الوقت.",
    ],
  },
];

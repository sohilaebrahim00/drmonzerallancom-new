import type { ArticleSection } from "@/data/articles";

/**
 * "Heart-Healthy Eating for Cholesterol and Blood Pressure" — Arabic body.
 * FLAGGED IN FULL as a unit. Read end to end against the English.
 *
 * EVIDENCE LANGUAGE, which is where this article is easiest to overstate:
 *   "one of the most consistently supported dietary changes"
 *     -> من أكثر التغييرات الغذائية دعمًا باطّراد في الأدلة
 *     NOT "the best change" and not "proven to".
 *   "remains one of the most effective dietary levers"
 *     -> يظل من أكثر الأدوات الغذائية فاعلية
 *     "one of" kept; "remains" kept.
 *   "The strongest evidence points to"
 *     -> تشير أقوى الأدلة إلى
 *     Points to, not establishes.
 *   "No single ingredient fixes cardiovascular risk"
 *     -> لا يوجد مكوّن واحد يُصلح خطر أمراض القلب والأوعية
 *
 * SCOPE KEPT EXACTLY:
 *   "largely from processed and packaged foods rather than the salt shaker at
 *   home" — this contrast is the practical instruction of the section and is
 *   kept whole: الذي يأتي في معظمه من الأطعمة المصنّعة والمعلّبة أكثر مما يأتي
 *   من ملّاحة الطعام في المنزل.
 */
export const sections: ArticleSection[] = [
  {
    heading: "ليست كل الدهون سواء",
    body: [
      "استبدال الدهون المشبعة بدهون غير مشبعة — الموجودة في زيت الزيتون والمكسّرات والبذور والأسماك الدهنية — هو من أكثر التغييرات الغذائية دعمًا باطّراد في الأدلة لتحسين مستويات الكوليسترول.",
    ],
  },
  {
    heading: "الصوديوم وضغط الدم",
    body: [
      "خفض تناول الصوديوم، الذي يأتي في معظمه من الأطعمة المصنّعة والمعلّبة أكثر مما يأتي من ملّاحة الطعام في المنزل، يظل من أكثر الأدوات الغذائية فاعلية في إدارة ضغط الدم.",
    ],
  },
  {
    heading: "نمط كامل، لا طعام واحد",
    body: [
      "لا يوجد مكوّن واحد يُصلح خطر أمراض القلب والأوعية. وتشير أقوى الأدلة إلى الأنماط الغذائية العامة الغنية بالخضار والحبوب الكاملة والبقوليات والدهون الصحية، مقترنةً بنشاط بدني منتظم ومتابعة مستمرة لمؤشراتك.",
    ],
  },
];

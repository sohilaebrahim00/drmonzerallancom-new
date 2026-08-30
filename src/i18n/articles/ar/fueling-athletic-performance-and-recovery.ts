import type { ArticleSection } from "@/data/articles";

/**
 * "Fueling Athletic Performance and Recovery" — Arabic body.
 * FLAGGED IN FULL as a unit. Read end to end against the English.
 *
 * TRANSCRIBED, NOT RE-EXPRESSED:
 *   "1–3 hours before activity" -> 1–3 ساعات قبل النشاط
 *   Latin digits and the EN DASH kept exactly. Not converted to minutes, not
 *   rounded, not turned into "a couple of hours".
 *   "within a couple of hours" stays a hedge, not a figure: خلال ساعتين تقريبًا.
 *
 * THE CONDITIONAL THAT MUST NOT BE DROPPED:
 *   "Timing this 1–3 hours before activity tends to work best for most people,
 *   though this varies by individual and workout intensity."
 *   Three separate qualifiers — "tends to", "for most people", "varies by
 *   individual and workout intensity" — all present in the Arabic. Dropping
 *   any one of them turns a general tendency into an instruction.
 *
 * HEDGES CARRIED ACROSS:
 *   "Even mild dehydration can measurably reduce"
 *                     -> حتى الجفاف الخفيف يمكن أن يقلّل بشكل ملموس
 *   "is usually personalized" -> عادةً ما تكون مخصّصة
 */
export const sections: ArticleSection[] = [
  {
    heading: "قبل التمرين",
    body: [
      "الوجبة السابقة للتمرين، الغنية بالكربوهيدرات سهلة الهضم مع بروتين معتدل ودهون قليلة، تمنح جسمك وقودًا متاحًا دون أن تُثقل الهضم. وتوقيتها قبل النشاط بـ 1–3 ساعات يميل إلى أن يكون الأنسب لمعظم الناس، وإن كان هذا يختلف من شخص لآخر وبحسب شدّة التمرين.",
    ],
  },
  {
    heading: "بعد التمرين",
    body: [
      "الفترة التي تلي التمرين هي الوقت الذي تكون فيه عضلاتك أكثر تقبّلًا لتعويض الغلايكوجين وإصلاح الأنسجة. وتناول مزيج من البروتين والكربوهيدرات خلال ساعتين تقريبًا بعد النشاط يدعم تعافيًا أسرع ويقلّل من ألم اليوم التالي.",
    ],
  },
  {
    heading: "الترطيب أهم مما يظن الناس",
    body: [
      "حتى الجفاف الخفيف يمكن أن يقلّل الأداء بشكل ملموس ويزيد الإحساس بالجهد المبذول. واحتياجات السوائل تختلف بحسب معدّل التعرّق والمناخ وطول الجلسة، ولهذا عادةً ما تكون استراتيجية الترطيب مخصّصة لكل شخص بدلًا من أن تكون هدفًا يوميًا ثابتًا.",
    ],
  },
];

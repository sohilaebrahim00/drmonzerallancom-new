import type { ArticleSection } from "@/data/articles";

/**
 * "How Much Protein Do You Actually Need?" — Arabic body.
 *
 * FLAGGED IN FULL, as a unit, in the translation review document. Read it end
 * to end against the English rather than line by line.
 *
 * Hedges carried across without strengthening, because every one of them is
 * doing work:
 *   "vary depending on whether"  -> تختلف تبعًا لما إذا كان
 *   "a starting point, not a one-size-fits-all target"
 *                                -> نقطة بداية، وليست هدفًا واحدًا يصلح للجميع
 *   "tends to support ... better" -> يميل إلى دعم ... بشكل أفضل   (not يدعم)
 *   "can help fill genuine gaps" -> قد تساعد في سدّ نقص حقيقي     (not تسدّ)
 *   "work best as a supplement ... rather than a replacement"
 *                                -> تعمل على أفضل وجه كمكمّل ... لا كبديل
 */
export const sections: ArticleSection[] = [
  {
    heading: "الأمر يعتمد على هدفك",
    body: [
      "تختلف احتياجات البروتين تبعًا لما إذا كان الهدف إنقاص الوزن أو بناء العضلات أو الحفاظ على الوضع العام أو التعافي من المرض. والإرشادات العامة الموجّهة لعموم الناس هي نقطة بداية، وليست هدفًا واحدًا يصلح للجميع.",
    ],
  },
  {
    heading: "التوزيع مهم",
    body: [
      "توزيع البروتين على مدار الوجبات — بدلًا من تركيزه كله في وجبة العشاء — يميل إلى دعم الحفاظ على العضلات والشعور بالشبع بشكل أفضل على مدار اليوم.",
    ],
  },
  {
    heading: "المصادر الجيدة تسبق المكمّلات",
    body: [
      "مصادر البروتين من الغذاء الكامل تجلب معها الألياف والفيتامينات والمعادن التي لا توفّرها المكمّلات المعزولة. والمساحيق والألواح قد تساعد في سدّ نقص حقيقي، لكنها تعمل على أفضل وجه كمكمّل لخطة تقوم على الغذاء أولًا، لا كبديل عنها.",
    ],
  },
];

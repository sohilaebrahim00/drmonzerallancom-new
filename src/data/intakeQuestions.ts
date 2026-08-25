// The doctor's own eight pre-consultation questions, approved by him.
//
// Do not add, reword or drop a question. The Arabic beside each one is his
// original wording, kept here so the Phase 5 translation pass has the source
// rather than a back-translation of the English.
//
// Q4 is the ONLY item narrowed from his original: his Q3 and Q4 both asked
// about blood tests, so Q4 is scoped to vitamin and mineral levels
// specifically and a patient is not asked the same thing twice. That change
// was flagged to him. Nothing else is narrowed.

export interface IntakeQuestion {
  /** 1-8, and the suffix of the matching consultation_intake column. */
  number: number;
  /** The column in public.consultation_intake holding the verbatim answer. */
  column: IntakeAnswerColumn;
  /** Short label for the doctor's view and the patient's review screen. */
  label: string;
  /** Exactly what the assistant asks. */
  prompt: string;
  /** The doctor's original Arabic. Not shown until Phase 5. */
  promptAr: string;
}

export type IntakeAnswerColumn =
  | "q1_reason"
  | "q2_symptoms"
  | "q3_tests_and_medications"
  | "q4_vitamin_mineral_levels"
  | "q5_daily_eating"
  | "q6_stress"
  | "q7_activity"
  | "q8_sleep";

export const INTAKE_QUESTIONS: IntakeQuestion[] = [
  {
    number: 1,
    column: "q1_reason",
    label: "Reason for the consultation",
    prompt:
      "What brings you to this consultation? Tell me the condition or the main problem you want to work on.",
    promptAr:
      "ما الذي دفعك لطلب الاستشارة اليوم؟ اذكر الحالة الصحية أو المشكلة الأساسية التي تود معالجتها.",
  },
  {
    number: 2,
    column: "q2_symptoms",
    label: "Current symptoms",
    prompt:
      "What symptoms are you having at the moment? Include everything, even things that seem minor.",
    promptAr: "ما الأعراض التي تعاني منها حاليًا؟ اذكر كل التفاصيل حتى البسيطة منها.",
  },
  {
    number: 3,
    column: "q3_tests_and_medications",
    label: "Recent tests, medicines and supplements",
    prompt:
      "Have you had any blood tests or medical investigations recently? If so, what did they show? Also list every medicine, vitamin and supplement you take.",
    promptAr:
      "هل أجريت أي تحاليل دم أو فحوصات طبية مؤخرًا؟ … واذكر جميع الأدوية أو الفيتامينات أو المكملات التي تتناولها.",
  },
  {
    number: 4,
    column: "q4_vitamin_mineral_levels",
    label: "Vitamin and mineral levels",
    prompt:
      "Have you ever had your vitamin and mineral levels checked — vitamin D, B12, iron, or similar? If you have, what were the results? If you haven't, just say so.",
    promptAr:
      "هل أجريت أي تقييم للتغذية أو الفيتامينات والمعادن بما في ذلك تحاليل دم؟ … وإن لم تفعل ذلك فوضّح هذا الشيء أيضًا.",
  },
  {
    number: 5,
    column: "q5_daily_eating",
    label: "A normal day of eating",
    prompt:
      "What does a normal day of eating look like for you? Breakfast, lunch, dinner and snacks — and roughly what time you have each.",
    promptAr: "كيف تبدو عاداتك الغذائية اليومية؟ … مع ذكر أوقاتها.",
  },
  {
    number: 6,
    column: "q6_stress",
    label: "Stress level",
    prompt:
      "On a scale of 1 to 10, how would you rate your stress right now? And what are the main things causing it?",
    promptAr:
      "كيف تقيّم مستوى التوتر لديك حاليًا على مقياس من ١ إلى ١٠؟ وما هي أهم مصادر هذا التوتر؟",
  },
  {
    number: 7,
    column: "q7_activity",
    label: "Physical activity",
    prompt: "How physically active are you? What kind of exercise, and how many times a week?",
    promptAr: "ما مدى ممارستك للنشاط البدني؟ وما أنواع التمارين التي تمارسها وكم مرة في الأسبوع؟",
  },
  {
    number: 8,
    column: "q8_sleep",
    label: "Sleep",
    prompt: "How do you normally sleep? Roughly how many hours, and how well?",
    promptAr: "كيف تصف نمط نومك المعتاد؟ اذكر عدد ساعات النوم وجودتها.",
  },
];

export const INTAKE_QUESTION_COUNT = INTAKE_QUESTIONS.length;

/** 9 means every question has been put to the patient. */
export const INTAKE_COMPLETE_MARKER = INTAKE_QUESTION_COUNT + 1;

export function intakeQuestionByNumber(n: number): IntakeQuestion | undefined {
  return INTAKE_QUESTIONS.find((q) => q.number === n);
}

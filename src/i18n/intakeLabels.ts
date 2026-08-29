import type { SimpleTranslationKey } from "./dictionaries/en";

/**
 * Display labels for the eight intake questions, by question number.
 *
 * THE QUESTION TEXT ITSELF IS NOT HERE, AND MUST NOT BE. `promptAr` in
 * src/data/intakeQuestions.ts is the doctor's OWN Arabic wording, recorded so
 * that this pass had his source rather than a back-translation of the English.
 * His words win; we render them. Only these short labels — our UI furniture on
 * the review screen — are translated here.
 */
export const INTAKE_LABEL_KEYS: Record<number, SimpleTranslationKey> = {
  1: "intake.label1",
  2: "intake.label2",
  3: "intake.label3",
  4: "intake.label4",
  5: "intake.label5",
  6: "intake.label6",
  7: "intake.label7",
  8: "intake.label8",
};

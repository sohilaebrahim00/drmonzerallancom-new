/**
 * Asserts that an Arabic visitor can actually reach the knowledge base.
 *
 * ── WHY THIS EXISTS ────────────────────────────────────────────────────────
 * normalize() in knowledge-retrieval.ts was
 * `text.toLowerCase().replace(/[^a-z0-9\s]/g, " ")`. Every non-ASCII character
 * became a space, so an Arabic question reduced to the empty string, produced
 * no scoring words, matched none of the 90 knowledge items, and the assistant
 * answered from nothing at all. Not a worse answer — an UNGROUNDED one, every
 * time, for every Arabic visitor, on a health product published under a
 * doctor's name.
 *
 * Every gate was green throughout. tsc, deno check, lint, both builds, the
 * CORS check, the knowledge check and the i18n audit all passed, because not
 * one of them asked whether retrieval returns anything. The i18n audit proves
 * the Arabic INTERFACE renders; nothing proved the Arabic ANSWERS are grounded.
 *
 * A GREEN METRIC MUST MEASURE THE OUTCOME, NOT THE ARTEFACT. So this measures
 * the outcome: real queries through the real retriever, asserting on the items
 * that come back.
 *
 * Run: npm run check:retrieval   (also inside `npm run gate`)
 */
import {
  retrieveContext,
  normalize,
  words,
} from "../supabase/functions/_shared/knowledge-retrieval.ts";

/** Returned regardless of score, so never evidence that a query matched. */
const BASELINE = new Set(["doctor-profile", "site-navigation"]);

function matched(query: string): string[] {
  return retrieveContext(query)
    .map((i) => i.id)
    .filter((id) => !BASELINE.has(id));
}

interface Case {
  label: string;
  query: string;
  /** At least one of these ids must come back. */
  expectAny: string[];
}

const CASES: Case[] = [
  {
    label: "AR price question reaches the priced package",
    query: "كم تكلفة برنامج العلاج بريميوم؟",
    expectAny: ["package-treatment_premium", "package-comparison"],
  },
  {
    label: "AR discount question reaches a package (which carries the previous price)",
    query: "هل يوجد خصم على البرنامج العلاجي بلَس؟",
    expectAny: ["package-treatment_plus", "package-comparison"],
  },
  {
    label: "AR subscription question reaches the explicit denial",
    query: "هل يوجد اشتراك شهري؟",
    expectAny: ["no-subscription"],
  },
  {
    label: "AR with harakat and hamza forms still matches (بِكَم أسْعار البُرنامج)",
    query: "بِكَم أسْعار البُرنامج العِلاجي؟",
    expectAny: ["package-treatment_basic", "package-treatment_plus", "package-treatment_premium", "package-comparison"],
  },
  {
    label: "AR consultation question reaches the credits item",
    query: "كيف أحجز استشارة مع الطبيب؟",
    expectAny: ["consultation-credits", "consultation-availability"],
  },
  // English regression guard. The Arabic fix must not move English retrieval;
  // these are the exact queries used in the before/after comparison.
  {
    label: "EN price question unchanged",
    query: "How much does Treatment Plus cost?",
    expectAny: ["package-treatment_plus"],
  },
  {
    label: "EN subscription question unchanged",
    query: "Do you have a monthly membership?",
    expectAny: ["no-subscription"],
  },
];

let failed = 0;

for (const c of CASES) {
  const got = matched(c.query);
  const ok = c.expectAny.some((id) => got.includes(id));
  if (!ok) failed++;
  console.log(`  ${ok ? "ok  " : "FAIL"} ${c.label}`);
  if (!ok) {
    console.log(`       query    : ${c.query}`);
    console.log(`       expected : one of ${c.expectAny.join(", ")}`);
    console.log(`       got      : ${got.length ? got.join(", ") : "(nothing matched)"}`);
  }
}

/**
 * The defect in its most general form, stated so it cannot come back through a
 * different door: a non-empty question in a supported language must produce at
 * least one word the scorer can use. This is the assertion that would have
 * failed on the day normalize() was written.
 */
const SCRIPT_SAMPLES: Array<[string, string]> = [
  ["Arabic", "ما هي البرامج المتاحة؟"],
  ["Arabic (digits)", "هل السعر ١٩٩ دولار؟"],
  ["English", "What programs do you offer?"],
];
for (const [script, sample] of SCRIPT_SAMPLES) {
  const w = words(sample);
  const ok = w.length > 0;
  if (!ok) failed++;
  console.log(`  ${ok ? "ok  " : "FAIL"} ${script} query produces scoring words (${w.length})`);
  if (!ok) console.log(`       ${JSON.stringify(sample)} normalized to ${JSON.stringify(normalize(sample))}`);
}

// Arabic-Indic digits must arrive as ASCII, because every price and count in
// the knowledge base is stored in ASCII.
const digits = normalize("١٩٩");
if (digits.trim() !== "199") {
  failed++;
  console.log(`  FAIL Arabic-Indic digits fold to ASCII — got ${JSON.stringify(digits)}, expected "199"`);
} else {
  console.log("  ok   Arabic-Indic digits fold to ASCII");
}

if (failed) {
  console.error(`\ncheck:retrieval — ${failed} failure(s). Arabic visitors would get ungrounded answers.`);
  Deno.exit(1);
}
console.log(`\ncheck:retrieval — ${CASES.length + SCRIPT_SAMPLES.length + 1} assertions, Arabic and English both reach the knowledge base.`);

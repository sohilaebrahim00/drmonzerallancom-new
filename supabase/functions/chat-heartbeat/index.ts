// Chat heartbeat — the smallest check that would have caught the outage.
//
// On 30 August 2026 the assistant was broken for days. It produced a correct
// log line on every single request and nobody saw it, because nothing reads the
// logs and the browser was told everything was fine. The 502 fixed the second
// half of that. This is the first half: something that looks.
//
// FOUR ASSERTIONS:
//   1. HTTP 200 — it was returning 200 by accident during the outage; now a
//      real failure is a 502, so this assertion finally means something.
//   2. The answer is not the "temporarily unavailable" fallback.
//   3. The answer uses the vocabulary of the real catalogue, so we know it
//      reached the knowledge base and did not just improvise.
//   4. An Arabic question comes back in Arabic script — the bug we fixed the
//      same day, and one an English-only probe could never have seen.
//
// NOT A MONITORING STACK. Four comparisons, no new service, no dashboard.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
// The catalogue vocabulary comes from THE SAME FILE THE APP RENDERS FROM.
//
// The first draft hardcoded "Treatment Basic". Three packages were retired this
// month; the next catalogue change would have failed the heartbeat while
// nothing was wrong, and a check that breaks when the product legitimately
// changes is a check people mute.
import { programPackages } from "../../../src/data/programPackages.ts";

const ANON = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const BASE = Deno.env.get("SUPABASE_URL") ?? "";

/**
 * Who hears about a failure.
 *
 * DELIBERATELY NOT DEFAULTED TO ADMIN_NOTIFICATION_EMAIL. That address is the
 * doctor, and he cannot fix a hung model — an alert he cannot act on is noise
 * that teaches him to ignore the channel. Until this secret is set by someone
 * who has decided who is on call, the heartbeat still RUNS and still FAILS
 * loudly in the logs and in its own status code; it just does not email.
 */
const ALERT_EMAIL = Deno.env.get("HEARTBEAT_ALERT_EMAIL") ?? "";

const FALLBACK_MARKER = "temporarily unavailable";
const ARABIC = /[؀-ۿ]/;

/**
 * Every word the catalogue actually uses, derived from the package names.
 *
 * "Diet Plus" yields both "Diet" (the family) and "Plus" (the tier). Both
 * matter, because a correct answer may name either — the live assistant
 * summarises six packages as "available in Basic, Plus, and Premium tiers"
 * rather than listing all six by full name, which is a good answer that an
 * exact-name match called a failure. See the self-test case below.
 */
export function catalogueVocabulary(
  packages: ReadonlyArray<{ name: string }> = programPackages,
): string[] {
  const words = new Set<string>();
  for (const p of packages) {
    for (const w of String(p.name ?? "").split(/\s+/)) {
      if (w.length > 2) words.add(w.toLowerCase());
    }
  }
  return [...words];
}

/**
 * TWO distinct catalogue words, not one.
 *
 * One is too weak — "basic" alone appears in ordinary prose. Two ("Basic" and
 * "Premium", or "Diet" and "Plus") is vocabulary no generic nutrition answer
 * produces by accident, and it survives any single package being renamed.
 */
export function mentionsCatalogue(answer: string, vocab: string[]): string[] {
  const lower = answer.toLowerCase();
  return vocab.filter((w) => new RegExp(`\\b${w}\\b`).test(lower));
}

interface Check {
  name: string;
  ok: boolean;
  detail: string;
}

async function askChat(message: string): Promise<{ status: number; answer: string }> {
  const res = await fetch(`${BASE}/functions/v1/ai-chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ANON}`,
      apikey: ANON,
    },
    body: JSON.stringify({ message, currentPath: "/", history: [], platform: "web" }),
    signal: AbortSignal.timeout(45_000),
  });
  let answer = "";
  try {
    const body = await res.json();
    answer = typeof body?.answer === "string" ? body.answer : "";
  } catch {
    /* leave empty — an unparseable body fails assertion 2 below */
  }
  return { status: res.status, answer };
}

async function runChecks(): Promise<Check[]> {
  const checks: Check[] = [];
  const vocab = catalogueVocabulary();

  const en = await askChat("What programs do you offer?");
  checks.push({ name: "http-200-english", ok: en.status === 200, detail: `status ${en.status}` });
  checks.push({
    name: "not-fallback",
    ok: !!en.answer && !en.answer.includes(FALLBACK_MARKER),
    detail: en.answer ? en.answer.slice(0, 80) : "(empty answer)",
  });

  const hits = mentionsCatalogue(en.answer, vocab);
  checks.push({
    name: "uses-catalogue-vocabulary",
    ok: hits.length >= 2,
    detail: hits.length
      ? `matched ${hits.join(", ")}`
      : `answer used none of: ${vocab.join(", ")}`,
  });

  const ar = await askChat("أريد إنقاص وزني. كيف يمكنكم مساعدتي؟");
  checks.push({
    name: "arabic-answered-in-arabic",
    ok: ar.status === 200 && ARABIC.test(ar.answer) && !ar.answer.includes(FALLBACK_MARKER),
    detail: ar.answer ? ar.answer.slice(0, 80) : `(status ${ar.status}, empty)`,
  });

  return checks;
}

/**
 * SELF-TEST — standing rule: every gate defect found in the wild becomes a
 * self-test case. Runs with no network, so `?selftest=1` is safe any time.
 *
 * Case 1 is the real answer this heartbeat wrongly failed on its first live
 * run. It is here so nobody re-tightens the assertion back into a false alarm.
 */
function selfTest(): { pass: boolean; results: string[] } {
  const vocab = catalogueVocabulary([
    { name: "Diet Basic" }, { name: "Diet Plus" }, { name: "Diet Premium" },
    { name: "Treatment Basic" }, { name: "Treatment Plus" }, { name: "Treatment Premium" },
  ]);
  const cases: Array<{ label: string; text: string; want: boolean }> = [
    {
      label: "MUST PASS  real answer summarising by tier (the first-run false positive)",
      text: "These programs are available in Basic, Plus, and Premium tiers, which differ based on the number of consultation credits included.",
      want: true,
    },
    { label: "MUST PASS  answer naming a full package", text: "The Treatment Plus program includes four credits.", want: true },
    { label: "MUST FAIL  generic nutrition advice, no catalogue vocabulary", text: "Eating a balanced diet and exercising regularly is the best approach for sustainable weight loss.", want: false },
    { label: "MUST FAIL  one word only is not enough signal", text: "We offer a basic approach to nutrition.", want: false },
    { label: "MUST FAIL  empty answer", text: "", want: false },
  ];
  const results: string[] = [];
  let pass = true;
  for (const c of cases) {
    const got = mentionsCatalogue(c.text, vocab).length >= 2;
    const ok = got === c.want;
    if (!ok) pass = false;
    results.push(`${ok ? "ok  " : "FAIL"} ${c.label}`);
  }
  // Assertion 4's own logic, so the Arabic check cannot silently invert.
  for (const [label, text, want] of [
    ["MUST PASS  Arabic script detected", "أهلاً بك. يسعدني مساعدتك", true],
    ["MUST FAIL  English reply to an Arabic question", "Hello, I would be happy to help you.", false],
  ] as Array<[string, string, boolean]>) {
    const ok = ARABIC.test(text) === want;
    if (!ok) pass = false;
    results.push(`${ok ? "ok  " : "FAIL"} ${label}`);
  }
  return { pass, results };
}

serve(async (req: Request) => {
  const cors = corsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  if (new URL(req.url).searchParams.get("selftest") === "1") {
    const st = selfTest();
    return new Response(JSON.stringify(st, null, 2), {
      status: st.pass ? 200 : 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  // The self-test gates the real run: if the assertions themselves are broken,
  // the heartbeat must not report health either way.
  const st = selfTest();
  if (!st.pass) {
    console.error(`[chat-heartbeat] SELF-TEST FAILED — assertions are unreliable:\n${st.results.join("\n")}`);
    return new Response(JSON.stringify({ healthy: null, selfTest: st }, null, 2), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  // Two rounds, not one. A single cold start should never page anyone; two
  // consecutive failures means it is really down. Done inside one invocation
  // so this needs no state table and no migration.
  let checks = await runChecks();
  let failed = checks.filter((c) => !c.ok);
  if (failed.length) {
    await new Promise((r) => setTimeout(r, 20_000));
    checks = await runChecks();
    failed = checks.filter((c) => !c.ok);
  }

  const healthy = failed.length === 0;

  if (!healthy) {
    console.error(
      `[chat-heartbeat] FAILING: ${failed.map((f) => `${f.name} (${f.detail})`).join(" | ")}`,
    );
    if (ALERT_EMAIL) {
      const { sendEmail } = await import("../_shared/email.ts");
      await sendEmail(
        ALERT_EMAIL,
        "Monzer Allan — the site assistant is not answering",
        `<p>The chat heartbeat failed twice in a row, twenty seconds apart.</p><ul>${failed
          .map((f) => `<li><b>${f.name}</b> — ${f.detail}</li>`)
          .join("")}</ul>`,
      ).catch((e: unknown) => console.error("[chat-heartbeat] alert email failed:", e));
    } else {
      console.error(
        "[chat-heartbeat] HEARTBEAT_ALERT_EMAIL is not set — nobody was emailed. Set it to whoever can act on this.",
      );
    }
  }

  return new Response(JSON.stringify({ healthy, checks }, null, 2), {
    // A failing heartbeat returns a failing status, so anything watching the
    // endpoint sees it without parsing the body.
    status: healthy ? 200 : 503,
    headers: { ...cors, "Content-Type": "application/json" },
  });
});

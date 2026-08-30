/**
 * i18n audit — the reachable-English gate.
 *
 * WHY THIS EXISTS, and why key parity is not enough:
 *
 *   The translation review reports "0 missing Arabic" by comparing the two
 *   dictionaries. That measures the DICTIONARY. It went on reporting zero for
 *   weeks while the site header rendered "Book a Session" in Arabic mode,
 *   because `cta.bookSession` existed in both dictionaries and the component
 *   never asked for it — BookingButton held the English in a default prop.
 *
 *   A GREEN METRIC MUST MEASURE THE OUTCOME, NOT THE ARTEFACT. This script
 *   measures the outcome: it loads every in-scope route in Arabic, reads what
 *   a reader would actually see, and fails on English prose. Key parity stays
 *   as a check. It is no longer THE check.
 *
 * Usage:
 *   npm run i18n:audit            build must already exist in dist/
 *   npm run i18n:audit -- --list  print every finding, not just the summary
 *
 * Exit code is non-zero on any finding that is not in ACCEPTED below, so this
 * can sit in CI beside tsc / lint / build:web / build:app.
 */
import os from "node:os";
import { readFileSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

import { parseDict, dictValues } from "./lib/parse-dict.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const PORT = 4193;
const HOST = "127.0.0.1";
const VERBOSE = process.argv.includes("--list");
/** Fewest visible text nodes a real page can plausibly have. */
const MIN_LEAVES = 25;

/* ---------------------------------------------------------------- routes -- */

/**
 * Every route a public Arabic reader can reach.
 *
 * DELIBERATELY EXCLUDED, each for a stated reason. Adding a route to the site
 * without adding it here is the one way this gate can still miss something,
 * so the exclusions are named rather than implied:
 *
 *   /doctor/*, /admin/*   staff-only, explicitly out of scope
 *   /account*, /my-program, /login, /join, /booking*, /membership*,
 *   /forgot-password, /reset-password
 *                         signed-in or transactional surfaces, out of scope
 *                         for this phase and not reachable without an account
 *   /terms, /privacy-policy, /medical-disclaimer
 *                         legal pages are English BY DECISION and carry an
 *                         Arabic authoritative notice; asserted separately
 *                         by assertLegalNotice() below rather than skipped
 */
const ROUTES = [
  "/",
  "/about",
  "/packages",
  "/products",
  "/products/resveratrol",
  "/products/blood-glucose-meter-kit",
  "/products/digital-blood-pressure-monitor",
  "/faq",
  "/gallery",
  "/videos",
  "/blog",
  "/education",
  "/contact",
  // Every article, so translated bodies are gated too. An article body left in
  // English on purpose belongs in ACCEPTED with its reason, not omitted from
  // this list — the difference between "decided" and "forgotten" has to stay
  // visible.
  "/blog/sustainable-weight-loss-without-crash-diets",
  "/blog/eating-well-with-type-2-diabetes",
  "/blog/fueling-athletic-performance-and-recovery",
  "/blog/nutrition-through-every-trimester-of-pregnancy",
  "/blog/understanding-food-and-digestive-comfort",
  "/blog/heart-healthy-eating-for-cholesterol-and-blood-pressure",
  "/blog/how-much-protein-do-you-actually-need",
];

const LEGAL_ROUTES = ["/terms", "/privacy-policy", "/medical-disclaimer"];

/* ------------------------------------------------------------ allow-list -- */

/**
 * Latin fragments that are CORRECT to see in Arabic mode. Each is a decision
 * already taken and recorded elsewhere, not a translation we skipped.
 */
const ALLOW_TOKEN = [
  // Scientific and brand tokens — a buyer matches these against the bottle.
  // See the note in src/i18n/productLabels.ts.
  /^(EPA|DHA|TUDCA|CoQ10|LJ100|MK-7|ComfortFit|Wi-Fi|BMI|IU|mcg|mg|µL|EN|ISO|CoQ)$/i,
  /^(Silymarin|Omega|Candida|Kandida|Resveratrol|Spirulina|Glutathione)$/i,
  // Vitamin letters and similar single tokens: A, D, E, K2, D3, B12.
  /^[A-Z]\d{0,2}$/,
  // Proper nouns and third-party product names.
  /^(Monzer|Allan|WhatsApp|YouTube|Instagram|Facebook|TikTok|Google|Meet|Stripe|Visa|Mastercard)$/i,
  // Anything beginning with a digit is a transcribed quantity.
  /^\d/,
];

/**
 * Whole strings that are accepted as-is. Anything here is a decision with a
 * reason attached; the reason is the point of the entry.
 */
const ACCEPTED = [
  {
    // The doctor's credential is kept in English inside bidi isolates on
    // purpose — it is a regulated professional title, flagged for review.
    match: (s) => /Nutrition Specialist & Pharmacist/i.test(s),
    why: "credential kept in English by decision (CREDENTIAL_LABELS, flagged)",
  },
];

/* ------------------------------------------------- English dictionary set -- */

const en = parseDict(readFileSync(resolve(root, "src/i18n/dictionaries/en.ts"), "utf8"));
const ar = parseDict(readFileSync(resolve(root, "src/i18n/dictionaries/ar.ts"), "utf8"));

/**
 * English values whose Arabic is DIFFERENT. A key whose Arabic is deliberately
 * identical to its English — "TUDCA", "CoQ10", "Wi-Fi Sync" — is not evidence
 * of an unwired component, so including it would make the gate cry wolf on the
 * exact decisions we recorded on purpose.
 */
const enValues = new Set(
  [...dictValues(en)].filter((v) => {
    for (const [k, ev] of Object.entries(en)) {
      if (typeof ev === "string" && ev.trim() === v) {
        const av = ar[k];
        if (typeof av === "string" && av.trim() === v) return false;
      }
    }
    return true;
  }),
);

/* ------------------------------------------------------------ classifier -- */

const stripIsolates = (s) => s.replace(/[⁦-⁩‎‏]/g, "");

function classify(text) {
  const s = stripIsolates(text).trim();
  if (!s) return null;
  if (ACCEPTED.some((a) => a.match(s))) return null;

  // (a) the string IS an English dictionary value -> definitely untranslated
  if (enValues.has(s)) return "english-dictionary-value";

  // (b) Latin-script prose: two or more adjacent non-allowed Latin words
  //
  // Digits belong INSIDE a token, not between them: without them "LJ100"
  // splits into "LJ" and "MK-7" into "MK", neither of which matches the
  // allow-list entry for the whole code, and both then read as untranslated
  // English sitting in the middle of an Arabic sentence.
  const words = s.match(/[A-Za-z][A-Za-z0-9'’-]*/g) || [];
  const suspects = words.filter((w) => !ALLOW_TOKEN.some((rx) => rx.test(w)));
  if (!suspects.length) return null;

  /*
   * EVERY TOKEN IS JUDGED ON ITS OWN. The count below picks the LABEL only —
   * it never decides whether to report.
   *
   * This used to be a length threshold on the single-offender case, and that
   * was the bug, not the number. "By Monzer Allan" rendered untranslated on
   * every article page while this returned clean: "Monzer" and "Allan" are
   * allow-listed proper nouns, so filtering them left ONE survivor, which
   * demoted the string from the unconditional multi-word branch into a branch
   * gated on word length — where "By", at two characters, was dropped.
   *
   * Lowering the threshold from 4 to 2 did not fix that. It moved it. The same
   * masking still waited behind every allow-listed name with a short English
   * neighbour — in, at, to, of, on, by, no, vs, or — and behind any
   * single-character survivor at all.
   *
   * So there is no length heuristic any more. A Latin token that is not on the
   * allow-list is reported, however short it is and however many allow-listed
   * words stand next to it. Short tokens that are legitimately Latin — unit
   * abbreviations, vitamin letters, standards bodies — belong in ALLOW_TOKEN
   * with a reason attached, where the decision is visible and reviewable,
   * rather than hidden inside a number.
   */
  return suspects.length >= 2 ? "latin-prose" : "latin-word";
  return null;
}

/* --------------------------------------------------------------- crawler -- */

async function readLeaves(page) {
  return page.evaluate(() => {
    const out = [];
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walk.nextNode())) {
      const s = (n.textContent || "").trim();
      if (!s) continue;
      const el = n.parentElement;
      if (!el || el.closest("script,style,noscript")) continue;
      // Skip anything explicitly marked as English content (legal bodies).
      if (el.closest('[lang="en"]')) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      if (getComputedStyle(el).visibility === "hidden") continue;
      let zone = "body";
      if (el.closest("header")) zone = "header";
      else if (el.closest("footer")) zone = "footer";
      out.push({ text: s, zone });
    }
    return out;
  });
}

/**
 * Surfaces that only exist AFTER an interaction.
 *
 * The crawl above loads a route and reads it. That measures the page as
 * DELIVERED, not everything a visitor can reach — and the gap was not
 * theoretical: the purchase dialog, which holds the name, email and phone
 * fields and the "Continue to Secure Payment" button, was entirely English in
 * Arabic mode while this script reported zero findings across twenty routes.
 * It is the most commercially important surface on the site and the crawler
 * had never opened it.
 *
 * Each entry opens one such surface and returns the element to read. Anything
 * behind a click, a tab or a disclosure belongs here; if it needs an
 * interaction to appear, the crawl cannot see it.
 */
const INTERACTIVE = [
  {
    route: "/packages",
    name: "purchase dialog",
    open: async (page) => {
      const btn = page.locator("button", { hasText: /ابدأ برنامجك|Start Your Program/ }).first();
      if (!(await btn.count())) return null;
      await btn.click();
      await page.waitForSelector('[role="dialog"]', { timeout: 8000 });
      await page.waitForTimeout(600);
      return '[role="dialog"]';
    },
  },
];

async function crawlInteractive(page, findings) {
  for (const item of INTERACTIVE) {
    process.stderr.write("  " + item.route + " › " + item.name + " … ");
    await page.goto(`http://${HOST}:${PORT}${item.route}?lang=ar`, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    await page.waitForTimeout(900);
    let selector = null;
    try {
      selector = await item.open(page);
    } catch {
      selector = null;
    }
    if (!selector) {
      // Not finding the surface is itself a finding: it means this probe has
      // silently stopped covering what it claims to cover.
      findings.push({
        route: item.route,
        zone: "html",
        text: "could not open " + item.name + " — this probe is no longer covering it",
        kind: "probe-broken",
      });
      process.stderr.write("COULD NOT OPEN\n");
      continue;
    }
    const leaves = await readLeavesWithin(page, selector);
    let found = 0;
    for (const { text, zone } of leaves) {
      const kind = classify(text);
      if (kind) {
        findings.push({ route: item.route + " › " + item.name, zone, text, kind });
        found++;
      }
    }
    process.stderr.write(found + "\n");
  }
}

async function readLeavesWithin(page, selector) {
  return page.evaluate((sel) => {
    const root = document.querySelector(sel);
    if (!root) return [];
    const out = [];
    const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walk.nextNode())) {
      const s = (n.textContent || "").trim();
      if (!s) continue;
      const el = n.parentElement;
      if (!el || el.closest("script,style,noscript")) continue;
      if (el.closest('[lang="en"]')) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      if (getComputedStyle(el).visibility === "hidden") continue;
      out.push({ text: s, zone: "body" });
    }
    return out;
  }, selector);
}

/**
 * The legal pages are allowed to be English, but only while they carry the
 * Arabic notice saying so. If that notice ever disappears the exemption is no
 * longer honest, so it is asserted rather than assumed.
 */
async function assertLegalNotice(page, findings) {
  for (const route of LEGAL_ROUTES) {
    await page.goto(`http://${HOST}:${PORT}${route}?lang=ar`, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    // These routes are React.lazy, so a fixed short wait races the chunk and
    // reports a missing notice that is simply not painted yet. Poll instead.
    const hasNotice = await page
      .waitForFunction(
        () => /النسخة الإنجليزية|باللغة الإنجليزية/.test(document.body.innerText),
        undefined,
        { timeout: 15000 },
      )
      .then(() => true)
      .catch(() => false);
    if (!hasNotice) {
      findings.push({
        route,
        zone: "legal",
        text: "(missing) Arabic authoritative-language notice",
        kind: "legal-notice-missing",
      });
    }
  }
}

/* ------------------------------------------------------------------ main -- */

function startPreview() {
  // Invoke vite through the current node binary rather than through npx: a
  // spawned shell here does not resolve npx, and with stdio ignored that
  // failure is silent — the audit just appears to hang.
  const p = spawn(
    process.execPath,
    [
      "node_modules/vite/bin/vite.js",
      "preview",
      "--host",
      HOST,
      "--port",
      String(PORT),
      "--strictPort",
    ],
    { cwd: root, stdio: "ignore" },
  );
  p.on("error", (e) => {
    console.error("i18n:audit — could not start preview server: " + e.message);
    process.exit(2);
  });
  return p;
}

/**
 * On Windows the spawned `npx` is a shell wrapper, so killing it leaves the
 * real vite process holding the port. The next run then either fails on
 * --strictPort or, worse, silently audits the PREVIOUS build. Kill the tree.
 */
function stopPreview(p) {
  if (!p || p.killed) return;
  if (process.platform === "win32" && p.pid) {
    try {
      spawnSync("taskkill", ["/pid", String(p.pid), "/T", "/F"], { stdio: "ignore" });
      return;
    } catch {
      /* fall through to kill() */
    }
  }
  p.kill();
}

async function waitForServer(timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      // A bare fetch to a dead port can hang rather than reject, and the
      // deadline above is only checked between iterations — so one hanging
      // request would block the whole audit forever. Bound every attempt.
      const r = await fetch(`http://${HOST}:${PORT}/`, { signal: AbortSignal.timeout(2000) });
      if (r.ok) return true;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}

/* ------------------------------------------------------ classifier self-test */

/**
 * THE CLASSIFIER IS PROVEN AGAINST KNOWN DEFECTS BEFORE IT IS TRUSTED.
 *
 * A checker that fails silent is worse than no checker: it manufactures
 * confidence that gets acted on. This one did exactly that twice — it reported
 * clean while "By Monzer Allan" sat untranslated on seven article pages, and
 * again while "LJ100" was being split into a bogus "LJ".
 *
 * So every run starts by re-introducing those defects and confirming they are
 * caught. If any case below fails, the audit exits WITHOUT crawling: a
 * classifier that cannot catch a bug we already know about must not be allowed
 * to report a clean site.
 *
 * MUST_FLAG entries are real strings that shipped, or the class of string that
 * shipped. MUST_PASS entries are the false positives that were fixed; they
 * exist so tightening the classifier cannot quietly start crying wolf.
 */
const MUST_FLAG = [
  [
    "By Monzer Allan",
    "the regression that shipped: allow-listed names beside a short English word",
  ],
  ["in Monzer Allan", "same masking, different preposition"],
  ["at Monzer Allan", "same masking"],
  ["to Monzer Allan", "same masking"],
  ["of Monzer Allan", "same masking"],
  ["on Monzer Allan", "same masking"],
  ["or Monzer Allan", "same masking"],
  ["vs Monzer Allan", "same masking"],
  ["no Monzer Allan", "same masking"],
  ["a Monzer Allan", "single-character survivor, which the old length gate also dropped"],
  ["Products", "a lone English word with no allow-listed neighbour at all"],
  ["Blog", "short lone English word"],
  ["Watch on YouTube", "English around an allow-listed brand"],
  ["Read the Blog", "ordinary English prose"],
];

const MUST_PASS = [
  ["1000 mg", "a transcribed dose"],
  ["5000 IU (MK-7)", "dose plus a form code — the false positive from splitting on digits"],
  ["1000 mg (LJ100) · 120 كبسولة", "the real product meta line that was wrongly flagged"],
  ["EPA وDHA", "scientific tokens inside Arabic"],
  ["فيتامين D3 وK2", "vitamin letters inside Arabic"],
  ["مزامنة Wi-Fi", "a brand token inside Arabic"],
  ["إنزيم CoQ10", "a compound name inside Arabic"],
  ["عبوة المنتج الحقيقية مقدَّمة من ⁨Monzer Allan⁩.", "Arabic prose naming the doctor"],
  [
    "برامج تغذية مخصصة من ⁨Nutrition Specialist & Pharmacist⁩",
    "the credential kept English by decision",
  ],
  ["30 يناير 2026", "an Arabic date"],
  ["$119", "a price"],
  ["استشارتان", "plain Arabic"],
];

function selfTest() {
  const failures = [];
  for (const [text, why] of MUST_FLAG) {
    if (classify(text) === null) failures.push(["MISSED", text, why]);
  }
  for (const [text, why] of MUST_PASS) {
    const k = classify(text);
    if (k !== null) failures.push(["FALSE POSITIVE (" + k + ")", text, why]);
  }
  return failures;
}

const selfTestFailures = selfTest();
if (selfTestFailures.length) {
  console.error(
    "i18n:audit — CLASSIFIER SELF-TEST FAILED (" +
      selfTestFailures.length +
      " of " +
      (MUST_FLAG.length + MUST_PASS.length) +
      " cases). Not crawling: a classifier that cannot catch a known bug must not report a clean site.",
  );
  for (const [kind, text, why] of selfTestFailures) {
    console.error("  " + kind + "  " + JSON.stringify(text) + "\n      " + why);
  }
  process.exit(3);
}
if (process.argv.includes("--self-test")) {
  console.log(
    "i18n:audit — classifier self-test passed: " +
      MUST_FLAG.length +
      " known defects caught, " +
      MUST_PASS.length +
      " known-good strings left alone.",
  );
  process.exit(0);
}

const server = startPreview();
let exitCode = 0;
try {
  if (!(await waitForServer())) {
    console.error("i18n:audit — preview server did not start. Run a build first.");
    process.exit(2);
  }

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  const findings = [];

  for (const route of ROUTES) {
    // "networkidle" can wait forever on a page that keeps a connection open,
    // and this script has no per-route output, so that hang looks like a dead
    // process rather than a slow one. Bound it, and say where we are.
    process.stderr.write("  " + route + " … ");
    await page.goto(`http://${HOST}:${PORT}${route}?lang=ar`, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    await page.waitForLoadState("load", { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(700);

    const dir = await page.evaluate(() => document.documentElement.getAttribute("dir"));
    if (dir !== "rtl") {
      findings.push({ route, zone: "html", text: `dir="${dir}" (expected rtl)`, kind: "not-rtl" });
    }

    const leaves = await readLeaves(page);

    // A page that throws during render unmounts the whole React tree and
    // leaves an almost-empty body — which would score ZERO findings and read
    // as a pass. That happened: / and /faq both reported 0 for one run while
    // the home page was actually blank. A gate that cannot tell "clean" from
    // "did not render" is measuring the artefact again, so assert the page
    // actually produced content.
    if (leaves.length < MIN_LEAVES) {
      findings.push({
        route,
        zone: "html",
        text: `page rendered only ${leaves.length} text nodes (expected >= ${MIN_LEAVES}) — blank or crashed, not clean`,
        kind: "page-did-not-render",
      });
    }

    let found = 0;
    for (const { text, zone } of leaves) {
      const kind = classify(text);
      if (kind) {
        findings.push({ route, zone, text, kind });
        found++;
      }
    }
    process.stderr.write(String(found) + os.EOL);
  }

  await crawlInteractive(page, findings);
  await assertLegalNotice(page, findings);
  await browser.close();

  // Report by unique string: chrome repeats on every route and a list of 12
  // identical rows hides how much is actually wrong.
  const byText = new Map();
  for (const f of findings) {
    const k = f.zone + " " + f.text;
    if (!byText.has(k)) byText.set(k, { ...f, routes: [] });
    byText.get(k).routes.push(f.route);
  }
  const unique = [...byText.values()].sort(
    (a, b) => b.routes.length - a.routes.length || a.text.localeCompare(b.text),
  );

  if (unique.length === 0) {
    console.log(`i18n:audit — 0 reachable English strings across ${ROUTES.length} routes. PASS`);
  } else {
    const byZone = { header: 0, footer: 0, body: 0, html: 0, legal: 0 };
    unique.forEach((u) => (byZone[u.zone] = (byZone[u.zone] || 0) + 1));
    console.error(
      `i18n:audit — ${unique.length} reachable English strings ` +
        `(header ${byZone.header}, footer ${byZone.footer}, body ${byZone.body}` +
        (byZone.html ? `, html ${byZone.html}` : "") +
        (byZone.legal ? `, legal ${byZone.legal}` : "") +
        `) across ${ROUTES.length} routes. FAIL`,
    );
    const show = VERBOSE ? unique : unique.slice(0, 25);
    for (const u of show) {
      const t = u.text.length > 100 ? u.text.slice(0, 100) + "…" : u.text;
      console.error(
        `  [${u.zone}/${u.kind}] ×${u.routes.length}  ${t}` +
          (u.routes.length <= 2 ? `\n        on: ${u.routes.join(", ")}` : ""),
      );
    }
    if (!VERBOSE && unique.length > show.length) {
      console.error(`  … ${unique.length - show.length} more (run with -- --list)`);
    }
    exitCode = 1;
  }
} finally {
  stopPreview(server);
}
process.exit(exitCode);

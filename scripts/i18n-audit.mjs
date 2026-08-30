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
import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const PORT = 4193;
const VERBOSE = process.argv.includes("--list");

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

/** Same hand-written scanner the review script uses — not a regex. */
function parseDict(src) {
  const out = {};
  let i = src.indexOf("{");
  while (i >= 0 && i < src.length) {
    const q = src.indexOf('"', i);
    if (q < 0) break;
    const key = readQuoted(src.slice(q));
    if (key === null) break;
    const after = src.indexOf('"', q + 1 + key.raw);
    const colon = src.indexOf(":", after);
    if (colon < 0) break;
    let j = colon + 1;
    while (j < src.length && /\s/.test(src[j])) j++;
    if (src[j] === '"') {
      const v = readQuoted(src.slice(j));
      if (v === null) break;
      out[key.value] = v.value;
      i = j + v.raw;
    } else {
      i = colon + 1;
    }
  }
  return out;
}

function readQuoted(s) {
  if (s[0] !== '"') return null;
  let v = "";
  for (let i = 1; i < s.length; i++) {
    const c = s[i];
    if (c === "\\") {
      const n = s[i + 1];
      v += n === "n" ? "\n" : n === "t" ? "\t" : n;
      i++;
      continue;
    }
    if (c === '"') return { value: v, raw: i + 1 };
    v += c;
  }
  return null;
}

const en = parseDict(readFileSync(resolve(root, "src/i18n/dictionaries/en.ts"), "utf8"));
const enValues = new Set(Object.values(en).map((v) => v.trim()));

/* ------------------------------------------------------------ classifier -- */

const stripIsolates = (s) => s.replace(/[⁦-⁩‎‏]/g, "");

function classify(text) {
  const s = stripIsolates(text).trim();
  if (!s) return null;
  if (ACCEPTED.some((a) => a.match(s))) return null;

  // (a) the string IS an English dictionary value -> definitely untranslated
  if (enValues.has(s)) return "english-dictionary-value";

  // (b) Latin-script prose: two or more adjacent non-allowed Latin words
  const words = s.match(/[A-Za-z][A-Za-z'’-]{1,}/g) || [];
  const offenders = words.filter((w) => !ALLOW_TOKEN.some((rx) => rx.test(w)));
  if (offenders.length >= 2) return "latin-prose";
  // A single long English word on its own is still prose ("Products", "Blog").
  if (offenders.length === 1 && offenders[0].length >= 4) return "latin-word";
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
 * The legal pages are allowed to be English, but only while they carry the
 * Arabic notice saying so. If that notice ever disappears the exemption is no
 * longer honest, so it is asserted rather than assumed.
 */
async function assertLegalNotice(page, findings) {
  for (const route of LEGAL_ROUTES) {
    await page.goto(`http://localhost:${PORT}${route}?lang=ar`, { waitUntil: "networkidle" });
    await page.waitForTimeout(300);
    const hasNotice = await page.evaluate(() =>
      /النسخة الإنجليزية|باللغة الإنجليزية/.test(document.body.innerText)
    );
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
  const p = spawn(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["vite", "preview", "--port", String(PORT), "--strictPort"],
    { cwd: root, stdio: "ignore", shell: process.platform === "win32" }
  );
  return p;
}

async function waitForServer(timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(`http://localhost:${PORT}/`);
      if (r.ok) return true;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
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
    await page.goto(`http://localhost:${PORT}${route}?lang=ar`, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);

    const dir = await page.evaluate(() => document.documentElement.getAttribute("dir"));
    if (dir !== "rtl") {
      findings.push({ route, zone: "html", text: `dir="${dir}" (expected rtl)`, kind: "not-rtl" });
    }

    for (const { text, zone } of await readLeaves(page)) {
      const kind = classify(text);
      if (kind) findings.push({ route, zone, text, kind });
    }
  }

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
    (a, b) => b.routes.length - a.routes.length || a.text.localeCompare(b.text)
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
        `) across ${ROUTES.length} routes. FAIL`
    );
    const show = VERBOSE ? unique : unique.slice(0, 25);
    for (const u of show) {
      const t = u.text.length > 100 ? u.text.slice(0, 100) + "…" : u.text;
      console.error(
        `  [${u.zone}/${u.kind}] ×${u.routes.length}  ${t}` +
          (u.routes.length <= 2 ? `\n        on: ${u.routes.join(", ")}` : "")
      );
    }
    if (!VERBOSE && unique.length > show.length) {
      console.error(`  … ${unique.length - show.length} more (run with -- --list)`);
    }
    exitCode = 1;
  }
} finally {
  server.kill();
}
process.exit(exitCode);

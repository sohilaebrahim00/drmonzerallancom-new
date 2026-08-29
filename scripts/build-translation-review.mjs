/**
 * Builds the Arabic translation review document.
 *
 * Dr. Allan reads this on a phone and marks it up. It is NOT a diff — English
 * on the left, Arabic on the right, paragraph aligned, grouped by the page each
 * string appears on. The strings needing his attention come FIRST, before
 * anything else, so the thing he must look at is the thing he sees.
 *
 * Regenerate after every translation group:
 *     npm run i18n:review
 *
 * Output is static HTML committed to the repo. It is deliberately NOT a route
 * on the site: it is an internal working document, and putting it behind a URL
 * would make it a page someone could find.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const OUT = resolve(root, "docs/translation-review/index.html");

/** Parses a dictionary file into { key: value } without importing TypeScript.
 *  A hand-written scanner rather than a regex: the values contain quotes,
 *  escapes and invisible bidi isolates, and the regex for that is unreadable. */
function parseDict(src) {
  const out = {};
  const lines = src.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith('  "')) continue;
    const endQuote = line.indexOf('":', 3);
    if (endQuote === -1) continue;
    const key = line.slice(3, endQuote);
    let rest = line.slice(endQuote + 2).trim();
    if (rest.startsWith("{")) {
      const forms = {};
      for (let j = i + 1; j < lines.length && !lines[j].trim().startsWith("}"); j++) {
        const t = lines[j].trim();
        const c = t.indexOf(":");
        if (c === -1) continue;
        const form = t.slice(0, c).trim();
        const v = readQuoted(t.slice(c + 1));
        if (v !== null) forms[form] = v;
      }
      out[key] = forms;
      continue;
    }
    if (rest === "") {
      rest = (lines[i + 1] || "").trim();
    }
    const v = readQuoted(rest);
    if (v !== null) out[key] = v;
  }
  return out;
}

/** Reads the first double-quoted JS string in `s`, honouring escapes. */
function readQuoted(s) {
  const start = s.indexOf('"');
  if (start === -1) return null;
  let buf = "";
  for (let i = start + 1; i < s.length; i++) {
    const ch = s[i];
    if (ch === "\\") {
      buf += s[i + 1] === "n" ? "\n" : s[i + 1];
      i++;
      continue;
    }
    if (ch === '"') return buf;
    buf += ch;
  }
  return null;
}

const en = parseDict(readFileSync(resolve(root, "src/i18n/dictionaries/en.ts"), "utf8"));
const ar = parseDict(readFileSync(resolve(root, "src/i18n/dictionaries/ar.ts"), "utf8"));

/**
 * Strings the doctor must decide on. Keyed so a reviewer can point at one.
 * ALL About-page and legal/intake keys are flagged by rule regardless of
 * confidence — the prefixes below do that automatically so nobody has to
 * remember to add them one at a time.
 */
const FLAG_PREFIXES = [
  "aboutPage.",
  "credential.",
  "intake.",
  "legal.",
  "pkg.",
  "faqItem.",
  "product.",
  "blog.englishOnly",
];
const FLAGGED = {
  "F-5": {
    question:
      "Do you already use your own Arabic names for the video, article, product and FAQ categories?",
    detail:
      "If you label this content yourself — on YouTube, or in your own materials — your names should replace ours. These were translated from the English without knowing whether Arabic names already exist.",
    keys: [
      "videoCategory.education",
      "articleCategory.weightManagement",
      "productCategory.supplements",
      "faqCategory.programs",
    ],
  },
  "F-7": {
    question: "We lengthened the Arabic for three of your intake questions (3, 4 and 5).",
    detail:
      "The Arabic for these three was shorter than your English — question 3 did not ask what the tests showed, question 4 did not ask for the results, and question 5 did not list breakfast/lunch/dinner/snacks. We brought them to parity so both patients are asked the same thing. If the shorter Arabic was deliberate, tell us and we will restore it. Separately: your Arabic for question 4 opens more broadly than your English, which names vitamin D, B12 and iron as examples — we left your wording alone there. Question 6 keeps your Arabic numerals exactly as you wrote them.",
    keys: ["intake.label3", "intake.label4", "intake.label5"],
  },
  "F-6": {
    question:
      'The credentials heading previously said "Verified Credentials". The word "Verified" was removed.',
    detail:
      "Nothing in the codebase records that the credentials were verified — the data file says the opposite. It now reads simply Credentials / المؤهلات. If you hold documentation, the word can go back; that is your call to make with the evidence in hand.",
    keys: ["aboutPage.backgroundTitle"],
  },
};

/** Which page each key group belongs to, in reading order. */
const SECTIONS = [
  ["About page — the doctor's own words", ["aboutPage.", "credential."], true],
  ["Consultation intake — the questions a patient answers", ["intake."], true],
  ["Legal notice", ["legal."], true],
  [
    "Patient screens — account, booking, errors",
    [
      "account.",
      "auth.",
      "myProgram.",
      "membership.",
      "notFound.",
      "consultations.",
      "notifications.",
    ],
  ],
  ["Navigation and header", ["nav.", "header.", "cta."]],
  ["Footer", ["footer."]],
  [
    "Home page sections",
    [
      "services.",
      "programs.",
      "howItWorks.",
      "products.",
      "blog.",
      "discovery.",
      "gallery.",
      "testimonials.",
      "videos.",
      "community.",
      "contactSection.",
      "beforeAfter.",
      "faqSection.",
    ],
  ],
  [
    "Pages — FAQ, products, blog, packages, gallery",
    ["faqPage.", "productsPage.", "blogPage.", "packagesPage.", "galleryPage.", "faq."],
  ],
  ["Program packages — what a buyer is choosing between", ["pkg."], true],
  ["FAQ — questions and answers", ["faqItem."], true],
  ["Products — names and descriptions", ["product."], true],
  ["Category labels", ["faqCategory.", "articleCategory.", "productCategory.", "videoCategory."]],
  ["Everything else", ["common."]],
];

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const isFlagged = (k) => FLAG_PREFIXES.some((p) => k.startsWith(p));

function renderValue(v) {
  if (typeof v === "string") return `<p>${esc(v)}</p>`;
  // plural entry — show every form, labelled, because the whole point is that
  // Arabic has six and the reviewer needs to see all of them
  return Object.entries(v)
    .map(([form, text]) => `<p><span class="form">${form}</span>${esc(text)}</p>`)
    .join("");
}

const used = new Set();
const sections = SECTIONS.map(([title, prefixes, allFlagged]) => {
  const keys = Object.keys(en)
    .filter((k) => !used.has(k) && prefixes.some((p) => k.startsWith(p)))
    .sort();
  keys.forEach((k) => used.add(k));
  return { title, keys, allFlagged: Boolean(allFlagged) };
}).filter((s) => s.keys.length);

const leftovers = Object.keys(en)
  .filter((k) => !used.has(k))
  .sort();
if (leftovers.length) sections.push({ title: "Unsorted", keys: leftovers, allFlagged: false });

const missing = Object.keys(en).filter((k) => !(k in ar));
const total = Object.keys(en).length;
const flaggedCount = Object.keys(en).filter((k) => isFlagged(k)).length;

const rows = (keys, allFlagged) =>
  keys
    .map((k) => {
      const flag = allFlagged || isFlagged(k);
      const arVal = ar[k];
      return `<div class="row${flag ? " flagged" : ""}">
      <div class="key">${esc(k)}${flag ? '<span class="badge">review</span>' : ""}</div>
      <div class="pair">
        <div class="en" dir="ltr" lang="en">${renderValue(en[k])}</div>
        <div class="ar" dir="rtl" lang="ar">${arVal === undefined ? '<p class="missing">— no Arabic yet —</p>' : renderValue(arVal)}</div>
      </div>
    </div>`;
    })
    .join("\n");

const questions = Object.entries(FLAGGED)
  .map(
    ([id, q]) => `<div class="q">
      <h3>${id} — ${esc(q.question)}</h3>
      <p>${esc(q.detail)}</p>
      <p class="keys">${q.keys.map((k) => `<code>${esc(k)}</code>`).join(" ")}</p>
    </div>`,
  )
  .join("\n");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>Arabic translation review — Dr. Monzer Allan</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<style>
  :root { --ink:#17233b; --muted:#5b667d; --line:#e3e8ef; --flag:#fff8e1; --flagline:#e6b800; }
  * { box-sizing: border-box; }
  body { margin:0; padding:0 0 4rem; font:16px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; color:var(--ink); background:#fbfcfd; }
  header { padding:1.5rem 1rem 1rem; border-bottom:1px solid var(--line); background:#fff; position:sticky; top:0; z-index:5; }
  h1 { margin:0 0 .3rem; font-size:1.2rem; }
  .meta { color:var(--muted); font-size:.85rem; }
  main { padding:0 1rem; max-width:60rem; margin:0 auto; }
  h2 { font-size:1rem; margin:2.2rem 0 .8rem; padding-bottom:.4rem; border-bottom:2px solid var(--ink); }
  .intro { background:#fff; border:1px solid var(--line); border-radius:10px; padding:1rem; margin:1.2rem 0; }
  .intro p { margin:.4rem 0; }
  .q { background:var(--flag); border:1px solid var(--flagline); border-radius:10px; padding:.9rem 1rem; margin:.8rem 0; }
  .q h3 { margin:0 0 .4rem; font-size:.98rem; }
  .q p { margin:.35rem 0; font-size:.92rem; }
  .keys code { background:#fff; border:1px solid var(--line); border-radius:4px; padding:.05rem .3rem; font-size:.78rem; }
  .row { background:#fff; border:1px solid var(--line); border-radius:10px; margin:.6rem 0; overflow:hidden; }
  .row.flagged { border-color:var(--flagline); box-shadow:0 0 0 2px #fdf3d0 inset; }
  .key { font:600 .72rem/1.4 ui-monospace,SFMono-Regular,Menlo,monospace; color:var(--muted); padding:.5rem .8rem; border-bottom:1px solid var(--line); background:#f7f9fc; }
  .badge { float:right; background:var(--flagline); color:#3a2c00; border-radius:99px; padding:0 .5rem; font-size:.66rem; }
  .pair { display:grid; grid-template-columns:1fr; }
  @media (min-width:46rem) { .pair { grid-template-columns:1fr 1fr; } .en { border-right:1px solid var(--line); } }
  .en, .ar { padding:.7rem .9rem; }
  @media (max-width:46rem) { .en { border-bottom:1px solid var(--line); } }
  .ar { font-family:"IBM Plex Sans Arabic",-apple-system,sans-serif; font-size:1.05rem; line-height:1.95; }
  .en p, .ar p { margin:.25rem 0; }
  .form { display:inline-block; min-width:3.2rem; font:600 .68rem/1 ui-monospace,monospace; color:var(--muted); text-transform:uppercase; }
  .missing { color:#b00; font-style:italic; }
</style>
</head>
<body>
<header>
  <h1>Arabic translation review</h1>
  <div class="meta">${total} strings &middot; ${flaggedCount} marked for review &middot; ${missing.length} without Arabic</div>
</header>
<main>
  <div class="intro">
    <p><strong>What this is.</strong> Every piece of text on the website, in English and in Arabic side by side. Nothing here is live yet — the Arabic is switched off for visitors until you say it is ready.</p>
    <p><strong>What we need from you.</strong> The highlighted rows are the ones we are unsure about, and the questions below are the ones only you can answer. Everything else is there so you can read it in context, not because we need a decision on each line.</p>
    <p><strong>Anything that reads oddly, say so.</strong> A translation can be correct and still not sound like you. Your wording wins over ours.</p>
  </div>

  <h2>Questions for you</h2>
  ${questions}

  ${sections
    .map(
      (s) => `<h2>${esc(s.title)}${s.allFlagged ? " — all rows need your review" : ""}</h2>
  ${rows(s.keys, s.allFlagged)}`,
    )
    .join("\n")}
</main>
</body>
</html>
`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, html);
console.log(
  `wrote docs/translation-review/index.html — ${total} strings, ${flaggedCount} flagged, ${missing.length} missing Arabic`,
);

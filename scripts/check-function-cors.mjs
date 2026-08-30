/**
 * Asserts that EVERY response path in an Edge Function carries CORS headers —
 * the error paths especially.
 *
 * WHY THIS EXISTS, and why type checking could not do it.
 *
 * The 502 added to ai-chat lost its CORS headers because the fix spread the
 * imported `corsHeaders` FACTORY instead of the per-request object it returns.
 * `{ ...someFunction }` is legal TypeScript and an empty object at runtime, so
 * `deno check` stayed green while the response went out bare.
 *
 * A browser cannot read a cross-origin response that lacks the headers. So the
 * failure would not have surfaced as "502 upstream_failed" in the console — it
 * would have surfaced as an opaque network/CORS error, which is precisely the
 * mystery the 502 was added to remove. The repaired diagnostic would have
 * repaired nothing.
 *
 * ERROR PATHS ARE WHERE CORS GETS FORGOTTEN, because everyone exercises the
 * success path by hand and nobody exercises the 5xx. So this checks all of
 * them, statically, on every build.
 *
 * WHAT IT LOOKS FOR: any `new Response(...)` whose init object does not
 * reference a CORS header source, and any spread of a bare identifier that is
 * a known factory rather than its result.
 *
 * Usage: npm run check:functions:cors
 */
import { readdirSync, existsSync, readFileSync } from "node:fs";
import { resolve, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const dir = resolve(root, "supabase/functions");

/** Names that are CORS header SOURCES when spread. */
const CORS_TOKEN = /cors/i;

/**
 * Spreading these yields an empty object: they are functions, not header maps.
 * This is the exact mistake that motivated the file.
 */
const FACTORY_NAMES = new Set(["corsHeaders"]);

/**
 * Functions that no browser ever calls, so CORS does not apply.
 *
 * Listed EXPLICITLY with a reason rather than skipped silently: the difference
 * between "exempt" and "forgotten" has to be visible, and a future browser
 * caller for one of these would need this entry removed deliberately.
 */
const SERVER_TO_SERVER = new Map([
  ["stripe-webhook", "called by Stripe over the public webhook URL, never by a browser"],
]);

const findings = [];

function checkFile(name, file) {
  const src = readFileSync(file, "utf8");
  const lines = src.split("\n");

  // Every `new Response(` and the init object that follows it.
  for (let i = 0; i < lines.length; i++) {
    if (!/new Response\(/.test(lines[i])) continue;

    // Gather the statement: from this line until braces balance, capped.
    // Read until the call parens balance. The first version capped this at 14
    // lines and reported create-consultation as missing headers that sat on
    // line 16 of the statement — a false positive, which is how a checker
    // teaches people to ignore it.
    let stmt = "";
    let depth = 0;
    let started = false;
    for (let j = i; j < Math.min(i + 60, lines.length); j++) {
      stmt += lines[j] + "\n";
      for (const ch of lines[j]) {
        if (ch === "(") {
          depth++;
          started = true;
        } else if (ch === ")") depth--;
      }
      if (started && depth <= 0) break;
    }

    // A Response with no init object at all (e.g. new Response("ok")) still
    // needs headers when it crosses an origin.
    const hasInit = /\{[\s\S]*\}/.test(stmt.slice(stmt.indexOf("new Response(")));
    const mentionsCors = CORS_TOKEN.test(stmt);

    if (!mentionsCors) {
      findings.push({
        name,
        line: i + 1,
        kind: hasInit ? "response-without-cors" : "bare-response",
        text: lines[i].trim().slice(0, 90),
      });
      continue;
    }

    // Spreading a factory rather than its result: `...corsHeaders` where
    // corsHeaders is `(req) => ({...})`.
    const spreads = [...stmt.matchAll(/\.\.\.\s*([A-Za-z_$][\w$]*)/g)].map((m) => m[1]);
    for (const s of spreads) {
      if (FACTORY_NAMES.has(s)) {
        findings.push({
          name,
          line: i + 1,
          kind: "spread-of-factory",
          text: `...${s} spreads a function — yields {} at runtime, no headers sent`,
        });
      }
    }
  }
}

const entries = readdirSync(dir)
  .filter((d) => d !== "_shared")
  .map((d) => ({ name: d, file: resolve(dir, d, "index.ts") }))
  .filter((e) => existsSync(e.file));

const skipped = [];
for (const { name, file } of entries) {
  if (SERVER_TO_SERVER.has(name)) {
    skipped.push(`${name} — ${SERVER_TO_SERVER.get(name)}`);
    continue;
  }
  checkFile(name, file);
}

if (findings.length) {
  console.error(
    `check:functions:cors — ${findings.length} response path(s) may be unreadable by a browser:\n`,
  );
  for (const f of findings) {
    console.error(`  ${f.name}/index.ts:${f.line}  [${f.kind}]`);
    console.error(`      ${f.text}`);
  }
  console.error(
    "\n  If a browser cannot read our error, we do not have an error — we have a mystery.",
  );
  process.exit(1);
}
for (const s of skipped) console.log(`  exempt  ${s}`);
console.log(
  `check:functions:cors — ${entries.length - skipped.length} browser-facing functions, every response path carries CORS headers.`,
);

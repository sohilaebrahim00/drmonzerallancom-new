/**
 * Type-checks every Edge Function with `deno check`.
 *
 * WHY THIS IS A PEER OF tsc, NOT AN EXTRA.
 *
 * `tsc` and `vite build` do not look at supabase/functions/** at all — they
 * are not in the tsconfig include and they target a different runtime. So
 * until this script existed, EVERY EDGE FUNCTION IN THIS PROJECT SHIPPED
 * WITHOUT A TYPE CHECK, for its entire life. Those are the files that take
 * money.
 *
 * That was not a theoretical gap: an undefined identifier at module scope in
 * ai-chat/index.ts passed both `tsc` and `build:web` and was caught only by
 * running deno check by hand.
 *
 * KNOW WHAT THIS DOES NOT CATCH. `deno check` validates types, not meaning.
 * It accepts `{ ...someFunction }` — legal TypeScript, an empty object at
 * runtime — which is exactly how the 502 lost its CORS headers while this
 * stayed green. Type checking is a floor, not a ceiling; the CORS assertions
 * in scripts/check-function-cors.mjs cover that specific hole.
 *
 * Usage: npm run check:functions
 */
import { readdirSync, existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const dir = resolve(root, "supabase/functions");

const entries = readdirSync(dir)
  .filter((d) => d !== "_shared")
  .map((d) => ({ name: d, file: resolve(dir, d, "index.ts") }))
  .filter((e) => existsSync(e.file));

if (!entries.length) {
  console.error("check:functions — no functions found under supabase/functions");
  process.exit(2);
}

let failed = 0;
for (const { name, file } of entries) {
  const res = spawnSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["--yes", "deno@latest", "check", file],
    { encoding: "utf8", shell: process.platform === "win32" },
  );
  const out = `${res.stdout ?? ""}${res.stderr ?? ""}`;
  const bad = res.status !== 0 || /TS\d+ \[ERROR\]/.test(out);
  if (bad) {
    failed++;
    console.error(`  FAIL  ${name}`);
    for (const line of out.split("\n").filter((l) => /TS\d+ \[ERROR\]|error:/.test(l)).slice(0, 4)) {
      console.error(`        ${line.trim()}`);
    }
  } else {
    console.log(`  ok    ${name}`);
  }
}

if (failed) {
  console.error(`\ncheck:functions — ${failed} of ${entries.length} functions failed type checking.`);
  process.exit(1);
}

/**
 * Every function must declare verify_jwt in supabase/config.toml.
 *
 * `supabase functions deploy --no-verify-jwt` writes that setting to the
 * platform permanently, and a later deploy WITHOUT the flag does not undo it.
 * An absent [functions.x] block therefore does not mean "the secure default" —
 * it means "whatever someone last typed in a terminal", and the repository
 * records no evidence either way. chat-heartbeat sat open exactly that way on
 * 30 August 2026 and looked perfectly fine in review.
 *
 * A flag in a command is invisible state. A line in a file is reviewable
 * state. This turns the second into a requirement.
 */
const configPath = resolve(root, "supabase/config.toml");
const config = existsSync(configPath) ? readFileSync(configPath, "utf8") : "";
const declared = new Set(
  [...config.matchAll(/^\[functions\.([A-Za-z0-9_-]+)\]/gm)].map((m) => m[1]),
);

/**
 * Compared against what GIT TRACKS, not what happens to be on this disk.
 *
 * config.toml describes the repository. An untracked directory is somebody's
 * local scratch: declaring it fails the gate on every other machine, and not
 * declaring it fails the gate on theirs. Neither is a real finding, and a gate
 * that produces false positives dies as surely as one that produces false
 * negatives. So untracked functions are still TYPE-CHECKED above — local work
 * should not escape that — but they are not held to the declaration rule until
 * the moment they are committed, which is exactly when the declaration starts
 * to matter to anyone else.
 */
let tracked = null;
try {
  const ls = spawnSync("git", ["ls-files", "supabase/functions"], { cwd: root, encoding: "utf8" });
  if (ls.status === 0) {
    tracked = new Set(
      ls.stdout
        .split("\n")
        .map((p) => /^supabase\/functions\/([^/]+)\/index\.ts$/.exec(p.trim())?.[1])
        .filter((n) => n && n !== "_shared"),
    );
  }
} catch {
  /* no git — fall through to the on-disk list below */
}

const governed = entries.map((e) => e.name).filter((n) => (tracked ? tracked.has(n) : true));
const untracked = entries.map((e) => e.name).filter((n) => tracked && !tracked.has(n));
const undeclared = governed.filter((n) => !declared.has(n));
const orphaned = [...declared].filter((n) => !governed.includes(n));

for (const n of untracked) {
  console.log(`  note  ${n} is not committed — type-checked, but exempt from the config.toml rule until it is`);
}

if (undeclared.length || orphaned.length) {
  console.error("\ncheck:functions — supabase/config.toml does not describe what gets deployed:\n");
  for (const n of undeclared) {
    console.error(`  MISSING   [functions.${n}] — deploys with whatever verify_jwt the platform`);
    console.error(`            already holds, which nothing in this repo records.`);
  }
  for (const n of orphaned) {
    console.error(`  ORPHANED  [functions.${n}] — declared here, no such function on disk.`);
  }
  console.error("\n  A flag in a command is invisible state; a line in a file is reviewable state.");
  process.exit(1);
}

console.log(
  `\ncheck:functions — ${entries.length} functions type-checked, 0 errors; all ${declared.size} declared in config.toml.`,
);

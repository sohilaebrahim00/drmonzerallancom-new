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
import { readdirSync, existsSync } from "node:fs";
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
console.log(`\ncheck:functions — ${entries.length} functions type-checked, 0 errors.`);

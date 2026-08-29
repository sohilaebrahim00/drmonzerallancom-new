/**
 * Generates supabase/functions/_shared/price-manifest.json from the published
 * package data.
 *
 * WHY THIS EXISTS. Two copies of every price exist and cannot be merged: the
 * browser needs one at build time, and the Edge Function needs one it can
 * trust without asking the browser. Before this script they were "kept in sync
 * by convention" — a human remembering. This makes one of them a build output
 * instead, so a divergence is a diff rather than a silent bug.
 *
 * The output is GENERATED. Do not hand-edit it; run `npm run prices:emit`.
 * CI runs the same command and fails if the result differs from what is
 * committed, which is what stops a stale manifest reaching production.
 *
 * Amounts are integer CENTS. `price` is expressed in dollars, so a naive
 * `price * 100` on a value like 119.5 yields 11950.000000000002 — hence
 * Math.round, plus an assertion that the input was a sane money value in the
 * first place.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const SOURCE = resolve(root, "src/data/programPackages.ts");
const OUT = resolve(root, "supabase/functions/_shared/price-manifest.json");

// Parsed rather than imported: the data file is TypeScript and pulls in
// lucide-react, which a plain `node` run cannot load. The shape it reads is
// narrow and asserted below, so a change to the file that breaks the parse
// fails loudly instead of silently emitting fewer packages.
const src = readFileSync(SOURCE, "utf8");
const entries = [...src.matchAll(/slug:\s*"([a-z_]+)"[\s\S]*?price:\s*([0-9.]+)\s*,/g)];

if (entries.length === 0) {
  throw new Error(`emit-price-manifest: parsed 0 packages from ${SOURCE} — the shape changed.`);
}

const manifest = {};
for (const [, slug, priceRaw] of entries) {
  const price = Number(priceRaw);
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`emit-price-manifest: ${slug} has a non-money price: ${priceRaw}`);
  }
  const cents = Math.round(price * 100);
  if (!Number.isInteger(cents)) {
    throw new Error(`emit-price-manifest: ${slug} did not round to an integer: ${cents}`);
  }
  if (Math.abs(price * 100 - cents) > 0.001) {
    throw new Error(
      `emit-price-manifest: ${slug} price ${price} is not a whole number of cents (${price * 100}).`,
    );
  }
  manifest[slug] = cents;
}

const json = JSON.stringify(
  {
    _generated: "Run `npm run prices:emit`. Do not hand-edit — CI compares this against a fresh run.",
    _source: "src/data/programPackages.ts",
    amountCents: manifest,
  },
  null,
  2,
);

const previous = (() => {
  try {
    return readFileSync(OUT, "utf8");
  } catch {
    return null;
  }
})();

if (process.argv.includes("--check")) {
  if (previous !== json + "\n") {
    console.error(
      "price-manifest.json is out of date with src/data/programPackages.ts.\nRun: npm run prices:emit",
    );
    process.exit(1);
  }
  console.log(`price manifest up to date (${Object.keys(manifest).length} packages).`);
} else {
  writeFileSync(OUT, json + "\n");
  console.log(
    `wrote ${OUT.replace(root, ".")} (${Object.keys(manifest).length} packages): ` +
      Object.entries(manifest).map(([k, v]) => `${k}=${v}`).join(", "),
  );
}

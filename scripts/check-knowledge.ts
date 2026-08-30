/**
 * Asserts that the AI's knowledge base cannot disagree with the till.
 *
 * WHY THIS EXISTS.
 *
 * Commit 024cee0 retired the monthly memberships from the site. It changed the
 * UI and left scripts/build-ai-knowledge.ts importing src/data/packages — the
 * dead file. Nothing regenerated the knowledge base and nothing complained, so
 * for weeks the assistant told visitors the Basic Membership was "$29 per
 * month (down from $58)" while checkout charged $119 once. Every automated
 * check we had was green the entire time, because none of them compared what
 * the assistant says to what the site sells.
 *
 * It was found by accident: the chat heartbeat tripped over it while asserting
 * something else. That is the definition of an unguarded class.
 *
 * WHAT IT CHECKS — three set comparisons, no heuristics:
 *   1. Every dollar amount in the knowledge base exists in the catalogue.
 *   2. Every `package-*` entry maps to a package the site will actually sell.
 *   3. No product name that exists ONLY in a retired data file appears at all.
 *
 * Check 3 is derived, not hardcoded: it is the set difference between the
 * retired file and the live one. When src/data/packages.ts is finally deleted
 * (it survives only because src/app-native still imports it) the check becomes
 * vacuous on its own, which is the correct way for a check to retire.
 *
 * Written as .ts and run through tsx so it IMPORTS the catalogue rather than
 * re-parsing it. A checker with its own copy of the data is a second source of
 * truth, and this whole defect is what a second source of truth costs.
 *
 * Usage: npm run check:knowledge          (also runs inside `npm run gate`)
 *        npm run check:knowledge -- --self-test
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { programPackages, purchasableProgramPackages } from "../src/data/programPackages";
import { packages as retiredPackages } from "../src/data/packages";
import { getPublishedProducts } from "../src/data/products";
import type { KnowledgeItem } from "../src/ai/knowledge/types";

const here = path.dirname(fileURLToPath(import.meta.url));
const KB_PATH = path.resolve(here, "../src/ai/knowledge/generated-knowledge.json");

export interface Finding {
  kind: "unknown-price" | "unsellable-package" | "retired-product-name";
  item: string;
  detail: string;
}

/** Every amount the site is willing to charge or to show struck through. */
function allowedAmounts(): Set<number> {
  const amounts = new Set<number>();
  for (const p of purchasableProgramPackages) {
    amounts.add(p.price);
    if (p.previousPrice) amounts.add(p.previousPrice);
  }
  // Products currently have price: null ("Contact for Price"), so this adds
  // nothing today. It is here so that the day a product gets a real price, the
  // gate does not start failing on a legitimate change.
  for (const p of getPublishedProducts()) {
    if (typeof p.price === "number") amounts.add(p.price);
  }
  return amounts;
}

/**
 * Names the assistant must never speak: present in the retired catalogue and
 * absent from the live one. Set difference, computed at run time.
 */
function retiredOnlyNames(): string[] {
  // The live vocabulary is more than the full names. The catalogue also
  // declares a `tier` ("basic" | "plus" | "premium") and a `packageType`
  // ("diet" | "treatment"), and the site's own FAQ uses the short forms:
  // "Treatment programs come in Basic, Plus, and Premium tiers". Those words
  // are live vocabulary, so a retired tier that happens to share one of them
  // is not evidence of anything. Without this, the gate condemned the FAQ —
  // caught on the first run against real data.
  //
  // "VIP Elite" survives the subtraction, because nothing in the live
  // catalogue is called that. That is the name the assistant must never say.
  const live = new Set<string>();
  for (const p of programPackages) {
    live.add(p.name.toLowerCase());
    live.add(p.tier.toLowerCase());
    live.add(p.packageType.toLowerCase());
  }
  return retiredPackages
    .map((p) => p.name)
    .filter((n) => !live.has(n.toLowerCase()));
}

export function checkKnowledge(items: KnowledgeItem[]): Finding[] {
  const findings: Finding[] = [];
  const amounts = allowedAmounts();
  const retired = retiredOnlyNames();
  const sellableSlugs = new Set(purchasableProgramPackages.map((p) => p.slug));

  for (const item of items) {
    const text = `${item.title} ${item.content}`;

    // 1. Prices. Trailing punctuation is stripped before parsing — the first
    // draft of this read "$119," as a distinct amount from "$119".
    for (const m of text.matchAll(/\$\s?([0-9][0-9,]*(?:\.[0-9]{1,2})?)/g)) {
      const value = Number(m[1].replace(/,/g, ""));
      if (!Number.isFinite(value)) continue;
      if (!amounts.has(value)) {
        findings.push({
          kind: "unknown-price",
          item: item.id,
          detail: `$${m[1]} is not a price in the catalogue (allowed: ${[...amounts].sort((a, b) => a - b).map((a) => `$${a}`).join(", ")})`,
        });
      }
    }

    // 2. Package entries must describe something purchasable.
    if (item.id.startsWith("package-") && item.id !== "package-comparison") {
      const slug = item.id.slice("package-".length);
      if (!sellableSlugs.has(slug as never)) {
        findings.push({
          kind: "unsellable-package",
          item: item.id,
          detail: `describes "${slug}", which the site does not sell (sellable: ${[...sellableSlugs].join(", ")})`,
        });
      }
    }

    // 3. Retired product names, anywhere.
    //
    // The live names are redacted FIRST. The retired tiers were called "Basic",
    // "Premium" and "VIP Elite"; the live ones are "Treatment Basic" and
    // "Treatment Premium". A plain word-boundary search for "Basic" therefore
    // matches inside "Treatment Basic" and condemns the correct catalogue —
    // which is exactly what the self-test caught on the first run. Only the
    // text left over after the live names are removed can be a retired name.
    let residue = text;
    for (const live of programPackages) {
      residue = residue.replaceAll(new RegExp(live.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), " ");
    }
    for (const name of retired) {
      if (new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(residue)) {
        findings.push({
          kind: "retired-product-name",
          item: item.id,
          detail: `mentions "${name}", which exists only in the retired src/data/packages.ts`,
        });
      }
    }
  }
  return findings;
}

/**
 * SELF-TEST — standing rule: every gate defect found in the wild becomes a
 * self-test case, and a gate is not trusted until it is proven against the
 * very defect it was written for.
 *
 * MUST_FLAG case 1 is the real sentence the live assistant was serving.
 */
function selfTest(): boolean {
  const mk = (id: string, content: string): KnowledgeItem =>
    ({ id, category: "packages", title: "t", content, keywords: [] }) as KnowledgeItem;

  const MUST_FLAG: Array<[string, KnowledgeItem]> = [
    [
      "the live defect: $29/month membership pricing",
      mk("package-basic", "Basic: Current price: $29 / Month (was $58). Includes 1 consultation credit per month."),
    ],
    ["the retired comparison table", mk("package-comparison", "Monthly price — Basic: $29 (was $58); Premium: $61; VIP Elite: $103.")],
    ["a retired product name with no price", mk("membership-overview", "Choose a membership: Basic, Premium, or VIP Elite.")],
    ["a package entry for something not sold", mk("package-diet_basic", "Diet Basic: $40.")],
    ["a plausible but invented price", mk("package-treatment_basic", "Treatment Basic costs $149.")],
  ];
  const MUST_PASS: Array<[string, KnowledgeItem]> = [
    ["the corrected package entry", mk("package-treatment_basic", "Treatment Basic: Price: $119, a one-time payment (was $200). Includes 2 doctor consultations.")],
    ["the corrected comparison", mk("package-comparison", "One-time price — Treatment Basic: $119; Treatment Plus: $169; Treatment Premium: $199.")],
    ["prose that says 'monthly' legitimately", mk("policy-x", "Program credits do not expire on a monthly cycle like membership credits.")],
    // The site's real FAQ. The gate flagged this on its first run against real
    // data, because "Basic" and "Premium" are also retired tier names.
    [
      "the site's own FAQ naming tiers by their short form",
      mk("faq-0", "Treatment programs come in Basic, Plus, and Premium tiers that differ only in how many consultations are included."),
    ],
    ["a price written with a comma", mk("package-comparison", "Bundled at $1,000.")], // expected to FAIL below — see note
    ["an item with no prices at all", mk("faq-1", "Consultations happen over Google Meet.")],
  ];

  let pass = true;
  console.log("  self-test — must flag:");
  for (const [label, item] of MUST_FLAG) {
    const got = checkKnowledge([item]).length > 0;
    if (!got) pass = false;
    console.log(`    ${got ? "ok  " : "MISS"} ${label}`);
  }
  console.log("  self-test — must pass clean:");
  for (const [label, item] of MUST_PASS) {
    // "$1,000" is deliberately NOT in the catalogue, so it must be flagged.
    // It is listed here to prove comma parsing works rather than silently
    // skipping the amount, which is how a price check quietly stops checking.
    const expectFlag = label.includes("comma");
    const got = checkKnowledge([item]).length > 0;
    const ok = got === expectFlag;
    if (!ok) pass = false;
    console.log(`    ${ok ? "ok  " : "FAIL"} ${label}${expectFlag ? " (expected to flag — comma parsing)" : ""}`);
  }
  return pass;
}

const args = process.argv.slice(2);
if (args.includes("--self-test")) {
  process.exit(selfTest() ? 0 : 3);
}

if (!selfTest()) {
  console.error("\ncheck:knowledge — SELF-TEST FAILED. The gate is unreliable; not reporting on the real data.");
  process.exit(3);
}

const items: KnowledgeItem[] = JSON.parse(readFileSync(KB_PATH, "utf8")).items;
const findings = checkKnowledge(items);

if (findings.length) {
  console.error(`\ncheck:knowledge — ${findings.length} claim(s) the site does not make:\n`);
  for (const f of findings) console.error(`  [${f.kind}] ${f.item}\n      ${f.detail}`);
  console.error("\n  The assistant must not quote a price the till will not charge.");
  console.error("  If the catalogue changed, run: npm run build:knowledge");
  process.exit(1);
}
console.log(`\ncheck:knowledge — ${items.length} items, every price and product name matches the catalogue.`);

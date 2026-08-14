// Works around a real bug in the Capacitor CLI (8.5.0) when `npx cap sync
// ios` is run FROM WINDOWS: it regenerates ios/App/CapApp-SPM/Package.swift
// using the host OS's path separator for the local Swift Package
// dependencies' `path:` values, producing literal backslashes
// (e.g. "..\..\..\node_modules\@capacitor\app"). Swift Package Manager
// requires POSIX forward slashes in these path strings on every platform
// (Package.swift is portable Swift source, resolved by Xcode/SPM on macOS)
// — backslash is a Swift string-escape character, so this is not just a
// wrong path, it can fail to parse at all. This script normalizes those
// paths back to forward slashes after every `cap sync ios` run on Windows.
//
// Safe to run repeatedly (idempotent) and safe on macOS/Linux too (no-op
// there, since `cap sync ios` doesn't produce backslashes on those hosts).
//
// Wired up as `npm run cap:sync:ios`, which should be preferred over a bare
// `npx cap sync ios` on Windows until this is fixed upstream in Capacitor.

const fs = require("node:fs");
const path = require("node:path");

const target = path.join(__dirname, "..", "ios", "App", "CapApp-SPM", "Package.swift");

if (!fs.existsSync(target)) {
  console.log("[fix-ios-package-swift] No ios/App/CapApp-SPM/Package.swift found — skipping (iOS platform not added?).");
  process.exit(0);
}

const original = fs.readFileSync(target, "utf8");

// Only touch the local-package `path: "...\...\..."` string literals —
// leave URLs, target names, and everything else untouched.
const fixed = original.replace(/path:\s*"([^"]*)"/g, (match, rawPath) => {
  if (!rawPath.includes("\\")) return match;
  const normalized = rawPath.replace(/\\/g, "/");
  return `path: "${normalized}"`;
});

if (fixed === original) {
  console.log("[fix-ios-package-swift] Package.swift already uses forward slashes — nothing to do.");
  process.exit(0);
}

fs.writeFileSync(target, fixed);
console.log("[fix-ios-package-swift] Normalized backslash paths in Package.swift to forward slashes.");

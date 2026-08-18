// Generates the MARKETING WEBSITE's favicon set from the official transparent
// brand logo (public/ma-logo.png) — deliberately separate from
// scripts/build-pwa-icons.cjs, which builds the Capacitor/PWA APP's icon set
// from resources/icon*.png (a different source, composited onto a navy
// background square for the app-icon convention). Website favicons stay
// transparent — no square container, no background — except the Apple touch
// icon, which is flattened onto white because Safari renders a transparent
// apple-touch-icon as solid black otherwise (the one case where a background
// is genuinely required for readability, not a design choice).
//
// Run via `npm run build:website-favicons`. Output is committed to public/
// so it doesn't need to re-run on every build.
const sharp = require("sharp");
const path = require("path");

const SRC = path.join(__dirname, "..", "public", "ma-logo.png");
const OUT = path.join(__dirname, "..", "public");

async function main() {
  for (const size of [16, 32, 192, 512]) {
    await sharp(SRC)
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(OUT, `favicon-${size}.png`));
  }

  await sharp(SRC)
    .resize(180, 180, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .flatten({ background: "#ffffff" })
    .png()
    .toFile(path.join(OUT, "apple-touch-icon.png"));

  console.log("Website favicons written to public/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

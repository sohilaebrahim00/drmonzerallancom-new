// Generates the Web App Manifest icon set from the existing, approved
// Capacitor icon assets (resources/icon*.png) — never a generic
// Vite/placeholder icon. Run via `npm run build:pwa-icons`; output is
// committed to public/icons/ so it doesn't need to re-run on every build.
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const SRC = path.join(__dirname, "..", "resources");
const OUT = path.join(__dirname, "..", "public", "icons");

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  const flat = sharp(path.join(SRC, "icon.png"));

  for (const size of [192, 512]) {
    await sharp(path.join(SRC, "icon.png"))
      .resize(size, size)
      .png()
      .toFile(path.join(OUT, `icon-${size}.png`));
  }

  // Maskable icon: composite the same background+foreground layers used for
  // the native adaptive icon, so the brand-navy background fills the full
  // safe-zone circle/squircle instead of being clipped to a transparent edge.
  const background = await sharp(path.join(SRC, "icon-background.png")).resize(512, 512).toBuffer();
  await sharp(background)
    .composite([{ input: await sharp(path.join(SRC, "icon-foreground.png")).resize(512, 512).toBuffer() }])
    .png()
    .toFile(path.join(OUT, "icon-maskable-512.png"));

  // Apple touch icon: flattened onto the brand background (Safari renders
  // transparent regions as black otherwise), no alpha.
  await flat
    .clone()
    .resize(180, 180)
    .flatten({ background: "#17233b" })
    .png()
    .toFile(path.join(OUT, "apple-touch-icon.png"));

  console.log("PWA icons written to public/icons/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

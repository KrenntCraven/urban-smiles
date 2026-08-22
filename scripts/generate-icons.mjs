/**
 * Regenerates the Urban Smiles app icons from a single vector source.
 *
 *   node scripts/generate-icons.mjs
 *
 * Writes the shipped icons into src/app (Next.js file conventions) and a
 * contact sheet into design/icon-previews for review. The mark is defined once
 * below so every output stays identical across sizes.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const appDir = join(root, "src", "app");
const previewDir = join(root, "design", "icon-previews");

/**
 * A geometric "U" whose counter is a smile: the outer bowl is a true
 * semicircle, while the inner edge leaves the stems early and sweeps across on
 * a cubic that stays shallower than the bowl. That thickens the ink at the base
 * like a smile stroke and leaves a mouth-shaped negative space. The cubic's
 * control points sit directly below its endpoints so the curve is tangent to
 * the stems — an arc here kinks visibly at 512px. Filled rather than stroked so
 * it stays crisp when rasterised down to 16px.
 */
const MARK =
  "M13 17A5 5 0 0 1 23 17L23 30C23 41 41 41 41 30L41 17A5 5 0 0 1 51 17L51 33A19 19 0 0 1 13 33Z";

const ACCENT_LIGHT = "#0D9488"; // on light tab bars
const ACCENT_DARK = "#14B8A6"; // on dark tab bars and the dark tile
const SLATE = "#0F172A";

/** Tight square crop so the glyph fills a favicon instead of floating in it. */
const TIGHT_VIEWBOX = "9 9 46 46";

/** Transparent, theme-aware favicon for modern browsers. */
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${TIGHT_VIEWBOX}" role="img" aria-label="Urban Smiles">
  <style>
    .mark { fill: ${ACCENT_LIGHT}; }
    @media (prefers-color-scheme: dark) {
      .mark { fill: ${ACCENT_DARK}; }
    }
  </style>
  <path class="mark" d="${MARK}" />
</svg>
`;

const flatMarkSvg = (accent, viewBox = TIGHT_VIEWBOX) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"><path fill="${accent}" d="${MARK}"/></svg>`;

/** Full-bleed dark tile; iOS applies its own corner mask. */
const tileSvg = (background, accent) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${background}"/><path fill="${accent}" d="${MARK}"/></svg>`;

const render = (svg, size) =>
  sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();

/**
 * ICO container holding PNG payloads, which every browser in support has
 * understood since IE Vista. sharp cannot write .ico itself.
 */
function buildIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  let offset = 6 + images.length * 16;
  const entries = images.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });

  return Buffer.concat([
    header,
    ...entries,
    ...images.map(({ data }) => data),
  ]);
}

/** Rounded-corner preview of the tile — iOS masks the real file at runtime. */
async function roundedTile(size, background, accent) {
  const radius = Math.round(size * 0.2237);
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="#fff"/></svg>`,
  );
  return sharp(await render(tileSvg(background, accent), size))
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
}

async function tabPreview({ background, chrome, text, accent, label }) {
  const width = 520;
  const height = 132;
  const favicon = await render(flatMarkSvg(accent), 16);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect width="${width}" height="${height}" fill="${background}"/>
    <path d="M24 34 h248 a12 12 0 0 1 12 12 v42 h-272 v-42 a12 12 0 0 1 12 -12 z" fill="${chrome}"/>
    <text x="72" y="62" font-family="Inter, 'Segoe UI', system-ui, sans-serif" font-size="15" fill="${text}">Urban Smiles — Modern Den…</text>
    <text x="24" y="116" font-family="Inter, 'Segoe UI', system-ui, sans-serif" font-size="13" fill="${text}" opacity="0.55">${label}</text>
  </svg>`;

  return sharp(Buffer.from(svg))
    .composite([{ input: favicon, top: 45, left: 44 }])
    .png()
    .toBuffer();
}

/** Nearest-neighbour blow-up so pixel-level rasterisation is inspectable. */
const zoom = (buffer, factor) =>
  sharp(buffer)
    .resize({ width: null, height: null })
    .metadata()
    .then(({ width }) =>
      sharp(buffer)
        .resize(width * factor, width * factor, { kernel: "nearest" })
        .png()
        .toBuffer(),
    );

async function main() {
  await mkdir(previewDir, { recursive: true });

  await writeFile(join(appDir, "icon.svg"), iconSvg, "utf8");

  const appleIcon = await render(tileSvg(SLATE, ACCENT_DARK), 180);
  await writeFile(join(appDir, "apple-icon.png"), appleIcon);

  const icoSizes = [16, 32, 48];
  const icoImages = await Promise.all(
    icoSizes.map(async (size) => ({
      size,
      data: await render(flatMarkSvg(ACCENT_LIGHT), size),
    })),
  );
  await writeFile(join(appDir, "favicon.ico"), buildIco(icoImages));

  const previews = {
    "favicon-16.png": await render(flatMarkSvg(ACCENT_LIGHT), 16),
    "favicon-32.png": await render(flatMarkSvg(ACCENT_LIGHT), 32),
    "favicon-16@8x.png": await zoom(
      await render(flatMarkSvg(ACCENT_LIGHT), 16),
      8,
    ),
    "favicon-32@8x.png": await zoom(
      await render(flatMarkSvg(ACCENT_LIGHT), 32),
      8,
    ),
    "icon-512.png": await render(flatMarkSvg(ACCENT_LIGHT), 512),
    "apple-icon-180.png": appleIcon,
    "apple-icon-180-rounded.png": await roundedTile(180, SLATE, ACCENT_DARK),
    "tab-light.png": await tabPreview({
      background: "#E8EAED",
      chrome: "#FFFFFF",
      text: "#202124",
      accent: ACCENT_LIGHT,
      label: "Light browser tab",
    }),
    "tab-dark.png": await tabPreview({
      background: "#202124",
      chrome: "#35363A",
      text: "#E8EAED",
      accent: ACCENT_DARK,
      label: "Dark browser tab",
    }),
  };

  await Promise.all(
    Object.entries(previews).map(([name, data]) =>
      writeFile(join(previewDir, name), data),
    ),
  );

  console.log("Wrote src/app/{icon.svg,apple-icon.png,favicon.ico}");
  console.log(`Wrote ${Object.keys(previews).length} previews to design/icon-previews`);
}

await main();

import type { FileBlob } from "@/lib/booking/store";

/**
 * Synthetic ID and HMO card artwork for the demo seed, so the verification
 * queue can be reviewed without real patient documents.
 *
 * These are drawings of physical cards rather than site UI, so they use their
 * own card-stock colours instead of the design tokens, and every card carries a
 * SPECIMEN watermark so a screenshot can never be mistaken for a real document.
 *
 * SVG keeps the text sharp with no image encoder or binary blobs in the repo.
 * Real uploads are JPG, PNG, or WEBP (see ACCEPTED_DOCUMENT_TYPES); the browser
 * renders all of them through the same <img>, so the preview behaves the same.
 */

const CARD_WIDTH = 1012;
const CARD_HEIGHT = 638;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toBlob(svg: string, filename: string): FileBlob {
  const bytes = new TextEncoder().encode(svg);
  return {
    bytes,
    mimeType: "image/svg+xml",
    filename,
    size: bytes.byteLength,
  };
}

/** Fine concentric line-work, the way security printing fills dead space. */
function guilloche(color: string, opacity: number): string {
  const arcs: string[] = [];
  for (let index = 0; index < 26; index += 1) {
    const radius = 90 + index * 26;
    arcs.push(
      `<circle cx="${CARD_WIDTH - 120}" cy="${CARD_HEIGHT + 40}" r="${radius}" fill="none" stroke="${color}" stroke-width="1.1" />`,
    );
  }
  return `<g opacity="${opacity}">${arcs.join("")}</g>`;
}

function watermark(color = "#0f2a26", opacity = 0.07): string {
  return `<text x="${CARD_WIDTH / 2}" y="${CARD_HEIGHT / 2 + 40}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="130" font-weight="700" fill="${color}" opacity="${opacity}" transform="rotate(-18 ${CARD_WIDTH / 2} ${CARD_HEIGHT / 2})" letter-spacing="14">SPECIMEN</text>`;
}

/** Head-and-shoulders silhouette standing in for the ID portrait. */
function portrait(x: number, y: number, width: number, height: number): string {
  const centerX = x + width / 2;
  return `
    <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="10" fill="url(#portraitFill)" />
    <circle cx="${centerX}" cy="${y + height * 0.36}" r="${width * 0.22}" fill="#9fb4c9" />
    <path d="M ${centerX - width * 0.34} ${y + height} q ${width * 0.34} -${height * 0.42} ${width * 0.68} 0 Z" fill="#9fb4c9" />
    <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="10" fill="none" stroke="#8fa3b8" stroke-width="2" />
  `;
}

function field(
  x: number,
  y: number,
  label: string,
  value: string,
  size = 30,
): string {
  return `
    <text x="${x}" y="${y}" font-family="Helvetica, Arial, sans-serif" font-size="17" letter-spacing="2.4" fill="#5c6b7a">${escapeXml(label)}</text>
    <text x="${x}" y="${y + size + 4}" font-family="Helvetica, Arial, sans-serif" font-size="${size}" font-weight="700" fill="#12263a">${escapeXml(value)}</text>
  `;
}

export type SampleIdentity = {
  surname: string;
  givenNames: string;
  middleName: string;
  birthDate: string;
  sex: "F" | "M";
  address: string;
  idNumber: string;
};

export function governmentIdCard(identity: SampleIdentity): FileBlob {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}" role="img">
  <defs>
    <linearGradient id="cardFill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f7fafd" />
      <stop offset="100%" stop-color="#e6eef6" />
    </linearGradient>
    <linearGradient id="bandFill" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#0b3d6b" />
      <stop offset="100%" stop-color="#12608f" />
    </linearGradient>
    <linearGradient id="portraitFill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#dbe6f0" />
      <stop offset="100%" stop-color="#c2d3e3" />
    </linearGradient>
  </defs>

  <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" rx="26" fill="url(#cardFill)" />
  ${guilloche("#12608f", 0.13)}

  <rect width="${CARD_WIDTH}" height="104" rx="26" fill="url(#bandFill)" />
  <rect y="70" width="${CARD_WIDTH}" height="34" fill="#12608f" />
  <text x="44" y="46" font-family="Helvetica, Arial, sans-serif" font-size="21" letter-spacing="4" fill="#cfe3f3">REPUBLIC OF THE PHILIPPINES</text>
  <text x="44" y="84" font-family="Helvetica, Arial, sans-serif" font-size="30" font-weight="700" letter-spacing="1.4" fill="#ffffff">SPECIMEN IDENTIFICATION CARD</text>

  ${portrait(46, 150, 226, 282)}

  ${field(310, 186, "SURNAME", identity.surname)}
  ${field(310, 268, "GIVEN NAMES", identity.givenNames)}
  ${field(310, 350, "MIDDLE NAME", identity.middleName)}
  ${field(310, 432, "DATE OF BIRTH", identity.birthDate, 26)}
  ${field(640, 432, "SEX", identity.sex, 26)}

  <text x="46" y="474" font-family="Helvetica, Arial, sans-serif" font-size="17" letter-spacing="2.4" fill="#5c6b7a">ADDRESS</text>
  <text x="46" y="504" font-family="Helvetica, Arial, sans-serif" font-size="24" fill="#12263a">${escapeXml(identity.address)}</text>

  <text x="46" y="556" font-family="Helvetica, Arial, sans-serif" font-size="17" letter-spacing="2.4" fill="#5c6b7a">ID NUMBER</text>
  <text x="46" y="590" font-family="Helvetica, Arial, sans-serif" font-size="34" font-weight="700" letter-spacing="5" fill="#0b3d6b">${escapeXml(identity.idNumber)}</text>

  <path d="M 690 560 q 34 -40 68 -6 t 62 -14 q 30 -22 56 4" fill="none" stroke="#12263a" stroke-width="4" stroke-linecap="round" />
  <line x1="672" y1="592" x2="966" y2="592" stroke="#8fa3b8" stroke-width="2" />
  <text x="819" y="616" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="16" letter-spacing="2" fill="#5c6b7a">SIGNATURE</text>

  ${watermark()}
  <rect x="1" y="1" width="${CARD_WIDTH - 2}" height="${CARD_HEIGHT - 2}" rx="26" fill="none" stroke="#0b3d6b" stroke-width="2" opacity="0.4" />
</svg>`;

  return toBlob(svg, "government-id.svg");
}

export type SampleCoverage = {
  provider: string;
  memberName: string;
  memberId: string;
  plan: string;
  validUntil: string;
};

export function hmoCardFront(coverage: SampleCoverage): FileBlob {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}" role="img">
  <defs>
    <linearGradient id="hmoFill" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0e5d52" />
      <stop offset="55%" stop-color="#0f7c6b" />
      <stop offset="100%" stop-color="#12a58c" />
    </linearGradient>
  </defs>

  <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" rx="26" fill="url(#hmoFill)" />
  ${guilloche("#ffffff", 0.1)}

  <circle cx="82" cy="86" r="30" fill="#ffffff" opacity="0.9" />
  <path d="M 68 86 h 28 M 82 72 v 28" stroke="#0e5d52" stroke-width="9" stroke-linecap="round" />
  <text x="132" y="78" font-family="Helvetica, Arial, sans-serif" font-size="38" font-weight="700" letter-spacing="1" fill="#ffffff">${escapeXml(coverage.provider)}</text>
  <text x="132" y="108" font-family="Helvetica, Arial, sans-serif" font-size="19" letter-spacing="3.4" fill="#bfe6dd">HEALTH CARE PROGRAM</text>

  <rect x="46" y="196" width="104" height="78" rx="12" fill="#e9c877" />
  <path d="M 46 235 h 104 M 98 196 v 78 M 72 215 h 52 M 72 255 h 52" stroke="#b28f45" stroke-width="3" />

  <text x="46" y="330" font-family="Helvetica, Arial, sans-serif" font-size="18" letter-spacing="3" fill="#bfe6dd">MEMBER NAME</text>
  <text x="46" y="372" font-family="Helvetica, Arial, sans-serif" font-size="38" font-weight="700" fill="#ffffff">${escapeXml(coverage.memberName)}</text>

  <text x="46" y="432" font-family="Helvetica, Arial, sans-serif" font-size="18" letter-spacing="3" fill="#bfe6dd">MEMBER NUMBER</text>
  <text x="46" y="480" font-family="Helvetica, Arial, sans-serif" font-size="44" font-weight="700" letter-spacing="6" fill="#ffffff">${escapeXml(coverage.memberId)}</text>

  <text x="46" y="546" font-family="Helvetica, Arial, sans-serif" font-size="18" letter-spacing="3" fill="#bfe6dd">PLAN</text>
  <text x="46" y="582" font-family="Helvetica, Arial, sans-serif" font-size="27" font-weight="700" fill="#ffffff">${escapeXml(coverage.plan)}</text>

  <text x="966" y="546" text-anchor="end" font-family="Helvetica, Arial, sans-serif" font-size="18" letter-spacing="3" fill="#bfe6dd">VALID UNTIL</text>
  <text x="966" y="582" text-anchor="end" font-family="Helvetica, Arial, sans-serif" font-size="27" font-weight="700" fill="#ffffff">${escapeXml(coverage.validUntil)}</text>

  ${watermark("#ffffff", 0.16)}
</svg>`;

  return toBlob(svg, "hmo-card-front.svg");
}

export function hmoCardBack(coverage: SampleCoverage): FileBlob {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}" role="img">
  <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" rx="26" fill="#f2f5f4" />
  <rect y="60" width="${CARD_WIDTH}" height="96" fill="#16211f" />

  <rect x="46" y="200" width="620" height="62" rx="8" fill="#ffffff" stroke="#c4cecb" stroke-width="2" />
  <path d="M 70 244 q 40 -38 82 -8 t 74 -12 q 34 -20 64 6" fill="none" stroke="#12263a" stroke-width="4" stroke-linecap="round" />
  <text x="46" y="288" font-family="Helvetica, Arial, sans-serif" font-size="16" letter-spacing="2.4" fill="#5a6b67">AUTHORISED SIGNATURE</text>

  <text x="46" y="352" font-family="Helvetica, Arial, sans-serif" font-size="19" font-weight="700" letter-spacing="2.4" fill="#16211f">MEMBER ${escapeXml(coverage.memberId)}</text>
  <text x="46" y="396" font-family="Helvetica, Arial, sans-serif" font-size="20" fill="#3f4d4a">Present this card with a valid government-issued ID before</text>
  <text x="46" y="426" font-family="Helvetica, Arial, sans-serif" font-size="20" fill="#3f4d4a">any consultation or procedure. Card is non-transferable.</text>
  <text x="46" y="456" font-family="Helvetica, Arial, sans-serif" font-size="20" fill="#3f4d4a">Report a lost card within 24 hours.</text>

  <rect x="46" y="500" width="920" height="86" rx="12" fill="#e4ebe9" />
  <text x="70" y="536" font-family="Helvetica, Arial, sans-serif" font-size="18" letter-spacing="2.4" fill="#5a6b67">24/7 MEMBER HOTLINE</text>
  <text x="70" y="570" font-family="Helvetica, Arial, sans-serif" font-size="28" font-weight="700" fill="#16211f">(02) 8888 0000</text>
  <text x="942" y="556" text-anchor="end" font-family="Helvetica, Arial, sans-serif" font-size="22" font-weight="700" fill="#0e5d52">${escapeXml(coverage.provider)}</text>

  ${watermark()}
</svg>`;

  return toBlob(svg, "hmo-card-back.svg");
}

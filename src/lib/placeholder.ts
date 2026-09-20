/**
 * Generates a deterministic SVG placeholder image as a data URI, so the
 * scaffold has zero external image dependencies (no network calls, no
 * next/image remote-pattern config needed). Swap these out for real
 * product photography / CDN URLs once available - every place that calls
 * this only needs its `imageUrl` string replaced.
 */
export function placeholderImage(
  label: string,
  {
    width = 800,
    height = 1000,
    bg = "#e5e5e5",
    fg = "#737373",
    fontSize,
  }: {
    width?: number;
    height?: number;
    bg?: string;
    fg?: string;
    /** Override the auto-computed font size (useful for short labels
     * like a single initial in a small avatar circle). */
    fontSize?: number;
  } = {},
): string {
  // Callers pass "\n" to request a two-line label (e.g. "Moletom\nPreto"),
  // but a literal "\n" inside SVG/XML text content is just whitespace - it
  // does not break the line. Left as a single <text> node, that collapsed
  // into one long single-line string wide enough to overflow the viewBox
  // (visible as clipped/bleeding text in narrow tiles, e.g. the PDP
  // gallery). Splitting on "\n" into stacked <tspan> lines is what actually
  // makes each line render - and render short enough to fit - as intended.
  const size = fontSize ?? Math.round(width / 14);
  const lineHeight = size * 1.15;
  const lines = label.split("\n");
  const startY = height / 2 - ((lines.length - 1) * lineHeight) / 2;
  const tspans = lines
    .map((line, index) => `<tspan x="50%" y="${startY + index * lineHeight}">${escapeXml(line)}</tspan>`)
    .join("");

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="${bg}"/>
      <text dominant-baseline="middle" text-anchor="middle"
        font-family="Helvetica, Arial, sans-serif" font-size="${size}"
        fill="${fg}" letter-spacing="1">${tspans}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * A mock user "photo" as a data URI - a soft gradient backdrop (like an
 * out-of-focus portrait background) behind a colored head/hair/shirt
 * illustration, rather than a flat single-tone silhouette. The flat
 * version read too much like a generic "no photo" glyph (same visual
 * language as the signed-out sign-in icon) instead of previewing what a
 * real user photo will look like in that circular slot. Used to preview
 * <UserAvatar/>'s real end state (header + <FloatingDock/>) before real
 * auth/profile photos exist, without any network dependency (same
 * zero-external-image reasoning as `placeholderImage`). Swap for the
 * real `user.avatarUrl` once accounts are wired up.
 */
export function placeholderAvatar({
  skin = "#d9a066",
  hair = "#2b2320",
  shirt = "#3f3f46",
  bgFrom = "#ede1d3",
  bgTo = "#c9b8a3",
}: {
  skin?: string;
  hair?: string;
  shirt?: string;
  bgFrom?: string;
  bgTo?: string;
} = {}): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <defs>
        <radialGradient id="bg" cx="50%" cy="38%" r="75%">
          <stop offset="0%" stop-color="${bgFrom}"/>
          <stop offset="100%" stop-color="${bgTo}"/>
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="100" fill="url(#bg)"/>
      <path d="M28 194c8-50 38-74 72-74s64 24 72 74" fill="${shirt}"/>
      <circle cx="100" cy="82" r="38" fill="${skin}"/>
      <path d="M62 70c0-24 17-40 38-40s38 16 38 40c0 4-1 8-2 12-6-10-18-16-36-16s-30 6-36 16c-1-4-2-8-2-12Z" fill="${hair}"/>
    </svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
